"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiFetch, API_BASE, retryPayment } from "../../../lib/api";
import { toast } from "sonner";
import { FaDownload, FaSpinner, FaBox, FaArrowLeft, FaSearch, FaChevronLeft, FaChevronRight, FaRedo } from "react-icons/fa";
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

type PaginatedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("page_size", pageSize.toString());
      if (isAdmin && debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      const r = await apiFetch(`/api/orders/history/?${params.toString()}`);
      const data: PaginatedResponse = await r.json();
      setOrders(data.results);
      setTotalCount(data.count);
    } catch (e) {
      toast.error("Błąd ładowania zamówień");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, debouncedSearch, currentPage, pageSize]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

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

  async function handleRetryPayment(orderId: number) {
    setRetryingId(orderId);
    try {
      const data = await retryPayment(orderId);
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        toast.error("Nie otrzymano URL przekierowania");
      }
    } catch (error: any) {
      toast.error(error.message || "Błąd podczas wznawiania płatności");
    } finally {
      setRetryingId(null);
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

  if (orders.length === 0 && !debouncedSearch) {
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
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={order.user_email}>{order.user_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.total_amount} PLN</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'incomplete' ? 'bg-orange-100 text-orange-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {order.status === 'paid' ? 'Opłacone' :
                       order.status === 'incomplete' ? 'Niedokończone' :
                       order.status === 'pending' ? 'Oczekujące' :
                       order.status === 'cancelled' ? 'Anulowane' :
                       order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.paid_at ? new Date(order.paid_at).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.photos.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
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
                      {['incomplete', 'pending', 'cancelled'].includes(order.status) && (
                        <button
                          onClick={() => handleRetryPayment(order.id)}
                          disabled={retryingId === order.id}
                          className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                        >
                          {retryingId === order.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <>
                              <FaRedo className="mr-1.5" />
                              Kontynuuj płatność
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Pokazuje {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} z {totalCount} zamówień
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="page-size-select" className="text-sm text-slate-600">Na stronie:</label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="font-[inherit] bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer appearance-none pr-8 bg-no-repeat bg-[length:16px_16px] bg-[right_8px_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronLeft className="mr-1" />
              Poprzednia
            </button>
            
            <span className="text-sm text-slate-600 px-2">
              Strona {currentPage} z {totalPages || 1}
            </span>
            
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Następna
              <FaChevronRight className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}