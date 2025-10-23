"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

type AllowedEntry = { id: string | number; email: string; is_active?: boolean; created_at?: string | null; is_admin?: boolean; type?: 'allowed' | 'admin' };

export default function Dashboard() {
  const [tab, setTab] = useState<'accounts'|'create'|'assign'>('accounts');
  const [list, setList] = useState<AllowedEntry[]>([]);
  const [allowEmail, setAllowEmail] = useState("");
  const [accessEmail, setAccessEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [albumSlug, setAlbumSlug] = useState<string>("");
  const [accessList, setAccessList] = useState<{id:number;email:string}[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
  const r = await apiFetch("/api/auth/admin/allowed_emails/");
  const data = await r.json();
  setList(Array.isArray(data) ? data : []);
      // also load albums for admin to manage access
      const ra = await apiFetch('/albums/?page=1');
      const da = await ra.json();
      const rows = Array.isArray(da?.results) ? da.results : [];
      setAlbums(rows);
      if (!albumSlug && rows.length) {
        setAlbumSlug(rows[0].slug);
      }
    } catch (e) {
      setMessage("Nie udało się pobrać listy");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!allowEmail || !allowEmail.includes("@")) return;
    setMessage(null);
    try {
      const r = await apiFetch("/api/auth/admin/allowed_emails/", {
        method: "POST",
        body: JSON.stringify({ email: allowEmail }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.detail || "Błąd dodawania");
      }
      setAllowEmail("");
      await load();
    } catch (err: any) {
      setMessage(err?.message || "Błąd");
    }
  }

  async function remove(id: string | number) {
    setMessage(null);
    try {
      const r = await apiFetch(`/api/auth/admin/allowed_emails/${id}/`, { method: "DELETE" });
      if (!r.ok && r.status !== 204) throw new Error("Nie udało się usunąć");
      await load();
    } catch (err: any) {
      setMessage(err?.message || "Błąd");
    }
  }

  // Album access management
  async function loadAccess(slug: string) {
    try {
      const r = await apiFetch(`/albums/${slug}/access/`);
      const data = await r.json();
      setAccessList(Array.isArray(data) ? data : []);
    } catch (e) {
      setAccessList([]);
    }
  }

  useEffect(() => {
    if (albumSlug) loadAccess(albumSlug);
  }, [albumSlug]);

  async function addAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!albumSlug || !accessEmail || !accessEmail.includes('@')) return;
    try {
      const r = await apiFetch(`/albums/${albumSlug}/access/`, { method: 'POST', body: JSON.stringify({ email: accessEmail }) });
      if (!r.ok) throw new Error('Nie udało się dodać dostępu');
      setAccessEmail('');
      await loadAccess(albumSlug);
    } catch (err:any) {
      setMessage(err?.message || 'Błąd');
    }
  }

  async function removeAccess(id: number) {
    try {
      const r = await apiFetch(`/albums/${albumSlug}/access/${id}/`, { method: 'DELETE' });
      if (!r.ok && r.status !== 204) throw new Error('Nie udało się usunąć');
      await loadAccess(albumSlug);
    } catch (err:any) {
      setMessage(err?.message || 'Błąd');
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Panel administratora</h1>

      <div className="mb-6 flex gap-2 border-b">
        <button onClick={() => setTab('accounts')} className={`px-3 py-2 ${tab==='accounts' ? 'border-b-2 border-slate-700 font-semibold' : 'text-slate-600'}`}>Konta</button>
        <button onClick={() => setTab('create')} className={`px-3 py-2 ${tab==='create' ? 'border-b-2 border-slate-700 font-semibold' : 'text-slate-600'}`}>Nowy album</button>
        <button onClick={() => setTab('assign')} className={`px-3 py-2 ${tab==='assign' ? 'border-b-2 border-slate-700 font-semibold' : 'text-slate-600'}`}>Dostępy do albumów</button>
      </div>

      {tab === 'accounts' && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Dozwolone adresy e-mail</h2>
          <form onSubmit={addEmail} className="flex gap-2 mb-4">
            <input
              type="email"
              value={allowEmail}
              onChange={(e) => setAllowEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 border p-2 rounded"
            />
            <button className="px-4 py-2 bg-slate-700 text-white rounded">Dodaj</button>
          </form>
          {message && <p className="text-sm text-red-600 mb-2">{message}</p>}
          {loading ? (
            <div>Ładowanie...</div>
          ) : (
            <table className="w-full text-left border">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-2 border">E-mail</th>
                  <th className="p-2 border">Typ</th>
                  <th className="p-2 border">Aktywny</th>
                  <th className="p-2 border w-24">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {list.map((it) => (
                  <tr key={String(it.id)}>
                    <td className="p-2 border">{it.email}</td>
                    <td className="p-2 border">{it.is_admin ? "admin" : "dozwolony"}</td>
                    <td className="p-2 border">{it.is_admin ? "tak" : (it.is_active ? "tak" : "nie")}</td>
                    <td className="p-2 border">
                      {!it.is_admin ? (
                        <button
                          onClick={() => remove(it.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Usuń
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td className="p-2 border text-slate-500" colSpan={4}>
                      Brak pozycji
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'create' && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Utwórz nowy album</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setMessage(null);
              if (!newTitle.trim()) { setMessage('Tytuł jest wymagany'); return; }
              setCreating(true);
              try {
                const form = new FormData();
                form.append('title', newTitle);
                if (newDescription) form.append('description', newDescription);
                if (newThumbnail) form.append('thumbnail', newThumbnail);
                const r = await apiFetch('/albums/', { method: 'POST', body: form });
                if (!r.ok) {
                  const d = await r.json().catch(() => ({}));
                  throw new Error(d?.detail || 'Błąd tworzenia');
                }
                const created = await r.json();
                // refresh albums and switch to assign tab for quick access management
                await load();
                setAlbumSlug(created.slug);
                setTab('assign');
                setNewTitle(''); setNewDescription(''); setNewThumbnail(null);
              } catch (err:any) {
                setMessage(err?.message || 'Błąd');
              } finally {
                setCreating(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label htmlFor="title" className="block text-sm text-slate-700">Tytuł</label>
              <input id="title" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} className="w-full border p-2 rounded" placeholder="Nazwa albumu" />
            </div>
            <div>
              <label htmlFor="desc" className="block text-sm text-slate-700">Opis (opcjonalnie)</label>
              <textarea id="desc" value={newDescription} onChange={(e)=>setNewDescription(e.target.value)} className="w-full border p-2 rounded" placeholder="Krótki opis" />
            </div>
            <div>
              <label htmlFor="thumb" className="block text-sm text-slate-700">Miniaturka (opcjonalnie)</label>
              <input id="thumb" type="file" accept="image/*" onChange={(e)=>setNewThumbnail(e.target.files?.[0] || null)} className="w-full" />
              <p className="text-xs text-slate-500 mt-1">Obsługiwane formaty: JPG, PNG, itp.</p>
            </div>
            {message && <p className="text-sm text-red-600">{message}</p>}
            <button disabled={creating} className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-60">{creating ? 'Tworzenie…' : 'Utwórz album'}</button>
          </form>
        </section>
      )}

      {tab === 'assign' && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Dostęp do albumów</h2>
          <div className="flex items-center gap-2 mb-4">
            <label htmlFor="albumSelect" className="text-slate-700 text-sm">Album:</label>
            <select
              id="albumSelect"
              value={albumSlug}
              onChange={(e) => setAlbumSlug(e.target.value)}
              className="border p-2 rounded"
            >
              {albums.map((a) => (
                <option key={a.slug} value={a.slug}>{a.title}</option>
              ))}
            </select>
          </div>
          <form onSubmit={addAccess} className="flex gap-2 mb-4">
            <input
              type="email"
              value={accessEmail}
              onChange={(e) => setAccessEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 border p-2 rounded"
            />
            <button className="px-4 py-2 bg-slate-700 text-white rounded">Dodaj dostęp</button>
          </form>
          <table className="w-full text-left border">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-2 border">E-mail</th>
                <th className="p-2 border w-24">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {accessList.map((it) => (
                <tr key={it.id}>
                  <td className="p-2 border">{it.email}</td>
                  <td className="p-2 border">
                    <button onClick={() => removeAccess(it.id)} className="text-sm text-red-600 hover:underline">Usuń</button>
                  </td>
                </tr>
              ))}
              {accessList.length === 0 && (
                <tr>
                  <td className="p-2 border text-slate-500" colSpan={2}>Brak wpisów</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}