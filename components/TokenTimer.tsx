"use client";

import React, { useEffect, useState } from 'react';
import { getToken, decodeJwt } from '../app/lib/auth';

export default function TokenTimer() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function compute() {
      const token = getToken();
      if (!token) {
        setRemaining(null);
        return;
      }
      const payload = decodeJwt(token as string);
      if (!payload || !payload.exp) {
        setRemaining(null);
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      setRemaining(Math.max(0, payload.exp - now));
    }

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="text-slate-600 text-sm px-3 py-2 rounded-md">
      Token: {mins}:{secs.toString().padStart(2, '0')}
    </div>
  );
}
