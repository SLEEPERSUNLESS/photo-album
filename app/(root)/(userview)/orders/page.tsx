"use client";

import React, { useEffect, useState } from "react";
import { apiFetch, API_BASE } from "../../../lib/api";
import { toast } from "sonner";
import { FaDownload, FaSpinner } from "react-icons/fa";

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

  async function loadOrders() {
    setLoading(true);
    try {
      const r = await apiFetch("/api/orders/history/");
      const data = await r.json();
      setOrders(data);
    } catch (e) {
      toast.error("Błąd ładowania zamówień");
    } finally {
      setLoading(false);
    }
  }

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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Zamówienia</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[200px]">Użytkownik</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kwota</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utworzone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zapłacone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zdjęcia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={order.user_email}>{order.user_email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.total_amount} PLN</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'paid' ? 'Opłacone' :
                     order.status === 'pending' ? 'Oczekujące' :
                     order.status === 'cancelled' ? 'Anulowane' :
                     order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.paid_at ? new Date(order.paid_at).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.photos.length}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.status === 'paid' && (
                    <button
                      onClick={() => handleDownload(order.id)}
                      disabled={downloadingId === order.id}
                      className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      {downloadingId === order.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <>
                          <FaDownload className="mr-1" />
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
  );
}