"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await apiFetch("auth/me/");
        const me = await r.json();
        if (mounted && me?.is_staff) setAllowed(true);
        else if (mounted) {
          setAllowed(false);
          router.replace("/albums");
        }
      } catch (e) {
        if (mounted) {
          setAllowed(false);
          router.replace("/albums");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="flex-1">
      {children}
    </div>
  );
}