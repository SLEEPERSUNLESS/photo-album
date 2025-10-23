"use client";

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  showLoading?: boolean;
}

export function AuthGuard({
  children,
  redirectTo = '/',
  showLoading = true
}: AuthGuardProps) {
  const { isAuth, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuth) {
      // Redirect to login page if not authenticated
      router.push(redirectTo);
    }
  }, [isAuth, isLoading, router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading && showLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-700"></div>
          <p className="text-slate-600">Sprawdzanie dostępu...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuth) {
    return null;
  }

  // Render children only if authenticated
  return <>{children}</>;
}