"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FaCheckCircle, FaArrowLeft, FaDownload, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import { apiFetch, API_BASE } from "../../../lib/api";
import { useCart } from "../../../lib/CartProvider";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    async function checkStatus() {
      try {
        const resp = await apiFetch(`/api/orders/${orderId}/check-status/`);
        if (!resp.ok) {
          setStatus("error");
          return;
        }
        const data = await resp.json();
        if (data.new_status === "paid" || data.payu_status === "COMPLETED") {
          setStatus("paid");
          clearCart();
        } else if (data.new_status === "pending" || data.payu_status === "PENDING") {
          setStatus("pending");
          // Retry after 3 seconds
          setTimeout(checkStatus, 3000);
        } else {
          setStatus("pending");
          setTimeout(checkStatus, 3000);
        }
      } catch {
        setStatus("error");
      }
    }

    checkStatus();
  }, [orderId]);

  async function handleDownload() {
    if (!orderId) return;
    setDownloading(true);
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
    } catch {
      alert("Błąd pobierania zdjęć");
    } finally {
      setDownloading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <FaSpinner className="mx-auto text-6xl text-slate-500 mb-4 animate-spin" />
          <h1 className="text-3xl font-bold text-slate-700 mb-2">Sprawdzanie płatności...</h1>
          <p className="text-slate-500 mb-6">Proszę czekać, weryfikujemy status Twojej płatności.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto text-6xl text-yellow-500 mb-4" />
          <h1 className="text-3xl font-bold text-slate-700 mb-2">Wystąpił problem</h1>
          <p className="text-slate-500 mb-6">Nie udało się zweryfikować statusu płatności. Sprawdź swoje zamówienia.</p>
          <Link
            href="/orders"
            className="inline-flex items-center px-6 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            Przejdź do zamówień
          </Link>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <FaSpinner className="mx-auto text-6xl text-blue-500 mb-4 animate-spin" />
          <h1 className="text-3xl font-bold text-slate-700 mb-2">Oczekiwanie na potwierdzenie płatności...</h1>
          <p className="text-slate-500 mb-6">Twoja płatność jest przetwarzana. Strona odświeży się automatycznie.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <FaCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
        <h1 className="text-3xl font-bold text-slate-700 mb-2">Płatność zakończona sukcesem!</h1>
        <p className="text-slate-500 mb-6">Dziękujemy za zakup zdjęć. Możesz teraz pobrać swoje zdjęcia.</p>
        
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <FaSpinner className="mr-2 animate-spin" />
              Pobieranie...
            </>
          ) : (
            <>
              <FaDownload className="mr-2" />
              Pobierz zdjęcia (ZIP)
            </>
          )}
        </button>
        
        <div className="mt-4">
          <Link
            href="/albums"
            className="inline-flex items-center px-6 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Przejdź do albumów
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <FaSpinner className="mx-auto text-6xl text-slate-500 mb-4 animate-spin" />
          <h1 className="text-3xl font-bold text-slate-700 mb-2">Ładowanie...</h1>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}