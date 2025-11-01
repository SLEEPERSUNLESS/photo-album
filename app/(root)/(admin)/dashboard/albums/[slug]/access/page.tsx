"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { apiFetch } from "../../../../../../lib/api";

interface AccessItem { id: number; email: string }

export default function AlbumAccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || "";
  const justCreated = Boolean(searchParams.get('justCreated'));
  const [list, setList] = useState<AccessItem[]>([]);
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [message, setMessage] = useState<string| null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const r = await apiFetch(`/emails/suggest/?q=${encodeURIComponent(query)}`);
      if (r.ok) {
        const data = await r.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(email);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [email, fetchSuggestions]);

  async function load() {
    setLoading(true);
    try {
      const r = await apiFetch(`/albums/${slug}/access/`);
      const data = await r.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setMessage("Nie udało się pobrać dostępu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (slug) load(); }, [slug]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!email || !email.includes("@")) return;
    try {
      const r = await apiFetch(`/albums/${slug}/access/`, { method: 'POST', body: JSON.stringify({ email }) });
      if (!r.ok) {
        const d = await r.json().catch(()=>({}));
        throw new Error(d?.detail || 'Nie udało się dodać');
      }
      setEmail("");
      setSuggestions([]);
      setShowSuggestions(false);
      await load();
    } catch (err:any) {
      setMessage(err?.message || 'Błąd');
    }
  }

  async function remove(id: number) {
    setMessage(null);
    try {
      const r = await apiFetch(`/albums/${slug}/access/${id}/`, { method: 'DELETE' });
      if (!r.ok && r.status !== 204) throw new Error('Nie udało się usunąć');
      await load();
    } catch (err:any) {
      setMessage(err?.message || 'Błąd');
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setShowSuggestions(true);
  };

  const selectSuggestion = (suggestion: string) => {
    setEmail(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dostęp do albumu</h1>
      <div className="mb-4"><Link href="/dashboard?tab=albums" className="underline">← Wróć do listy</Link></div>
      <form onSubmit={add} className="flex gap-2 mb-4 relative">
        <div className="flex-1 relative">
          <input 
            type="email" 
            value={email} 
            onChange={handleEmailChange} 
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="user@example.com" 
            className="w-full border p-2 rounded" 
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-b shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index} 
                  onClick={() => selectSuggestion(suggestion)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
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
              <th className="p-2 border w-24">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {list.map(it => (
              <tr key={it.id}>
                <td className="p-2 border">{it.email}</td>
                <td className="p-2 border">
                  <button onClick={()=>remove(it.id)} className="text-sm text-red-600 hover:underline">Usuń</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td className="p-2 border text-slate-500" colSpan={2}>Brak wpisów</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {justCreated && (
        <div className="mt-4 flex justify-end">
          <Link href="/dashboard?tab=albums" className="px-4 py-2 bg-slate-700 text-white rounded inline-block">Pomiń dodawanie dostępu</Link>
        </div>
      )}
    </div>
  );
}
