"use client";

import React from "react";
import Link from "next/link";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <FaCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
        <h1 className="text-3xl font-bold text-slate-700 mb-2">Płatność zakończona sukcesem!</h1>
        <p className="text-slate-500 mb-6">Dziękujemy za zakup zdjęć. Twoje zamówienie zostało zrealizowane.</p>
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