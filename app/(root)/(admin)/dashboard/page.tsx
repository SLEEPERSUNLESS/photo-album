"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type AllowedEntry = { id: string | number; email: string; is_active?: boolean; created_at?: string | null; is_admin?: boolean; type?: 'allowed' | 'admin' };

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'accounts'|'albums'>('accounts');
  const [list, setList] = useState<AllowedEntry[]>([]);
  const [allowEmail, setAllowEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [editTitle, setEditTitle] = useState<Record<string,string>>({});
  const [editDescription, setEditDescription] = useState<Record<string,string>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

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
    } catch (e) {
      setMessage("Nie udało się pobrać listy");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // initialize tab from query params if present
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'albums' || t === 'accounts') setTab(t as any);
  }, [searchParams]);

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

  // Album access management moved to per-album page

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Panel administratora</h1>

      <div className="mb-6 flex gap-2 border-b">
        <button onClick={() => setTab('accounts')} className={`px-3 py-2 ${tab==='accounts' ? 'border-b-2 border-slate-700 font-semibold' : 'text-slate-600'}`}>Konta</button>
  <button onClick={() => setTab('albums')} className={`px-3 py-2 ${tab==='albums' ? 'border-b-2 border-slate-700 font-semibold' : 'text-slate-600'}`}>Albumy</button>
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
                    <td className="p-2 border">{it.is_admin ? "admin" : "użytkownik"}</td>
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

      {/* create tab removed; creation now lives at /dashboard/albums/new */}

      {/* Access tab removed; use per-album "Edytuj dostęp" button in Albums tab */}

      {tab === 'albums' && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Zarządzaj albumami</h2>
          <div className="mb-4">
            <Link href="/dashboard/albums/new" className="inline-block px-3 py-2 bg-slate-700 text-white rounded">Utwórz album</Link>
          </div>
          <table className="w-full text-left border">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-2 border">Tytuł</th>
                <th className="p-2 border">Opis</th>
                <th className="p-2 border">Miniaturka</th>
                <th className="p-2 border w-48">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {albums.map((a) => (
                <tr key={a.slug}>
                  <td className="p-2 border align-top">
                    <label className="block text-xs text-slate-600 mb-1" htmlFor={`title-${a.slug}`}>Tytuł</label>
                    <input
                      id={`title-${a.slug}`}
                      className="w-full border p-2 rounded"
                      placeholder="Tytuł"
                      defaultValue={a.title}
                      onChange={(e)=> setEditTitle((s)=> ({...s, [a.slug]: e.target.value}))}
                    />
                  </td>
                  <td className="p-2 border align-top">
                    <label className="block text-xs text-slate-600 mb-1" htmlFor={`desc-${a.slug}`}>Opis</label>
                    <textarea
                      id={`desc-${a.slug}`}
                      className="w-full border p-2 rounded"
                      placeholder="Opis"
                      defaultValue={a.description || ''}
                      onChange={(e)=> setEditDescription((s)=> ({...s, [a.slug]: e.target.value}))}
                    />
                  </td>
                  <td className="p-2 border align-top">
                    <div className="flex items-center gap-2">
                      {a.thumbnail ? <img src={a.thumbnail} alt="thumb" className="h-10 w-14 object-cover border" /> : <span className="text-xs text-slate-400">brak</span>}
                      <label htmlFor={`file-${a.slug}`} className="sr-only">Wybierz miniaturkę</label>
                      <input id={`file-${a.slug}`} type="file" accept="image/*" onChange={async (e)=>{
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const form = new FormData();
                          form.append('thumbnail', file);
                          const r = await apiFetch(`/albums/${a.slug}/meta/`, { method: 'PATCH', body: form });
                          if (!r.ok) throw new Error('Nie udało się zaktualizować miniaturki');
                          await load();
                        } catch (err:any) {
                          setMessage(err?.message || 'Błąd');
                        } finally {
                          e.currentTarget.value = '';
                        }
                      }} />
                    </div>
                  </td>
                  <td className="p-2 border align-top">
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={savingSlug === a.slug}
                        onClick={async ()=>{
                          setMessage(null);
                          setSavingSlug(a.slug);
                          try {
                            const payload: any = {};
                            if (editTitle[a.slug] !== undefined) payload.title = editTitle[a.slug];
                            if (editDescription[a.slug] !== undefined) payload.description = editDescription[a.slug];
                            if (Object.keys(payload).length === 0) return;
                            const r = await apiFetch(`/albums/${a.slug}/meta/`, { method: 'PATCH', body: JSON.stringify(payload) });
                            if (!r.ok) {
                              const d = await r.json().catch(()=>({}));
                              throw new Error(d?.detail || 'Nie udało się zapisać');
                            }
                            await load();
                          } catch (err:any) {
                            setMessage(err?.message || 'Błąd');
                          } finally {
                            setSavingSlug(null);
                          }
                        }}
                        className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-60"
                      >Zapisz</button>
                      <Link href={`/dashboard/albums/${a.slug}/photos`} className="px-3 py-1 border rounded">Zdjęcia</Link>
                      <Link href={`/dashboard/albums/${a.slug}/access`} className="px-3 py-1 border rounded">Edytuj dostęp</Link>
                      <button
                        onClick={async ()=>{
                          if (!confirm('Usunąć ten album? Tej operacji nie można cofnąć.')) return;
                          try {
                            const r = await apiFetch(`/albums/${a.slug}/meta/`, { method: 'DELETE' });
                            if (!r.ok && r.status !== 204) throw new Error('Nie udało się usunąć');
                            await load();
                          } catch (err:any) {
                            setMessage(err?.message || 'Błąd');
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >Usuń</button>
                    </div>
                  </td>
                </tr>
              ))}
              {albums.length === 0 && (
                <tr>
                  <td className="p-2 border text-slate-500" colSpan={4}>Brak albumów</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}