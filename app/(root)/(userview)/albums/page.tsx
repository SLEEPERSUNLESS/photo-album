"use client";

import React, { useEffect, useState } from "react";
import { FaFilter } from "react-icons/fa6";
import { FaSearch, FaArrowRight, FaCamera, FaAngleLeft, FaAngleRight } from "react-icons/fa";
import Link from "next/link";
import { apiFetch } from '../../../lib/api';

interface Album {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  slug: string;
  photo_count: number;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Album[];
}

export default function Albums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [previousPageUrl, setPreviousPageUrl] = useState<string | null>(null);
  
  // definicja rozmiaru strony - tylko do kalkulacji, nie zmieniac
  const pageSize = 6;

  const fetchAlbums = async (page: number, search: string = "", isSearchUpdate: boolean = false) => {
    try {
      if (!isSearchUpdate) {
        setLoading(true);
      }
  let url = `/albums/?page=${page}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      console.log(`Fetching albums from: ${url}`);
  const response = await apiFetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }
      
      const data: PaginatedResponse = await response.json();
      console.log('Pagination data:', {
        count: data.count,
        next: data.next,
        previous: data.previous,
        resultsLength: data.results.length
      });
      
      setAlbums(data.results);
      setTotalAlbums(data.count);
      setTotalPages(Math.ceil(data.count / pageSize));
      setNextPageUrl(data.next);
      setPreviousPageUrl(data.previous);
      if (!isSearchUpdate) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      setError('Failed to load albums. Please try again later.');
      if (!isSearchUpdate) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAlbums(currentPage, searchQuery, false);
  }, [currentPage]);

  useEffect(() => {
    fetchAlbums(1, searchQuery, true);
    setCurrentPage(1);
  }, [searchQuery]);


  // Strzałka na nastepna strone
  const goToNextPage = () => {
    if (!nextPageUrl) return;
    
    try {
      // ekstraktuje numer strony z nextPageUrl JSON
      const url = new URL(nextPageUrl);
      const nextPage = url.searchParams.get('page');
      if (nextPage) {
        setCurrentPage(parseInt(nextPage, 10));
      }
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error parsing next page URL:', error);
    }
  };

  // Strzałka na poprzednia strone
  const goToPreviousPage = () => {
    if (!previousPageUrl) return;
    
    try {
      // ekstraktuje numer strony z previousPageURL JSON
      const url = new URL(previousPageUrl);
      const prevPage = url.searchParams.get('page');
      if (prevPage) {
        setCurrentPage(parseInt(prevPage, 10));
      } else {
        setCurrentPage(1);
      }
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error parsing previous page URL:', error);
    }
  };

  // Klikanie w numer strony -> 1,2,3,4,5,6 przenosi na strony 1,2,3,4,5,6
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    console.log(`Navigating to page ${page}`);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderPagination = () => {
    // nie renderuje paginacji jesli jest tylko jedna strona
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 6; // Ilosc numerkow w paginacji - jesli dasz na jeden to bedzie: < 1 >  jesli dasz na 2 to bedzie: < 1 | 2 > itd.
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    
    // Numerki stron
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded cursor-pointer ${currentPage === i ? 'bg-slate-200 font-medium' : 'hover:bg-slate-100'}`}
        >
          {i}
        </button>
      );
    }
    
    // przyciski do paginacji
    return (
      <div className="flex items-center justify-center space-x-1 mt-6">
        <button
          onClick={goToPreviousPage}
          disabled={!previousPageUrl}
          className={`p-2 rounded ${!previousPageUrl ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 cursor-pointer'}`}
          aria-label="Previous page"
        >
          <FaAngleLeft />
        </button>
        {pages}
        <button
          onClick={goToNextPage}
          disabled={!nextPageUrl}
          className={`p-2 rounded ${!nextPageUrl ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 cursor-pointer'}`}
          aria-label="Next page"
        >
          <FaAngleRight />
        </button>
      </div>
    );
  };

  // kalkuluje zakres wyswietlanych albumow
  // np. 1-6 z 9 albumow
  const getDisplayRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalAlbums);
    return `${start}-${end}`;
  };

  return (
    <div className="flex flex-col items-center bg-slate-50 border-t border-b border-slate-200 flex-grow justify-center">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="YourAlbumsHeaderWrapper flex flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-700">Twoje Albumy</h1>  
          <div className="YourAlbumsHeaderButtonsWrapper flex flex-row gap-2">
            <div className="inputWrapper bg-white flex items-center flex-row gap-2 h-10 rounded-md border border-slate-300 p-2">
              <FaSearch className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Szukaj albumu..." 
                className="w-full outline-none border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="h-10 bg-white rounded-md border border-slate-300 p-2">
              <span className="text-slate-600 flex flex-row items-center gap-2 font-medium px-2">
                <FaFilter />
                <span>Filtruj</span>
              </span>
            </button>
          </div> 
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-700"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : albums.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {searchQuery ? 'Nie znaleziono albumów pasujących do wyszukiwania.' : 'Nie znaleziono albumów.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {albums.map((album) => (
                <Link key={album.id} href={`/albums/${album.slug}`} className="cursor-pointer transition-transform hover:scale-[1.01]">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="relative h-48 bg-slate-500 flex flex-col items-end">
                      <img src={album.thumbnail} className="w-full h-full object-cover" alt={album.title} />
                      <div className="absolute p-1 px-3 bg-slate-700 text-slate-50 flex items-center flex-row gap-2 rounded-full text-xs font-semibold">
                        <FaCamera className="mb-0.5" /> 
                        <span>{album.photo_count} zdjęć</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h2 className="text-xl font-semibold text-slate-700">{album.title}</h2>
                      <p className="text-slate-500 text-sm">{album.description}</p>
                      <div className="flex flex-row justify-between gap-2 mt-8">
                        <p className="text-slate-600 text-sm">Ostatnio odwiedzany: 2 dni temu</p>
                        <FaArrowRight className="text-slate-500" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {renderPagination()}
            
            <div className="text-center text-slate-500 mt-4">
              Strona {currentPage} z {totalPages} | Pokazuje {getDisplayRange()} z {totalAlbums} albumów
            </div>
          </>
        )}
      </div>
    </div>
  );
}