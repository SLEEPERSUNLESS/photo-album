"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

export default function NewAlbumPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!title.trim()) { setMessage("Tytuł jest wymagany"); return; }
    setCreating(true);
    try {
      const form = new FormData();
      form.append('title', title);
      if (description) form.append('description', description);
      if (thumbnail) form.append('thumbnail', thumbnail);
      if (photos && photos.length) {
        Array.from(photos).forEach((f) => form.append('photos', f));
      }
      const r = await apiFetch('/albums/', { method: 'POST', body: form });
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Nowy album</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="title" className="block text-sm text-slate-700">Tytuł</label>
          <input id="title" value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border p-2 rounded" placeholder="Nazwa albumu" />
        </div>
        <div>
          <label htmlFor="desc" className="block text-sm text-slate-700">Opis (opcjonalnie)</label>
          <textarea id="desc" value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border p-2 rounded" placeholder="Krótki opis" />
        </div>
        <div>
          <label htmlFor="thumb" className="block text-sm text-slate-700">Miniaturka (opcjonalnie)</label>
          <input id="thumb" type="file" accept="image/*" onChange={(e)=>setThumbnail(e.target.files?.[0] || null)} className="w-full" />
          <p className="text-xs text-slate-500 mt-1">Obsługiwane formaty: JPG, PNG, itp.</p>
        </div>
        <div>
          <label htmlFor="photos" className="block text-sm text-slate-700">Zdjęcia (opcjonalnie, wiele)</label>
          <input id="photos" type="file" accept="image/*" multiple onChange={(e)=>setPhotos(e.target.files)} className="w-full" />
          <p className="text-xs text-slate-500 mt-1">Możesz dodać wiele zdjęć naraz.</p>
        </div>
        {message && <p className="text-sm text-red-600">{message}</p>}
        <div className="flex gap-2">
          <button disabled={creating} className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-60">{creating ? 'Tworzenie…' : 'Utwórz album'}</button>
          <Link href="/dashboard?tab=albums" className="px-4 py-2 border rounded">Anuluj</Link>
        </div>
      </form>
    </div>
  );
}
