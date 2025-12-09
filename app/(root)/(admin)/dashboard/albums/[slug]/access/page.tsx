"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { apiFetch } from "../../../../../../lib/api";
import { FaArrowLeft, FaTrash } from "react-icons/fa";

interface AccessItem { id: number; email: string }

export default function AlbumAccessPage() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const justCreated = Boolean(searchParams.get('justCreated'));
  const [list, setList] = useState<AccessItem[]>([]);
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    const r = await apiFetch(`/api/emails/suggest/?q=${encodeURIComponent(q)}`);
    if (r.ok) setSuggestions(await r.json());
  }, []);

  useEffect(() => { fetchSuggestions(email); }, [email, fetchSuggestions]);

  async function load() {
    setLoading(true);
    const r = await apiFetch(`/api/albums/${slug}/access/`);
    setList(await r.json());
    setLoading(false);
  }

  useEffect(() => { if (slug) load(); }, [slug]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    const r = await apiFetch(`/api/albums/${slug}/access/`, { method: 'POST', body: JSON.stringify({ email }) });
    if (r.ok) { setEmail(""); setSuggestions([]); load(); }
    else setMessage("Błąd dodawania");
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard?tab=albums" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
          <FaArrowLeft className="mr-2" /> Wróć do albumów
        </Link>

        <h1 className="text-3xl font-bold text-slate-700 mb-8">Dostęp do albumu</h1>

        {message && <p className="text-sm text-red-600 mb-4 bg-red-50 p-4 rounded-xl">{message}</p>}

        <div className="bg-white rounded-xl shadow-sm">
          <form onSubmit={add} className="p-5 border-b border-slate-100 flex gap-3 relative">
            <div className="flex-1 relative">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="email@example.com"
                className="w-full border border-slate-200 px-4 py-2 rounded-lg"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                  {suggestions.map((s, i) => (
                    <li key={i} onClick={() => { setEmail(s); setShowSuggestions(false); }} className="px-4 py-2 hover:bg-slate-50 cursor-pointer">{s}</li>
                  ))}
                </ul>
              )}
            </div>
            <button className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">Dodaj</button>
          </form>

          <div className="p-5 border-b border-slate-100 text-slate-500">{list.length} osób z dostępem</div>

          {loading ? <p className="p-5 text-slate-500">Ładowanie...</p> : list.length === 0 ? <p className="p-5 text-slate-500">Nikt nie ma dostępu</p> : (
            <div className="divide-y divide-slate-100">
              {list.map(it => (
                <div key={it.id} className="flex items-center justify-between px-5 py-4">
                  <span className="text-slate-700">{it.email}</span>
                  <button onClick={() => apiFetch(`/api/albums/${slug}/access/${it.id}/`, { method: 'DELETE' }).then(load)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {justCreated && (
          <div className="mt-6 flex justify-end">
            <Link href="/dashboard?tab=albums" className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">Pomiń i wróć</Link>
          </div>
        )}
      </div>
    </div>
  );
}
