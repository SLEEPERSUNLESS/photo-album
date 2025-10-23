"use client";

import React, { useEffect, useState } from "react";
import { use } from 'react';
import Link from "next/link";
import { apiFetch } from '../../../../lib/api';
import { FaArrowLeft, FaShare, FaDownload } from "react-icons/fa";
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
    photos: Photo[];
}

export default function AlbumDetail({ params }: { params: { slug: string } }) {
    const { slug } = use(params);
    const [albumData, setAlbumData] = useState<AlbumData>({ photos: [] });
    const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAlbumPhotos = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`/albums/${slug}/`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch album with slug "${slug}"`);
                }

                const data = await response.json();
                setAlbumData({ photos: data });
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
            // Deselect all
            setSelectedPhotos([]);
        } else {
            // Select all
            setSelectedPhotos(allPhotoIds);
        }
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
                        <button className="flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800">
                            <FaDownload className="mr-2" />
                            <span>Kup cały album</span>
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
                        <button className="flex items-center p-2 bg-slate-200 rounded-md border-none font-medium">
                            <HiMiniSquares2X2 />
                        </button>
                        <button className="flex items-center p-2 rounded-md border-none font-medium">
                            <FaList />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {albumData.photos.map((photo) => (
                        <div key={photo.id} className="group relative aspect-square bg-slate-200 rounded-md shadow-sm overflow-hidden">
                            <div className="absolute inset-0 transition-opacity ease-out duration-500 bg-gradient-to-t from-slate-900 to-transparent to-30% opacity-0 group-hover:opacity-50"></div>
                            <span className="absolute bottom-4 right-1/3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Powiększ mnie</span>
                            <input
                                type="checkbox"
                                id={`photo-${photo.id}`}
                                checked={selectedPhotos.includes(photo.id)}
                                onChange={() => handlePhotoSelect(photo.id)}
                                className="absolute top-2 right-2 w-4 h-4 text-slate-100 bg-slate-50 border-slate-300 rounded-sm"
                            />
                            <img src={photo.url} alt={photo.title || "Album photo"} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="sticky w-full h-16 bottom-0 left-0 right-0 bg-white border-t border-slate-200">
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-row justify-between items-center">
                    <div className="checkoutWrapperLeft flex flex-row items-center gap-4">
                        <span className="text-slate-500">Zaznaczone: {selectedPhotos.length}</span>
                    </div>
                    <div className="checkoutWrapperRight">
                        <Link href="/cart" className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:bg-slate-400">
                            Przejdź do koszyka
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}