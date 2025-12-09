"use client";

import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "../../../lib/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCamera, FaLock, FaTrash, FaPlus, FaPen, FaImage, FaSearch, FaFilter, FaEllipsisV, FaUsers, FaTag } from 'react-icons/fa';
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";

type AllowedEntry = { id: string | number; email: string; is_admin?: boolean };

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'accounts' | 'albums'>('albums');
  const [list, setList] = useState<AllowedEntry[]>([]);
  const [allowEmail, setAllowEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [editing, setEditing] = useState<{ slug: string; field: 'title' | 'description' | 'photo_price' | 'full_album_price' } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await apiFetch("/api/auth/admin/allowed_emails/");
      const data = await r.json();
      setList(Array.isArray(data) ? data : []);
      const ra = await apiFetch('/api/albums/?page=1');
      const da = await ra.json();
      setAlbums(da?.results || []);
    } catch {
      setMessage("Błąd ładowania");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'albums' || t === 'accounts') setTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (editing) {
      if (editing.field === 'title') inputRef.current?.focus();
      else textareaRef.current?.focus();
    }
  }, [editing]);

  async function addEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!allowEmail.includes("@")) return;
    
    if (list.some(it => it.email.toLowerCase() === allowEmail.toLowerCase())) {
      toast.error('Użytkownik już istnieje');
      return;
    }
    
    const r = await apiFetch("/api/auth/admin/allowed_emails/", { method: "POST", body: JSON.stringify({ email: allowEmail, is_admin: isAdmin }) });
    if (r.ok) { 
      setAllowEmail(""); 
      setIsAdmin(false); 
      toast.success('Użytkownik dodany');
      load(); 
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(data?.detail || 'Użytkownik już istnieje');
    }
  }

  function startEdit(slug: string, field: 'title' | 'description' | 'photo_price' | 'full_album_price', value: string) {
    setEditing({ slug, field });
    setEditValue(value);
  }

  async function saveEdit() {
    if (!editing) return;
    let body: Record<string, any> = {};
    if (editing.field === 'title') body = { title: editValue };
    else if (editing.field === 'description') body = { description: editValue };
    else if (editing.field === 'photo_price') body = { photo_price: editValue };
    else if (editing.field === 'full_album_price') body = { full_album_price: editValue || null };
    await apiFetch(`/api/albums/${editing.slug}/meta/`, { method: 'PATCH', body: JSON.stringify(body) });
    setEditing(null);
    toast.success('Zapisano zmiany');
    load();
  }

  async function changeThumbnail(slug: string, file: File) {
    const form = new FormData();
    form.append('thumbnail', file);
    await apiFetch(`/api/albums/${slug}/meta/`, { method: 'PATCH', body: form });
    toast.success('Miniaturka zmieniona');
    load();
  }

  async function deleteAlbum(slug: string) {
    if (!confirm('Usunąć album?')) return;
    await apiFetch(`/api/albums/${slug}/meta/`, { method: 'DELETE' });
    toast.success('Album usunięty');
    load();
  }

  const filteredAlbums = albums.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAccounts = list.filter(it => {
    const matchesSearch = it.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = accountFilter === 'all' || 
      (accountFilter === 'admin' && it.is_admin) || 
      (accountFilter === 'user' && !it.is_admin);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-700">Panel admina</h1>
          <div className="flex flex-row gap-2">
            <button onClick={() => { setTab('albums'); setSearchQuery(''); }} className={`px-4 py-2 rounded-md font-medium text-sm ${tab === 'albums' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Albumy</button>
            <button onClick={() => { setTab('accounts'); setSearchQuery(''); }} className={`px-4 py-2 rounded-md font-medium text-sm ${tab === 'accounts' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Konta</button>
          </div>
        </div>

        {message && <p className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-md">{message}</p>}

        {tab === 'accounts' && (
          <div>
            <div className="flex flex-row justify-between items-center mb-6">
              <div className="flex flex-row gap-2">
                <div className="bg-white flex items-center gap-2 h-10 rounded-md border border-slate-300 px-3">
                  <FaSearch className="text-slate-400" />
                  <input type="text" placeholder="Szukaj konta..." className="w-48 outline-none border-none text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="relative">
                  <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="h-10 bg-white rounded-md border border-slate-300 px-4 flex items-center gap-2 text-slate-600 font-medium text-sm">
                    <FaFilter />
                    <span>Filtruj</span>
                    {accountFilter !== 'all' && <span className="bg-slate-700 text-white text-xs px-1.5 py-0.5 rounded">{accountFilter === 'admin' ? 'Admin' : 'User'}</span>}
                  </button>
                  {showFilterMenu && (
                    <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
                      <button onClick={() => { setAccountFilter('all'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${accountFilter === 'all' ? 'text-slate-700 font-medium' : 'text-slate-600'}`}>Wszystkie</button>
                      <button onClick={() => { setAccountFilter('admin'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${accountFilter === 'admin' ? 'text-slate-700 font-medium' : 'text-slate-600'}`}>Tylko admin</button>
                      <button onClick={() => { setAccountFilter('user'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${accountFilter === 'user' ? 'text-slate-700 font-medium' : 'text-slate-600'}`}>Tylko użytkownik</button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-slate-500">{filteredAccounts.length} z {list.length} kont</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
              <form onSubmit={addEmail} className="flex gap-3 p-5 border-b border-slate-100">
                <input type="email" value={allowEmail} onChange={e => setAllowEmail(e.target.value)} placeholder="email@example.com" className="flex-1 border border-slate-200 px-4 py-2 rounded-lg" />
                <label className="flex items-center gap-2 px-3 text-slate-600">
                  <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="w-4 h-4" /> Admin
                </label>
                <button className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">Dodaj</button>
              </form>
              {loading ? <p className="p-5 text-slate-500">Ładowanie...</p> : filteredAccounts.length === 0 ? <p className="p-5 text-slate-500">Brak wyników</p> : (
                <div className="divide-y divide-slate-100">
                  {filteredAccounts.map(it => (
                    <div key={String(it.id)} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-700">{it.email}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${it.is_admin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {it.is_admin ? 'admin' : 'użytkownik'}
                        </span>
                      </div>
                      <button onClick={() => apiFetch(`/api/auth/admin/allowed_emails/${it.id}/`, { method: "DELETE" }).then(load)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg">
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'albums' && (
          <div>
            <div className="flex flex-row justify-between items-center mb-6">
              <div className="flex flex-row gap-2">
                <div className="bg-white flex items-center gap-2 h-10 rounded-md border border-slate-300 px-3">
                  <FaSearch className="text-slate-400" />
                  <input type="text" placeholder="Szukaj albumu..." className="w-48 outline-none border-none text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Link href="/dashboard/albums/new" className="flex items-center gap-2 h-10 px-4 bg-slate-700 text-white rounded-md hover:bg-slate-800 text-sm font-medium">
                  <FaPlus /> Nowy album
                </Link>
              </div>
              <p className="text-slate-500">{filteredAlbums.length} z {albums.length} albumów</p>
            </div>

            {loading ? <p className="text-slate-500">Ładowanie...</p> : filteredAlbums.length === 0 ? <p className="text-slate-500">Brak wyników</p> : (
              <div className="space-y-4">
                {filteredAlbums.map(a => (
                  <div key={a.slug} className="bg-white rounded-lg shadow-sm p-4 flex gap-4 items-stretch">
                    <div className="relative group flex-shrink-0">
                      <div className="w-32 h-24 bg-slate-200 rounded-lg overflow-hidden">
                        {a.thumbnail ? <img src={a.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><FaImage size={24} /></div>}
                      </div>
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer">
                        <FaPen className="text-white" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={el => { fileInputRefs.current[a.slug] = el; }}
                          onChange={e => e.target.files?.[0] && changeThumbnail(a.slug, e.target.files[0])} 
                        />
                      </label>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      {editing && editing.slug === a.slug && editing.field === 'title' ? (
                        <div className="flex gap-2">
                          <input ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 border border-slate-300 px-3 py-1 rounded-md font-semibold text-lg" onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                          <button onClick={saveEdit} className="px-3 py-1 bg-slate-700 text-white rounded-md text-sm">Zapisz</button>
                          <button onClick={() => setEditing(null)} className="px-3 py-1 bg-slate-200 text-slate-600 rounded-md text-sm">Anuluj</button>
                        </div>
                      ) : (
                        <div className="group/title flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-slate-700">{a.title}</h3>
                          <button onClick={() => startEdit(a.slug, 'title', a.title)} className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover/title:opacity-100 transition-opacity">
                            <FaPen size={12} />
                          </button>
                        </div>
                      )}

                      {editing && editing.slug === a.slug && editing.field === 'description' ? (
                        <div className="flex gap-2">
                          <textarea ref={textareaRef} value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 border border-slate-300 px-3 py-2 rounded-md text-sm resize-none" rows={2} />
                          <div className="flex flex-col gap-1">
                            <button onClick={saveEdit} className="px-3 py-1 bg-slate-700 text-white rounded-md text-sm">Zapisz</button>
                            <button onClick={() => setEditing(null)} className="px-3 py-1 bg-slate-200 text-slate-600 rounded-md text-sm">Anuluj</button>
                          </div>
                        </div>
                      ) : (
                        <div className="group/desc flex items-start gap-2">
                          <p className="text-slate-500 text-sm">{a.description || 'Brak opisu'}</p>
                          <button onClick={() => startEdit(a.slug, 'description', a.description || '')} className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover/desc:opacity-100 transition-opacity flex-shrink-0">
                            <FaPen size={12} />
                          </button>
                        </div>
                      )}

                      {editing && editing.slug === a.slug && (editing.field === 'photo_price' || editing.field === 'full_album_price') && (
                        <div className="flex gap-2 items-center">
                          <span className="text-sm text-slate-600">{editing.field === 'photo_price' ? 'Cena za zdjęcie:' : 'Cena za album:'}</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            value={editValue} 
                            onChange={e => setEditValue(e.target.value)} 
                            className="w-24 border border-slate-300 px-3 py-1 rounded-md text-sm" 
                            onKeyDown={e => e.key === 'Enter' && saveEdit()} 
                            placeholder={editing.field === 'full_album_price' ? 'puste = brak' : '5.00'}
                            autoFocus
                          />
                          <span className="text-sm text-slate-500">PLN</span>
                          <button onClick={saveEdit} className="px-3 py-1 bg-slate-700 text-white rounded-md text-sm">Zapisz</button>
                          <button onClick={() => setEditing(null)} className="px-3 py-1 bg-slate-200 text-slate-600 rounded-md text-sm">Anuluj</button>
                        </div>
                      )}

                      <div className="flex gap-4 text-sm mt-auto flex-wrap">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <FaCamera className="text-slate-400" />
                          <span>{a.photo_count ?? 0} zdjęć</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <FaUsers className="text-slate-400" />
                          <span>{a.access_count ?? 0} osób z dostępem</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <FaImage className="text-slate-400" />
                          <span>{a.photo_price ?? '5.00'} zł</span>
                        </div>
                        {a.full_album_price && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <FaTag className="text-slate-400" />
                            <span>{a.full_album_price} zł</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg self-start">
                          <FaEllipsisV />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/albums/${a.slug}/photos`}>
                            <FaCamera className="mr-2" /> Edytuj zdjęcia
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/albums/${a.slug}/access`}>
                            <FaLock className="mr-2" /> Edytuj dostęp
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => startEdit(a.slug, 'title', a.title)}>
                          <FaPen className="mr-2" /> Zmień nazwę
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startEdit(a.slug, 'description', a.description || '')}>
                          <FaPen className="mr-2" /> Zmień opis
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => fileInputRefs.current[a.slug]?.click()}>
                          <FaImage className="mr-2" /> Zmień miniaturkę
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => startEdit(a.slug, 'photo_price', String(a.photo_price ?? '5.00'))}>
                          <FaTag className="mr-2" /> Zmień cenę za zdjęcie
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startEdit(a.slug, 'full_album_price', String(a.full_album_price ?? ''))}>
                          <FaTag className="mr-2" /> Zmień cenę za album
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => deleteAlbum(a.slug)}>
                          <FaTrash className="mr-2" /> Usuń album
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
