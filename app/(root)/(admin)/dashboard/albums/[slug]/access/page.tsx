"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { apiFetch } from "../../../../../../lib/api";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import { toast } from "sonner";

interface AccessItem { id: number; email: string }
interface BulkResult { added: number; existing: number; invalid: number; invalid_emails: string[] }

function parseEmails(text: string): string[] {
  return text
    .split(/[,;\s\n]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0 && e.includes('@'));
}

export default function AlbumAccessPage() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const justCreated = Boolean(searchParams.get('justCreated'));
  const [list, setList] = useState<AccessItem[]>([]);
  const [bulkEmails, setBulkEmails] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // For single email input with suggestions
  const [singleEmail, setSingleEmail] = useState("");

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    const r = await apiFetch(`/api/emails/suggest/?q=${encodeURIComponent(q)}`);
    if (r.ok) setSuggestions(await r.json());
  }, []);

  useEffect(() => { fetchSuggestions(singleEmail); }, [singleEmail, fetchSuggestions]);

  async function load() {
    setLoading(true);
    const r = await apiFetch(`/api/albums/${slug}/access/`);
    setList(await r.json());
    setLoading(false);
  }

  useEffect(() => { if (slug) load(); }, [slug]);

  // Add single email (with autocomplete)
  async function addSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!singleEmail.includes("@")) return;
    setAdding(true);
    
    const r = await apiFetch(`/api/albums/${slug}/access/`, { 
      method: 'POST', 
      body: JSON.stringify({ email: singleEmail }) 
    });
    
    if (r.ok) { 
      setSingleEmail(""); 
      setSuggestions([]); 
      toast.success("Dodano dostęp");
      load(); 
    } else {
      toast.error("Błąd dodawania");
    }
    setAdding(false);
  }

  // Bulk add emails
  async function addBulk(e: React.FormEvent) {
    e.preventDefault();
    const emails = parseEmails(bulkEmails);
    
    if (emails.length === 0) {
      toast.error("Nie znaleziono poprawnych adresów email");
      return;
    }
    
    setAdding(true);
    
    const r = await apiFetch(`/api/albums/${slug}/access/`, { 
      method: 'POST', 
      body: JSON.stringify({ emails }) 
    });
    
    if (r.ok) {
      const result: BulkResult = await r.json();
      let msg = `Dodano: ${result.added}`;
      if (result.existing > 0) msg += `, już istniało: ${result.existing}`;
      if (result.invalid > 0) msg += `, niepoprawnych: ${result.invalid}`;
      
      toast.success(msg);
      
      if (result.invalid_emails.length > 0) {
        toast.warning(`Niepoprawne adresy: ${result.invalid_emails.join(', ')}`);
      }
      
      setBulkEmails("");
      load();
    } else {
      toast.error("Błąd dodawania");
    }
    setAdding(false);
  }

  const parsedCount = parseEmails(bulkEmails).length;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard?tab=albums" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
          <FaArrowLeft className="mr-2" /> Wróć do albumów
        </Link>

        <h1 className="text-3xl font-bold text-slate-700 mb-8">Dostęp do albumu</h1>

        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Dodaj pojedynczy email</h2>
            <form onSubmit={addSingle} className="flex gap-3 relative">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={singleEmail}
                  onChange={e => { setSingleEmail(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="email@example.com"
                  className="w-full border border-slate-200 px-4 py-2 rounded-lg"
                  disabled={adding}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <li key={i} onClick={() => { setSingleEmail(s); setShowSuggestions(false); }} className="px-4 py-2 hover:bg-slate-50 cursor-pointer">{s}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button 
                type="submit" 
                disabled={adding || !singleEmail.includes('@')}
                className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dodaj
              </button>
            </form>
          </div>

          <div className="p-5">
            <h2 className="text-lg font-semibold text-slate-700 mb-2">Dodaj wiele emaili naraz</h2>
            <p className="text-sm text-slate-500 mb-4">
              Wklej lub wpisz adresy email rozdzielone przecinkami, średnikami, spacjami lub nowymi liniami
            </p>
            <form onSubmit={addBulk}>
              <textarea
                value={bulkEmails}
                onChange={e => setBulkEmails(e.target.value)}
                placeholder={"jan@example.com, anna@example.com\nkrzysztof@example.com; maria@example.com"}
                rows={5}
                className="w-full border border-slate-200 px-4 py-3 rounded-lg resize-y font-mono text-sm"
                disabled={adding}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-slate-500">
                  {parsedCount > 0 ? `Rozpoznano ${parsedCount} ${parsedCount === 1 ? 'email' : parsedCount < 5 ? 'emaile' : 'emaili'}` : 'Brak emaili do dodania'}
                </span>
                <button 
                  type="submit" 
                  disabled={adding || parsedCount === 0}
                  className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Dodawanie...' : `Dodaj wszystkie (${parsedCount})`}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-5 border-b border-slate-100 text-slate-500">{list.length} osób z dostępem</div>

          {loading ? <p className="p-5 text-slate-500">Ładowanie...</p> : list.length === 0 ? <p className="p-5 text-slate-500">Nikt nie ma dostępu</p> : (
            <div className="divide-y divide-slate-100">
              {list.map(it => (
                <div key={it.id} className="flex items-center justify-between px-5 py-4">
                  <span className="text-slate-700">{it.email}</span>
                  <button 
                    onClick={() => apiFetch(`/api/albums/${slug}/access/${it.id}/`, { method: 'DELETE' }).then(load)} 
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    title="Usuń dostęp"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {justCreated && (
          <div className="mt-6 flex justify-end">
            <Link href="/dashboard?tab=albums" className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">
              {list.length > 0 ? 'Zakończ dodawanie dostępu' : 'Pomiń i wróć'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
