"use client";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function apiFetch(path: string, options: RequestInit = {}) {
  // allow passing full URL or path starting with /
  const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;

  // Allow callers to explicitly skip attaching the Authorization header by
  // passing a boolean `skipAuth` property on the options object. Also avoid
  // attaching Authorization for the auth endpoints under /api/auth/ to
  // prevent sending expired/invalid tokens when requesting codes or
  // verifying them.
  // Note: RequestInit doesn't include custom fields, so we accept a loose
  // type here by casting to any.
  const optAny = options as any;
  const skipAuth = Boolean(optAny.skipAuth);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set JSON content-type if body isn't FormData and caller hasn't set it
  const isFormData = typeof window !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach Authorization for all requests unless explicitly skipped.
  // Auth flows like request_code/verify_code should pass { skipAuth: true }.
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(fullUrl, { ...options, headers });

  if (resp.status === 401) {
    // Not authenticated - redirect to root (landing/login handled at '/')
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Unauthorized');
  }

  return resp;
}
