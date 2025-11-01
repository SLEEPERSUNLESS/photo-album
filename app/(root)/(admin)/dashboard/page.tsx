"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCamera, FaLock, FaTrash, FaImage, FaPlus, FaEdit } from 'react-icons/fa';

type AllowedEntry = { id: string | number; email: string; is_active?: boolean; created_at?: string | null; is_admin?: boolean; type?: 'allowed' | 'admin' };

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'accounts'|'albums'>('albums');
  const [list, setList] = useState<AllowedEntry[]>([]);
  const [allowEmail, setAllowEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [editing, setEditing] = useState<Record<string, {title: boolean, desc: boolean}>>({});

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


  return (
    <div className="max-w-7xl mx-auto p-6">
      <style>{`
        .scroll-custom::-webkit-scrollbar {
          width: 4px;
        }
        .scroll-custom::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 2px;
        }
        .scroll-custom::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .scroll-custom {
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #f8fafc;
        }
        .h-134 {
          height: 134px;
        }
        .max-h-134 {
          max-height: 134px;
        }
      `}</style>
      <h1 className="text-2xl font-bold mb-4">Panel administratora</h1>

      <div className="mb-6 flex gap-2 border-b">
        <button onClick={() => setTab('albums')} className={`px-3 py-2 ${tab==='albums' ? 'border-b-2 border-slate-700 font-semibold' : 'text-slate-600'}`}>Albumy</button>
        <button onClick={() => setTab('accounts')} className={`px-3 py-2 ${tab==='accounts' ? 'border-b-2 border-slate-700 font-semibold' : 'text-slate-600'}`}>Konta</button>
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

      {tab === 'albums' && (
        <section className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Zarządzaj albumami</h2>
            <Link href="/dashboard/albums/new" className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors">
              <FaPlus className="mr-2" />
              Utwórz album
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-sm table-fixed">
              <thead>
                <tr className="bg-slate-700">
                  <th className="p-6 font-semibold text-white w-1/3 align-top">Tytuł</th>
                  <th className="p-6 font-semibold text-white w-2/5 align-top">Opis</th>
                  <th className="p-6 font-semibold text-white text-center w-1/6 align-top">Miniaturka</th>
                  <th className="p-6 font-semibold text-white w-48 align-top">Akcje</th>
                </tr>
              </thead>
              <tbody>
              {albums.map((a, index) => (
                <tr key={a.slug} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                  <td className="p-6 align-top min-h-24">
                    {editing[a.slug]?.title ? (
                      <div>
                        <textarea
                          id={`title-${a.slug}`}
                          className="w-full border border-slate-300 p-3 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none mb-2"
                          placeholder="Tytuł"
                          rows={Math.max(1, Math.ceil(a.title.length / 40))}
                          defaultValue={a.title}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditing(prev => ({ ...prev, [a.slug]: { ...prev[a.slug], title: false } }))}
                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                          >
                            Anuluj
                          </button>
                          <button
                            onClick={async () => {
                              const textarea = document.getElementById(`title-${a.slug}`) as HTMLTextAreaElement;
                              const newTitle = textarea.value;
                              if (newTitle !== a.title) {
                                try {
                                  const r = await apiFetch(`/albums/${a.slug}/meta/`, { method: 'PATCH', body: JSON.stringify({ title: newTitle }) });
                                  if (!r.ok) throw new Error('Nie udało się zaktualizować tytułu');
                                  await load();
                                } catch (err: any) {
                                  setMessage(err?.message || 'Błąd');
                                }
                              }
                              setEditing(prev => ({ ...prev, [a.slug]: { ...prev[a.slug], title: false } }));
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            Zatwierdź
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-900 font-medium bg-blue-100 px-2 py-1 rounded max-w-full break-words min-w-0 overflow-y-auto scroll-custom inline-block max-h-134">{a.title}</span>
                        <button
                          onClick={() => setEditing(prev => ({ ...prev, [a.slug]: { ...prev[a.slug], title: true } }))}
                          className="text-slate-400 hover:text-slate-600 ml-2"
                          title="Edytuj tytuł"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-6 align-top min-h-24">
                    {editing[a.slug]?.desc ? (
                      <div>
                        <textarea
                          id={`desc-${a.slug}`}
                          className="w-full border border-slate-300 p-3 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none mb-2"
                          placeholder="Opis"
                          rows={Math.max(1, Math.ceil((a.description || '').length / 40))}
                          defaultValue={a.description || ''}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditing(prev => ({ ...prev, [a.slug]: { ...prev[a.slug], desc: false } }))}
                            className="px-2 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                          >
                            Anuluj
                          </button>
                          <button
                            onClick={async () => {
                              const textarea = document.getElementById(`desc-${a.slug}`) as HTMLTextAreaElement;
                              const newDesc = textarea.value;
                              if (newDesc !== (a.description || '')) {
                                try {
                                  const r = await apiFetch(`/albums/${a.slug}/meta/`, { method: 'PATCH', body: JSON.stringify({ description: newDesc }) });
                                  if (!r.ok) throw new Error('Nie udało się zaktualizować opisu');
                                  await load();
                                } catch (err: any) {
                                  setMessage(err?.message || 'Błąd');
                                }
                              }
                              setEditing(prev => ({ ...prev, [a.slug]: { ...prev[a.slug], desc: false } }));
                            }}
                            className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            Zatwierdź
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 bg-green-100 px-2 py-1 rounded max-w-full break-words min-w-0 overflow-y-auto scroll-custom inline-block max-h-134">{a.description || 'Brak opisu'}</span>
                        <button
                          onClick={() => setEditing(prev => ({ ...prev, [a.slug]: { ...prev[a.slug], desc: true } }))}
                          className="text-slate-400 hover:text-slate-600 ml-2 flex-shrink-0"
                          title="Edytuj opis"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-6 align-top min-h-24">
                    <div className="flex flex-col items-center gap-3">
                      {a.thumbnail ? <img src={a.thumbnail} alt="thumb" className="h-20 w-28 object-cover border-2 border-slate-200 rounded-lg shadow-sm" /> : <span className="text-sm text-slate-400">Brak miniaturki</span>}
                      <div>
                        <label htmlFor={`file-${a.slug}`} className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors cursor-pointer text-sm font-medium whitespace-nowrap">
                          <FaImage className="mr-2" />
                          Zmień miniaturkę
                        </label>
                        <input id={`file-${a.slug}`} type="file" accept="image/*" className="hidden" onChange={async (e)=>{
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
                    </div>
                  </td>
                  <td className="p-6 align-top min-h-24">
                    <div className="flex flex-col gap-3">
                      <Link href={`/dashboard/albums/${a.slug}/photos`} className="inline-flex items-center px-3 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium">
                        <FaCamera className="mr-2" />
                        Zdjęcia
                      </Link>
                      <Link href={`/dashboard/albums/${a.slug}/access`} className="inline-flex items-center px-3 py-2 bg-white rounded-md border border-slate-300 font-medium text-slate-600 hover:text-slate-900 transition-colors text-sm">
                        <FaLock className="mr-2" />
                        Edytuj dostęp
                      </Link>
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
                        className="inline-flex items-center px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                      >
                        <FaTrash className="mr-2" />
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {albums.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500 text-center font-medium" colSpan={4}>Brak albumów</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </section>
      )}
    </div>
  );
}