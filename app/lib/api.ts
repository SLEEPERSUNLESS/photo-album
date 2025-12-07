"use client";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://20.251.168.46";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;

  const optAny = options as any;
  const skipAuth = Boolean(optAny.skipAuth);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  const isFormData = typeof window !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(fullUrl, { ...options, headers });

  if (resp.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Unauthorized');
  }

  return resp;
}

export async function createPayment(photoIds: number[]) {
  const resp = await apiFetch('/payment/create/', {
    method: 'POST',
    body: JSON.stringify({ photo_ids: photoIds }),
  });

  if (!resp.ok) {
    throw new Error('Failed to create payment');
  }

  return resp.json();
}

export async function healthCheck() {
  const resp = await apiFetch('/api/auth/health/', {
    method: 'GET',
  });

  if (!resp.ok) {
    throw new Error('Health check failed');
  }

  return resp.json();
}
