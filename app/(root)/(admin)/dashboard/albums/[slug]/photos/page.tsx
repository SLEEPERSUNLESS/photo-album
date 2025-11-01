"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../../../lib/api";

interface PhotoItem { id: number; title: string; url: string }

export default function AlbumPhotosPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function upload() {
    if (!files || !files.length) return;
    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('photos', f));
      const r = await apiFetch(`/albums/${slug}/`, { method: 'POST', body: form });
      if (!r.ok) {
        const d = await r.json().catch(()=>({}));
        throw new Error(d?.detail || 'Nie udało się dodać zdjęć');
      }
      setFiles(null);
      await load();
    } catch (err:any) {
      setMessage(err?.message || 'Błąd');
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

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Zdjęcia w albumie</h1>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/dashboard?tab=albums" className="underline">← Wróć do listy</Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col">
          <label htmlFor="files" className="inline-block px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer">Dodaj zdjęcia</label>
          <input id="files" type="file" accept="image/*" multiple className="hidden" onChange={(e)=>setFiles(e.target.files)} />
          {files && files.length > 0 && (
            <span className="text-sm text-slate-600 mt-1">{files.length} plików wybranych</span>
          )}
        </div>
        <button disabled={uploading || !files || files.length === 0} onClick={upload} className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-60">{uploading ? 'Dodawanie…' : 'Dodaj'}</button>
      </div>

      {message && <p className="text-sm text-red-600 mb-2">{message}</p>}

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
  );
}
