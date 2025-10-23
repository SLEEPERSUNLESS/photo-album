"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../../../lib/api";

interface AccessItem { id: number; email: string }

export default function AlbumAccessPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const [list, setList] = useState<AccessItem[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string| null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dostęp do albumu</h1>
      <div className="mb-4"><Link href="/dashboard?tab=albums" className="underline">← Wróć do listy</Link></div>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="user@example.com" className="flex-1 border p-2 rounded" />
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
    </div>
  );
}
