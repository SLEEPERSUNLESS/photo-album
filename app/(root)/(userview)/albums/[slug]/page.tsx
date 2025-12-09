"use client";

import React, { useEffect, useState, useMemo } from "react";
import { use } from 'react';
import { apiFetch } from '../../../../lib/api';
import { useCart } from '../../../../lib/CartProvider';
import { FaArrowLeft, FaShare, FaDownload, FaShoppingCart, FaArrowRight } from "react-icons/fa";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { FaList } from "react-icons/fa6";
import { HiMiniSquares2X2 } from "react-icons/hi2";
import { toast } from "sonner";

function getPhotoUrl(url: string): string {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
    if (!token || !url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
}

interface Photo {
    id: number;
    uuid: string;
    title: string;
    url: string;
    album: number;
    price: number;
}

interface AlbumData {
    title?: string;
    photos: Photo[];
}

export default function AlbumDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [albumData, setAlbumData] = useState<AlbumData>({ photos: [] });
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enlargedPhoto, setEnlargedPhoto] = useState<Photo | null>(null);
    const [justAdded, setJustAdded] = useState(false);
    const { addItem, isInCart, getTotalItems } = useCart();

    useEffect(() => {
        const fetchAlbumPhotos = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`/api/albums/${slug}/`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch album with slug "${slug}"`);
                }

                const data = await response.json();
                setAlbumData({ title: data.title, photos: data.photos || data });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching album photos:', error);
                setError('Failed to load photos. Please try again later.');
                setLoading(false);
            }
        };

        if (slug) {
            fetchAlbumPhotos();
        }
    }, [slug]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!enlargedPhoto) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                handleCloseEnlarged();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                handleNext();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                handlePrev();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enlargedPhoto, albumData.photos]);

    useEffect(() => {
        if (!enlargedPhoto) return;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

        let canScroll = true;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (!canScroll) return;
            canScroll = false;
            e.deltaY > 0 ? handleNext() : handlePrev();
            setTimeout(() => canScroll = true, 300);
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.documentElement.style.setProperty('--scrollbar-width', '0px');
            window.removeEventListener('wheel', handleWheel);
        };
    }, [enlargedPhoto, albumData.photos]);

    const handleNext = () => {
        const idx = albumData.photos.findIndex(p => p.uuid === enlargedPhoto?.uuid);
        if (idx < albumData.photos.length - 1) setEnlargedPhoto(albumData.photos[idx + 1]);
    };

    const handlePrev = () => {
        const idx = albumData.photos.findIndex(p => p.uuid === enlargedPhoto?.uuid);
        if (idx > 0) setEnlargedPhoto(albumData.photos[idx - 1]);
    };

    const handlePhotoSelect = (photoUuid: string) => {
        setSelectedPhotos(prev => {
            if (prev.includes(photoUuid)) {
                return prev.filter(uuid => uuid !== photoUuid);
            } else {
                return [...prev, photoUuid];
            }
        });
    };

    const handleSelectAll = () => {
        const allPhotoUuids = albumData.photos.map(photo => photo.uuid);
        const allSelected = allPhotoUuids.every(uuid => selectedPhotos.includes(uuid));
        
        if (allSelected) {
            setSelectedPhotos([]);
        } else {
            setSelectedPhotos(allPhotoUuids);
        }
    };

    const handleAddToCart = () => {
        let addedCount = 0;
        selectedPhotos.forEach(photoUuid => {
            const photo = albumData.photos.find(p => p.uuid === photoUuid);
            if (photo && !isInCart(photo.id)) {
                addItem({
                    id: photo.id,
                    title: photo.title,
                    url: photo.url,
                    album: photo.album,
                    albumTitle: albumData.title,
                    price: photo.price,
                });
                addedCount++;
            }
        });
        if (addedCount > 0) {
            toast.success(`Dodano ${addedCount} zdjęć do koszyka`);
            setJustAdded(true);
        } else {
            toast.info('Wybrane zdjęcia są już w koszyku');
        }
        setTimeout(() => {
            setSelectedPhotos([]);
            setJustAdded(false);
        }, 800);
    };

    const handlePhotoEnlarge = (photo: Photo) => {
        setEnlargedPhoto(photo);
    };

    const handleCloseEnlarged = () => {
        setEnlargedPhoto(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Wczytuję album...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col items-center bg-slate-50 border-t border-slate-200 flex-grow pb-20">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex flex-row gap-2 justify-between items-center">
                    <div className="flex flex-row gap-2">
                        <button 
                            onClick={handleSelectAll}
                            className="flex items-center px-4 py-2 bg-white rounded-md border border-slate-300 font-medium text-slate-600 hover:text-slate-900"
                        >
                            <IoIosCheckmarkCircle className="mr-2" />
                            <span>
                                {albumData.photos.length > 0 && selectedPhotos.length === albumData.photos.length 
                                    ? 'Odznacz wszystkie' 
                                    : 'Zaznacz wszystkie'}
                            </span>
                        </button>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                        <span className="text-slate-600">Widok: </span>
                        <button
                            className="flex items-center p-2 bg-slate-200 rounded-md border-none font-medium"
                            aria-label="Widok siatki"
                            title="Widok siatki"
                        >
                            <HiMiniSquares2X2 />
                        </button>
                        <button
                            className="flex items-center p-2 rounded-md border-none font-medium"
                            aria-label="Widok listy"
                            title="Widok listy"
                        >
                            <FaList />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {albumData.photos.map((photo) => (
                        <div key={photo.uuid} className="group relative aspect-square bg-slate-200 rounded-md shadow-sm overflow-hidden">
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"></div>
                            <span className="pointer-events-none absolute bottom-4 right-1/3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">Powiększ mnie</span>
                            <input
                                type="checkbox"
                                id={`photo-${photo.uuid}`}
                                checked={selectedPhotos.includes(photo.uuid)}
                                onChange={() => handlePhotoSelect(photo.uuid)}
                                className="absolute top-2 right-2 w-4 h-4 text-slate-100 bg-slate-50 border-slate-300 rounded-sm z-40"
                                aria-label={`Zaznacz zdjęcie ${photo.title || ''}`}
                                title="Zaznacz zdjęcie"
                            />
                            <button
                                onClick={() => handlePhotoSelect(photo.uuid)}
                                className="absolute inset-x-0 top-0 bottom-1/2 z-10 cursor-default"
                                aria-label={`Zaznacz lub odznacz zdjęcie ${photo.title || ''}`}
                                title="Zaznacz/odznacz"
                            />
                            <button
                                onClick={() => handlePhotoEnlarge(photo)}
                                className="absolute inset-x-0 top-1/2 bottom-0 z-10 cursor-default"
                                aria-label={`Powiększ zdjęcie ${photo.title || 'bez tytułu'}`}
                                title="Powiększ zdjęcie"
                            />
                            <img src={getPhotoUrl(photo.url)} alt={photo.title || "Album photo"} className="w-full h-full object-cover z-0" />
                        </div>
                    ))}
                </div>
            </div>

            {enlargedPhoto && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]"
                    onClick={handleCloseEnlarged}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50 z-[70]"
                        aria-label="Poprzednie zdjęcie"
                    >
                        <FaArrowLeft />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50 z-[70]"
                        aria-label="Następne zdjęcie"
                    >
                        <FaArrowRight />
                    </button>

                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={getPhotoUrl(enlargedPhoto.url)}
                            alt={enlargedPhoto.title || "Powiększone zdjęcie"}
                            className="block max-w-[90vw] max-h-[80vh] object-contain select-none"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded">
                            {enlargedPhoto.title || "Bez tytułu"} - {enlargedPhoto.price} zł
                        </div>
                        <button
                            onClick={handleCloseEnlarged}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl leading-none z-[70]"
                            aria-label="Zamknij powiększone zdjęcie"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className={`fixed bottom-0 left-0 bg-white border-t border-slate-200 shadow-lg transform transition-transform duration-300 z-40 ${selectedPhotos.length > 0 ? 'translate-y-0' : 'translate-y-full'}`} style={{ right: 'var(--scrollbar-width, 0px)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-700">
                            <IoIosCheckmarkCircle className="text-slate-500" />
                            <span>Zaznaczone: <strong>{selectedPhotos.length}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                            <FaShoppingCart className="text-slate-500" />
                            <span>Koszyk: <strong>{getTotalItems()}</strong> zdjęć</span>
                        </div>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={justAdded}
                        className={`flex items-center justify-center w-48 whitespace-nowrap px-5 py-2 rounded-md border transition-all duration-300 ${justAdded ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-700 text-white border-transparent hover:bg-slate-800'}`}
                    >
                        <FaShoppingCart className="mr-2" />
                        <span>{justAdded ? 'Dodano!' : 'Dodaj do koszyka'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}