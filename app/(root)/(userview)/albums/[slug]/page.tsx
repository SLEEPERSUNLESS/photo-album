"use client";

import React, { useEffect, useState } from "react";
import { use } from 'react';
import Link from "next/link";
import { apiFetch } from '../../../../lib/api';
import { useCart } from '../../../../lib/CartProvider';
import { FaArrowLeft, FaShare, FaDownload, FaShoppingCart, FaArrowRight } from "react-icons/fa";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { FaFilter, FaList } from "react-icons/fa6";
import { HiMiniSquares2X2 } from "react-icons/hi2";

interface Photo {
    id: number;
    title: string;
    url: string;
    album: number;
}

interface AlbumData {
    title?: string;
    photos: Photo[];
}

export default function AlbumDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [albumData, setAlbumData] = useState<AlbumData>({ photos: [] });
    const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enlargedPhoto, setEnlargedPhoto] = useState<Photo | null>(null);
    const { addItem, isInCart, getTotalItems } = useCart();

    useEffect(() => {
        const fetchAlbumPhotos = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`/albums/${slug}/`);
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

    const handleNext = () => {
        if (!enlargedPhoto || albumData.photos.length === 0) return;
        const idx = albumData.photos.findIndex(p => p.id === enlargedPhoto.id);
        if (idx === -1) return;
        const nextIdx = (idx + 1) % albumData.photos.length; // loop to first
        setEnlargedPhoto(albumData.photos[nextIdx]);
    };

    const handlePrev = () => {
        if (!enlargedPhoto || albumData.photos.length === 0) return;
        const idx = albumData.photos.findIndex(p => p.id === enlargedPhoto.id);
        if (idx === -1) return;
        const prevIdx = (idx - 1 + albumData.photos.length) % albumData.photos.length; // loop to last
        setEnlargedPhoto(albumData.photos[prevIdx]);
    };

    const handlePhotoSelect = (photoId: number) => {
        setSelectedPhotos(prev => {
            if (prev.includes(photoId)) {
                return prev.filter(id => id !== photoId);
            } else {
                return [...prev, photoId];
            }
        });
    };

    const handleSelectAll = () => {
        const allPhotoIds = albumData.photos.map(photo => photo.id);
        const allSelected = allPhotoIds.every(id => selectedPhotos.includes(id));
        
        if (allSelected) {
            setSelectedPhotos([]);
        } else {
            setSelectedPhotos(allPhotoIds);
        }
    };

    const handleAddToCart = () => {
        selectedPhotos.forEach(photoId => {
            const photo = albumData.photos.find(p => p.id === photoId);
            if (photo && !isInCart(photo.id)) {
                addItem({
                    id: photo.id,
                    title: photo.title,
                    url: photo.url,
                    album: photo.album,
                    albumTitle: albumData.title,
                });
            }
        });
        setSelectedPhotos([]);
    };

    const handlePhotoEnlarge = (photo: Photo) => {
        setEnlargedPhoto(photo);
    };

    const handleCloseEnlarged = () => {
        setEnlargedPhoto(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading album...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col items-center bg-slate-50 border-t border-slate-200 flex-grow">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/albums" className="flex items-center text-slate-600 hover:text-slate-900">
                        <FaArrowLeft className="mr-2" />
                        <span>Powrót do albumów</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center h-8 px-4 bg-slate-200 rounded-2xl text-slate-700">
                            <IoIosCheckmarkCircle className="mr-2" />
                            <span>Zaznaczone: {selectedPhotos.length}</span>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={selectedPhotos.length === 0}
                            className="flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:bg-slate-400"
                        >
                            <FaShoppingCart className="mr-2" />
                            <span>Dodaj do koszyka</span>
                        </button>
                    </div>
                </div>

                <div className="mb-8 flex flex-row gap-2 justify-between">
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
                        <button className="flex items-center px-4 py-2 bg-white rounded-md border border-slate-300 font-medium text-slate-600 hover:text-slate-900">
                            <FaFilter className="mr-2" />
                            <span>Filtruj</span>
                        </button>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                        <span>Widok: </span>
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
                        <div key={photo.id} className="group relative aspect-square bg-slate-200 rounded-md shadow-sm overflow-hidden">
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"></div>
                            <span className="pointer-events-none absolute bottom-4 right-1/3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">Powiększ mnie</span>
                            <input
                                type="checkbox"
                                id={`photo-${photo.id}`}
                                checked={selectedPhotos.includes(photo.id)}
                                onChange={() => handlePhotoSelect(photo.id)}
                                className="absolute top-2 right-2 w-4 h-4 text-slate-100 bg-slate-50 border-slate-300 rounded-sm z-40"
                                aria-label={`Zaznacz zdjęcie ${photo.title || ''}`}
                                title="Zaznacz zdjęcie"
                            />
                            <button
                                onClick={() => handlePhotoSelect(photo.id)}
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
                            <img src={photo.url} alt={photo.title || "Album photo"} className="w-full h-full object-cover z-0" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="sticky w-full h-16 bottom-0 left-0 right-0 bg-white border-t border-slate-200">
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-row justify-between items-center">
                    <div className="checkoutWrapperLeft flex flex-row items-center gap-4">
                        <span className="text-slate-500">Zaznaczone: {selectedPhotos.length}</span>
                        <span className="text-slate-500">Koszyk: {getTotalItems()} zdjęć</span>
                    </div>
                    <div className="checkoutWrapperRight">
                        <Link href="/cart" className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:bg-slate-400">
                            <FaShoppingCart className="mr-2 inline" />
                            Przejdź do koszyka ({getTotalItems()})
                        </Link>
                    </div>
                </div>
            </div>

            {enlargedPhoto && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]"
                    onClick={handleCloseEnlarged}
                >
                    {/* Navigation arrows anchored to viewport */}
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

                    {/* Image wrapper sized to the rendered image so the close button sits on the photo */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={enlargedPhoto.url}
                            alt={enlargedPhoto.title || "Powiększone zdjęcie"}
                            className="block max-w-[90vw] max-h-[80vh] object-contain select-none"
                        />
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
        </div>
    );
}