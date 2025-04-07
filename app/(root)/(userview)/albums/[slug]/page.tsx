import React from "react";
import Link from "next/link";
import { FaArrowLeft, FaShare, FaDownload } from "react-icons/fa";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { FaFilter, FaList } from "react-icons/fa6";
import { HiMiniSquares2X2 } from "react-icons/hi2";

export default async function AlbumDetail(props: { params: { slug: string } }) {
    const { slug } = await props.params;

    console.log("Received slug:", slug); // Debug to check the slug value

    if (!slug) {
        throw new Error("Slug is undefined!");
    }

    const res = await fetch(`http://localhost:8000/albums/${slug}/`);

    if (!res.ok) {
        throw new Error(`Failed to fetch album with slug "${slug}"`);
    }

    const albumData = await res.json();

    return (
        <div className="flex flex-col items-center bg-slate-50 border-t border-slate-200 flex-grow">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/albums" className="flex items-center text-slate-600 hover:text-slate-900">
                        <FaArrowLeft className="mr-2" />
                        <span>Powrót do albumów</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center transition-all duration-200 px-4 py-2 rounded-md text-slate-300 hover:text-slate-700 pointer-events-auto">
                            <FaShare className="mr-2" />
                            <span>Udostępnij</span>
                        </button>
                        <div className="flex items-center h-8 px-4 bg-slate-200 rounded-2xl text-slate-700">
                            <IoIosCheckmarkCircle className="mr-2" />
                            <span>Zaznaczone: 0</span>
                        </div>
                        <button className="flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800">
                            <FaDownload className="mr-2" />
                            <span>Kup cały album</span>
                        </button>
                    </div>
                </div>

                <div className="mb-8 flex flex-row gap-2 justify-between">
                    <div className="flex flex-row gap-2">
                        <button className="flex items-center px-4 py-2 bg-white rounded-md border-1 border-slate-300 font-medium text-slate-600 hover:text-slate-900">
                            <IoIosCheckmarkCircle className="mr-2" />
                            <span>Kup cały album</span>
                        </button>
                        <button className="flex items-center px-4 py-2 bg-white rounded-md border-1 border-slate-300 font-medium text-slate-600 hover:text-slate-900">
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
                        <div key={photo.id} className="group relative aspect-square bg-slate-500 rounded-md shadow-sm overflow-hidden">
                            <div className="absolute inset-0 transition-opacity ease-out duration-500 bg-gradient-to-t from-slate-50 to-transparent to-30% opacity-0 group-hover:opacity-15"></div>
                            <span className="absolute bottom-4 right-1/3 text-slate-50 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Powiększ mnie</span>
                            <input type="checkbox" id={`photo-${photo.id}`} className="absolute top-2 right-2 w-4 h-4 text-slate-100 bg-slate-50 border-slate-300 rounded-sm" />
                            <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="sticky w-full h-16 bottom-0 left-0 right-0 bg-white border-t border-slate-200">
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-row justify-between items-center">
                    <div className="checkoutWrapperLeft flex flex-row items-center gap-4">
                        <span className="text-slate-500">Zaznaczone: 0</span>
                        <span className="text-slate-500">Cały koszt: 0 zł</span>
                    </div>
                    <div className="checkoutWrapperRight">
                        <button className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800">
                            Przejdź do płatności
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 