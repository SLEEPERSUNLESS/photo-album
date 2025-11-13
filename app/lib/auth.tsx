"use client";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://131.163.97.69/";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  // store access token
  localStorage.setItem("access", token);
}

export function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem('access', access);
  if (refresh) localStorage.setItem('refresh', refresh);
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
}

export function isAuthenticated() {
  return !!getToken();
}

// Decode JWT and return payload JSON (very small helper)
export function decodeJwt(token: string | null) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}
