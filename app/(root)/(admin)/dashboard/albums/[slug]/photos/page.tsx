"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../../../lib/api";
import { FaArrowLeft, FaTrash, FaPlus } from "react-icons/fa";
import LazyImage from "../../../../../../../components/LazyImage";

function getPhotoUrl(url: string): string {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
    if (!token || !url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
}

interface PhotoItem { id: number; title: string; url: string; price: number; uuid: string }

export default function AlbumPhotosPage() {
  const { slug } = useParams() as { slug: string };
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setLoadedCount(0);
    const r = await apiFetch(`/api/albums/${slug}/`);
    const data = await r.json();
    setPhotos(data?.photos || data?.results || (Array.isArray(data) ? data : []));
    setLoading(false);
  }

  useEffect(() => { if (slug) load(); }, [slug]);

  function addFiles(fileList: FileList | File[]) {
    const valid = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...valid]);
  }

  async function upload() {
    if (!files.length) return;
    setUploading(true);
    const form = new FormData();
    files.forEach(f => form.append('photos', f));
    const r = await apiFetch(`/api/albums/${slug}/`, { method: 'POST', body: form });
    if (r.ok) { setFiles([]); load(); }
    else setMessage('Błąd przesyłania');
    setUploading(false);
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard?tab=albums" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
          <FaArrowLeft className="mr-2" /> Wróć do albumów
        </Link>

        <h1 className="text-3xl font-bold text-slate-700 mb-8">Zdjęcia w albumie</h1>

        {message && <p className="text-sm text-red-600 mb-4 bg-red-50 p-4 rounded-xl">{message}</p>}

        {/* Upload section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? 'border-slate-500 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
          >
            <FaPlus className="mx-auto text-slate-400 mb-3" size={24} />
            <p className="text-slate-600">Przeciągnij zdjęcia lub <span className="text-slate-700 font-medium underline">kliknij aby wybrać</span></p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-600">Wybrano {files.length} plików</span>
                <button onClick={() => setFiles([])} className="text-sm text-red-500 hover:text-red-700">Wyczyść</button>
              </div>
              <div className="grid grid-cols-6 gap-3 mb-6">
                {files.slice(0, 11).map((f, i) => (
                  <div key={i} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden group">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-sm opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
                {files.length > 11 && <div className="aspect-square bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 font-medium">+{files.length - 11}</div>}
              </div>
              <button onClick={upload} disabled={uploading} className="w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium">
                {uploading ? 'Przesyłanie...' : 'Dodaj zdjęcia'}
              </button>
            </div>
          )}
        </div>

        {/* Photos list */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-700">
              W albumie: {photos.length} {photos.length > 20 && !showAll && <span className="text-slate-400 font-normal">(wyświetlono 20)</span>}
            </h2>
            {photos.length > 20 && !showAll && (
              <button onClick={() => setShowAll(true)} className="text-sm text-slate-600 hover:text-slate-900 font-medium underline">
                Wyświetl wszystkie
              </button>
            )}
            {showAll && photos.length > 20 && (
              <button onClick={() => setShowAll(false)} className="text-sm text-slate-600 hover:text-slate-900 font-medium underline">
                Pokaż mniej
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-slate-500">Ładowanie...</p>
          ) : photos.length === 0 ? (
            <p className="text-slate-500">Brak zdjęć</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(showAll ? photos : photos.slice(0, 20)).map((p, index) => (
                  <div key={p.uuid} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden">
                    <LazyImage 
                      src={getPhotoUrl(p.url)} 
                      alt={p.title} 
                      className="w-full h-full object-cover"
                      index={index}
                      placeholderClassName="rounded-xl"
                      canLoad={index <= loadedCount}
                      onLoaded={() => setLoadedCount(prev => prev + 1)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                    <button onClick={() => apiFetch(`/api/albums/${slug}/photos/${p.uuid}/`, { method: 'DELETE' }).then(load)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                      <span className="text-white text-sm font-medium">{p.price} zł</span>
                    </div>
                  </div>
                ))}
              </div>
              {photos.length > 20 && !showAll && (
                <div className="mt-6 text-center">
                  <button onClick={() => setShowAll(true)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
                    Wyświetl wszystkie zdjęcia ({photos.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
