"use client";

import React from "react";
import Link from "next/link";
import { useCart, CartItem } from '../../../lib/CartProvider';
import { FaTrash, FaArrowLeft, FaShoppingCart } from "react-icons/fa";

export default function CartPage() {
  const { items, removeItem, clearCart, getTotalItems, getTotalPrice } = useCart();

  const handleRemoveItem = (id: number) => {
    removeItem(id);
  };

  const handleClearCart = () => {
    if (confirm('Czy na pewno chcesz opróżnić koszyk?')) {
      clearCart();
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <FaShoppingCart className="mx-auto text-6xl text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-700 mb-2">Twój koszyk jest pusty</h1>
          <p className="text-slate-500 mb-6">Dodaj zdjęcia do koszyka, aby kontynuować zakupy.</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Link href="/albums" className="flex items-center text-slate-600 hover:text-slate-900 mr-4">
              <FaArrowLeft className="mr-2" />
              <span>Powrót do albumów</span>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Koszyk</h1>
          </div>
          <button
            onClick={handleClearCart}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <FaTrash className="mr-2" />
            Opróżnij koszyk
          </button>
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Zdjęcia w koszyku ({getTotalItems()})
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {items.map((item: CartItem) => (
              <div key={item.id} className="p-6 flex items-center space-x-4">
                <div className="flex-shrink-0 w-20 h-20 bg-slate-200 rounded-md overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-grow">
                  <h3 className="text-lg font-medium text-slate-900">{item.title}</h3>
                  {item.albumTitle && (
                    <p className="text-sm text-slate-500">Album: {item.albumTitle}</p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {item.price && (
                    <span className="text-lg font-semibold text-slate-900">
                      {item.price} zł
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="flex items-center px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                  >
                    <FaTrash className="mr-1" />
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium text-slate-900">Razem:</span>
            <span className="text-2xl font-bold text-slate-900">
              {getTotalPrice() > 0 ? `${getTotalPrice()} zł` : 'Darmowe'}
            </span>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/albums"
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              Kontynuuj zakupy
            </Link>
            <button className="px-6 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors">
              Przejdź do płatności
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}