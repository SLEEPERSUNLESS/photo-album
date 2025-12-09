"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface UploadFile {
  file: File;
  preview: string;
  id: string;
}

export default function NewAlbumPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoPrice, setPhotoPrice] = useState("5.00");
  const [fullAlbumPrice, setFullAlbumPrice] = useState("");
  const [thumbnail, setThumbnail] = useState<UploadFile | null>(null);
  const [photos, setPhotos] = useState<UploadFile[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  const [photosDragOver, setPhotosDragOver] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const createPreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }, []);

  const addThumbnail = useCallback(async (file: File) => {
    const compressedFile = await compressImage(file);
    const preview = await createPreview(compressedFile);
    setThumbnail({
      file: compressedFile,
      preview,
      id: 'thumbnail',
    });
  }, [compressImage, createPreview]);

  const addPhotos = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== fileArray.length) {
      setMessage('Niektóre pliki zostały pominięte - tylko obrazy są dozwolone');
    }
    
    const newPhotos: UploadFile[] = [];
    
    for (const file of validFiles) {
      const compressedFile = await compressImage(file);
      const preview = await createPreview(compressedFile);
      newPhotos.push({
        file: compressedFile,
        preview,
        id: Math.random().toString(36).substr(2, 9),
      });
    }
    
    setPhotos(prev => [...prev, ...newPhotos]);
  }, [compressImage, createPreview]);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  const removeThumbnail = useCallback(() => {
    setThumbnail(null);
  }, []);

  const handleThumbnailDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setThumbnailDragOver(true);
  }, []);

  const handleThumbnailDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setThumbnailDragOver(false);
  }, []);

  const handleThumbnailDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setThumbnailDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      addThumbnail(files[0]);
    }
  }, [addThumbnail]);

  const handlePhotosDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPhotosDragOver(true);
  }, []);

  const handlePhotosDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPhotosDragOver(false);
  }, []);

  const handlePhotosDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPhotosDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addPhotos(files);
    }
  }, [addPhotos]);

  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addThumbnail(file);
    }
  }, [addThumbnail]);

  const handlePhotosSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addPhotos(files);
    }
  }, [addPhotos]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!title.trim()) { setMessage("Tytuł jest wymagany"); return; }
    setCreating(true);
    try {
      const form = new FormData();
      form.append('title', title);
      if (description) form.append('description', description);
      form.append('photo_price', photoPrice || '5.00');
      if (fullAlbumPrice) form.append('full_album_price', fullAlbumPrice);
      if (thumbnail) form.append('thumbnail', thumbnail.file);
      photos.forEach((photo) => form.append('photos', photo.file));
      
      const r = await apiFetch('/api/albums/', { method: 'POST', body: form });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.detail || 'Błąd tworzenia albumu');
      }
      const created = await r.json();
      router.push(`/dashboard/albums/${encodeURIComponent(created.slug)}/access?justCreated=1`);
    } catch (err:any) {
      setMessage(err?.message || 'Błąd');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Nowy album</h1>
        <div className="flex gap-4">
          <Link 
            href="/dashboard?tab=albums" 
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </Link>
          <button 
            type="submit"
            form="new-album-form"
            disabled={creating} 
            className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
          >
            {creating ? 'Tworzenie albumu...' : 'Utwórz album'}
          </button>
        </div>
      </div>
      <form id="new-album-form" onSubmit={onSubmit} className="space-y-6">
        {/* Title and Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">Tytuł *</label>
            <textarea 
              id="title" 
              value={title} 
              onChange={(e)=>setTitle(e.target.value)} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none" 
              placeholder="Nazwa albumu" 
              required
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="desc" className="block text-sm font-medium text-slate-700 mb-2">Opis (opcjonalnie)</label>
            <textarea 
              id="desc" 
              value={description} 
              onChange={(e)=>setDescription(e.target.value)} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none" 
              placeholder="Krótki opis albumu" 
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label htmlFor="photoPrice" className="block text-sm font-medium text-slate-700 mb-2">Cena za zdjęcie (PLN)</label>
            <input 
              id="photoPrice"
              type="number"
              step="0.01"
              min="0"
              value={photoPrice} 
              onChange={(e)=>setPhotoPrice(e.target.value)} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="5.00"
            />
            <span className="text-xs text-slate-500 mt-1">Każde zdjęcie w albumie będzie miało tę cenę</span>
          </div>
          <div className="flex flex-col">
            <label htmlFor="fullAlbumPrice" className="block text-sm font-medium text-slate-700 mb-2">Cena za cały album (PLN, opcjonalnie)</label>
            <input 
              id="fullAlbumPrice"
              type="number"
              step="0.01"
              min="0"
              value={fullAlbumPrice} 
              onChange={(e)=>setFullAlbumPrice(e.target.value)} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Zostaw puste jeśli brak zniżki"
            />
            <span className="text-xs text-slate-500 mt-1">Zniżka za zakup całego albumu</span>
          </div>
        </div>

        {/* Thumbnail & Photos Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Miniaturka albumu (opcjonalnie)</label>
            <div className="flex items-start gap-4">
              {/* Thumbnail Preview */}
              <div className="relative flex-shrink-0 w-32 h-32 rounded-md border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                {thumbnail ? (
                  <>
                    <img 
                      src={thumbnail.preview} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      title="Usuń miniaturkę"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              {/* Dropzone */}
              <div 
                className={`flex-1 h-32 border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
                  thumbnailDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : thumbnail
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleThumbnailDragOver}
                onDragLeave={handleThumbnailDragLeave}
                onDrop={handleThumbnailDrop}
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {thumbnail ? (
                  <>
                    <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="mt-1 text-sm font-medium text-green-700">Miniaturka wybrana</p>
                    <p className="text-xs text-green-600">Przeciągnij lub kliknij aby zmienić</p>
                  </>
                ) : (
                  <>
                    <svg className="h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      Przeciągnij lub{' '}
                      <span className="text-blue-600">wybierz plik</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF do 10MB</p>
                  </>
                )}
              </div>
            </div>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailSelect}
              aria-label="Wybierz plik miniatury"
            />
          </div>

          {/* Photos Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Zdjęcia albumu (opcjonalnie)</label>
            <div 
              className={`h-32 border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
                photosDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handlePhotosDragOver}
              onDragLeave={handlePhotosDragLeave}
              onDrop={handlePhotosDrop}
              onClick={() => photosInputRef.current?.click()}
            >
              <svg className="h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1 text-sm font-medium text-gray-900">
                Przeciągnij lub{' '}
                <span className="text-blue-600">wybierz pliki</span>
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF do 10MB każdy</p>
            </div>
            <input
              ref={photosInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotosSelect}
              aria-label="Wybierz pliki zdjęć"
            />
          </div>
        </div>

        {/* Photos Preview */}
        {photos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Pokazuje {showAllPhotos ? photos.length : Math.min(20, photos.length)} ({photos.length})
              </h3>
              <div className="flex items-center gap-2">
                {photos.length > 20 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPhotos(!showAllPhotos)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showAllPhotos ? 'Pokaż mniej' : `Pokaż wszystkie (${photos.length})`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPhotos([])}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Wyczyść wszystkie
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(showAllPhotos ? photos : photos.slice(0, 20)).map((photo) => (
                <div key={photo.id} className="relative border rounded overflow-hidden">
                  <img 
                    src={photo.preview} 
                    alt="Photo preview" 
                    className="w-full h-32 object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    title="Usuń zdjęcie"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {message && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{message}</p>}
        
      </form>
    </div>
  );
}
