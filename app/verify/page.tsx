"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';
import { setToken, setTokens } from '../lib/auth';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const e = localStorage.getItem('auth_email') || '';
    setEmail(e);
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    try {
  const r = await apiFetch('/api/auth/verify_code/', ({ method: 'POST', body: JSON.stringify({ email, code }), skipAuth: true } as any));
      const data = await r.json();
      if (r.ok && data.access) {
        // store access and refresh if provided
        // @ts-ignore
        if (data.refresh) setTokens(data.access, data.refresh);
        else setToken(data.access);
        router.push('/albums');
      } else {
        setMessage(data.detail || 'Invalid code');
      }
    } catch (err) {
      setMessage('Verification failed');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Enter code</h2>
      <form onSubmit={verify}>
        <label className="block mb-2">Email</label>
        <input value={email} readOnly className="w-full p-2 border mb-4 bg-gray-100" />
        <label className="block mb-2">Code</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full p-2 border mb-4" />
        <button className="w-full p-2 bg-slate-700 text-white">Verify</button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
