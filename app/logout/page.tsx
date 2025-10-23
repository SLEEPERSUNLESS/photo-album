"use client";

import { useEffect } from 'react';
import { removeToken } from '../lib/auth';

export default function LogoutPage() {
  useEffect(() => {
    removeToken();
    window.location.href = '/';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-600">Wylogowywanie...</div>
    </div>
  );
}
