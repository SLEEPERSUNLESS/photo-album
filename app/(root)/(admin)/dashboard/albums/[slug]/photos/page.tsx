"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../../../lib/api";

interface PhotoItem { id: number; title: string; url: string }

interface UploadFile {
  file: File;
  preview: string;
  id: string;
  progress: number;
  error?: string;
}

export default function AlbumPhotosPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [showAllUploads, setShowAllUploads] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await apiFetch(`/albums/${slug}/`);
      if (!r.ok) throw new Error('Błąd pobierania zdjęć');
      const data = await r.json();
      setPhotos(Array.isArray(data) ? data : data?.results || []);
    } catch (err: any) {
      setMessage(err?.message || 'Błąd');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (slug) load(); }, [slug]);

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

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== fileArray.length) {
      setMessage('Niektóre pliki zostały pominięte - tylko obrazy są dozwolone');
    }
    
    const newUploadFiles: UploadFile[] = [];
    
    for (const file of validFiles) {
      const compressedFile = await compressImage(file);
      const preview = await createPreview(compressedFile);
      newUploadFiles.push({
        file: compressedFile,
        preview,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
      });
    }
    
    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [compressImage, createPreview]);

  const removeUploadFile = useCallback((id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  async function upload() {
    if (uploadFiles.length === 0) return;
    
    setUploading(true);
    setMessage(null);
    
    try {
      const form = new FormData();
      uploadFiles.forEach((uploadFile, index) => {
        form.append('photos', uploadFile.file);
      });
      
      setUploadFiles(prev => prev.map(f => ({ ...f, progress: 10 })));
      
      const r = await apiFetch(`/albums/${slug}/`, { method: 'POST', body: form });
      
      setUploadFiles(prev => prev.map(f => ({ ...f, progress: 100 })));
      
      if (!r.ok) {
        const d = await r.json().catch(()=>({}));
        throw new Error(d?.detail || 'Nie udało się dodać zdjęć');
      }
      
      setUploadFiles([]);
      await load();
    } catch (err:any) {
      setMessage(err?.message || 'Błąd');
      setUploadFiles(prev => prev.map(f => ({ ...f, error: err?.message || 'Błąd przesyłu' })));
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: number) {
    setMessage(null);
    try {
      const r = await apiFetch(`/albums/${slug}/photos/${id}/`, { method: 'DELETE' });
      if (!r.ok && r.status !== 204) throw new Error('Nie udało się usunąć');
      await load();
    } catch (err:any) {
      setMessage(err?.message || 'Błąd');
    }
  }

  const clearAllUploads = useCallback(() => {
    setUploadFiles([]);
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Zdjęcia w albumie</h1>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/dashboard?tab=albums" className="underline">← Wróć do listy</Link>
      </div>

      <div className="mb-6">
        <div 
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-4">
            <div>
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900">
                  Przeciągnij zdjęcia tutaj lub{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    wybierz pliki
                  </button>
                </p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF do 10MB każdy</p>
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            aria-label="Wybierz pliki zdjęć"
          />
        </div>

        {uploadFiles.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Wybrane zdjęcia ({showAllUploads ? uploadFiles.length : Math.min(20, uploadFiles.length)} z {uploadFiles.length})
              </h3>
              <div className="flex items-center gap-2">
                {uploadFiles.length > 20 && (
                  <button
                    onClick={() => setShowAllUploads(!showAllUploads)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showAllUploads ? 'Pokaż mniej' : `Pokaż wszystkie (${uploadFiles.length})`}
                  </button>
                )}
                <button
                  onClick={clearAllUploads}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Wyczyść wszystkie
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {(showAllUploads ? uploadFiles : uploadFiles.slice(0, 20)).map((uploadFile) => (
                <div key={uploadFile.id} className="relative border rounded overflow-hidden">
                  <img 
                    src={uploadFile.preview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover" 
                  />
                  <button
                    onClick={() => removeUploadFile(uploadFile.id)}
                    className="absolute top-1 right-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm transition-colors"
                    title="Usuń zdjęcie"
                  >
                    ×
                  </button>
                  {uploadFile.progress > 0 && uploadFile.progress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                      {uploadFile.progress}%
                    </div>
                  )}
                  {uploadFile.error && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1">
                      {uploadFile.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button 
                disabled={uploading} 
                onClick={upload} 
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? 'Dodawanie zdjęć...' : `Dodaj ${uploadFiles.length} zdjęć`}
              </button>
            </div>
          </div>
        )}
      </div>

      {message && <p className="text-sm text-red-600 mb-2">{message}</p>}

      <div>
        <h2 className="text-xl font-semibold mb-4">Zdjęcia w albumie ({photos.length})</h2>
        {loading ? (
          <div>Ładowanie…</div>
        ) : photos.length === 0 ? (
          <div className="text-slate-500">Brak zdjęć</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="border rounded overflow-hidden">
                <img src={p.url} alt={p.title} className="w-full h-40 object-cover" />
                <div className="p-2 flex items-center justify-between text-sm">
                  <span className="truncate" title={p.title}>{p.title}</span>
                  <button onClick={()=>remove(p.id)} className="text-red-600 hover:underline">Usuń</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
