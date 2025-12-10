"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiFetch, API_BASE } from "../../../lib/api";
import { toast } from "sonner";
import { FaDownload, FaSpinner, FaBox, FaArrowLeft, FaSearch } from "react-icons/fa";
import Link from "next/link";

type Order = {
  id: number;
  photos: any[];
  total_amount: string;
  payu_order_id: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
  user_email: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const r = await apiFetch("/api/auth/me/");
        const data = await r.json();
        setIsAdmin(!!data?.is_staff);
      } catch {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const searchParam = isAdmin && debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : "";
      const r = await apiFetch(`/api/orders/history/${searchParam}`);
      const data = await r.json();
      setOrders(data);
    } catch (e) {
      toast.error("Błąd ładowania zamówień");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, debouncedSearch]);

  async function handleDownload(orderId: number) {
    setDownloadingId(orderId);
    try {
      const token = localStorage.getItem("access");
      const resp = await fetch(`${API_BASE}/api/orders/${orderId}/download/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        throw new Error("Download failed");
      }
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zamowienie_${orderId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Pobieranie rozpoczęte");
    } catch {
      toast.error("Błąd pobierania zdjęć");
    } finally {
      setDownloadingId(null);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <FaBox className="mx-auto text-6xl text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-700 mb-2">Brak zamówień</h1>
          <p className="text-slate-500 mb-6">Nie masz jeszcze żadnych zamówień. Przejdź do albumów, aby rozpocząć zakupy.</p>
          <Link
            href="/albums"
            className="inline-flex items-center px-6 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Przejdź do albumów
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Zamówienia</h1>
          {isAdmin && (
            <div className="bg-white flex items-center gap-2 h-10 rounded-md border border-slate-300 px-3">
              <FaSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Szukaj po emailu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 outline-none border-none text-sm"
              />
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Użytkownik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kwota</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Utworzone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zapłacone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zdjęcia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={order.user_email}>{order.user_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.total_amount} PLN</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {order.status === 'paid' ? 'Opłacone' :
                       order.status === 'pending' ? 'Oczekujące' :
                       order.status === 'cancelled' ? 'Anulowane' :
                       order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.paid_at ? new Date(order.paid_at).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.photos.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.status === 'paid' && (
                      <button
                        onClick={() => handleDownload(order.id)}
                        disabled={downloadingId === order.id}
                        className="inline-flex items-center px-3 py-1.5 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                      >
                        {downloadingId === order.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <>
                            <FaDownload className="mr-1.5" />
                            Pobierz
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}