import React from "react";
import { FaFilter} from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { FaCamera } from "react-icons/fa";
import { MdPhotoLibrary } from "react-icons/md";
import Link from "next/link";

export default function Albums() {
  return (
    <div className="flex flex-col items-center bg-slate-50 border-t border-b border-slate-200 flex-grow justify-center">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="YourAlbumsHeaderWrapper flex flex-row justify-between">
        <h1 className="text-3xl font-bold text-slate-700 mb-8">Twoje Albumy</h1>  
        <div className="YourAlbumsHeaderButtonsWrapper flex flex-row gap-2">
          <div className="inputWrapper bg-white flex items-center flex-row gap-2 h-10 rounded-md border-1 border-slate-300 p-2">
            <FaSearch className="text-slate-400" />
            <input type="text" placeholder="Szukaj albumu..." className="w-full outline-none border-none" />
          </div>
          <button className="h-10 bg-white rounded-md border-1 border-slate-300 p-2">
            <span className="text-slate-600 flex flex-row items-center gap-2 font-medium px-2">
              <FaFilter />
              <span>Filtruj</span>
            </span>
          </button>
        </div> 
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {[1, 2, 3, 4, 5].map((item) => (
            <Link key={item} href={`/albums/${item}`} className="cursor-pointer transition-transform hover:scale-[1.01]">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative h-48 bg-slate-500 flex flex-col items-end p-3">
                  <MdPhotoLibrary className="text-slate-300 text-4xl absolute inset-0 m-auto" />
                  <div className="p-1 px-3 bg-slate-700 text-slate-50 flex items-center flex-row gap-2 rounded-full text-xs font-semibold">
                    <FaCamera className="mb-0.5" /> 
                    <span>280 zdjęć</span>
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-slate-700">Album {item}</h2>
                  <p className="text-slate-500 text-sm">Data: {new Date().toLocaleDateString()}</p>
                  <div className="flex flex-row justify-between gap-2 mt-8">
                    <p className="text-slate-600 text-sm">Ostatnio odwiedzany: 2 dni temu</p>
                    <FaArrowRight className="text-slate-500" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 