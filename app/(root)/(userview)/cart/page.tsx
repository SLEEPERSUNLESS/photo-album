"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCart, CartItem } from '../../../lib/CartProvider';
import { FaTrash, FaArrowLeft, FaShoppingCart, FaChevronDown, FaChevronUp, FaExpand, FaArrowRight } from "react-icons/fa";
import { createPayment } from '../../../lib/api';

function getPhotoUrl(url: string): string {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
    if (!token || !url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
}

interface AlbumGroup {
  albumId: number;
  albumTitle: string;
  items: CartItem[];
  totalPrice: number;
  albumPhotoCount?: number;
  albumFullPrice?: number | null;
  hasFullAlbum: boolean;
}

export default function CartPage() {
  const { items, removeItem, clearCart, getTotalItems, getTotalPrice } = useCart();
  const [expandedAlbums, setExpandedAlbums] = useState<Set<number>>(new Set());
  const [enlargedPhoto, setEnlargedPhoto] = useState<CartItem | null>(null);

  const albumGroups = useMemo(() => {
    const groups: Record<number, AlbumGroup> = {};
    
    items.forEach(item => {
      const albumId = item.album;
      if (!groups[albumId]) {
        groups[albumId] = {
          albumId,
          albumTitle: item.albumTitle || `Album #${albumId}`,
          items: [],
          totalPrice: 0,
          albumPhotoCount: item.albumPhotoCount,
          albumFullPrice: item.albumFullPrice,
          hasFullAlbum: false,
        };
      }
      groups[albumId].items.push(item);
      groups[albumId].totalPrice += parseFloat(String(item.price)) || 0;
      if (item.albumPhotoCount) groups[albumId].albumPhotoCount = item.albumPhotoCount;
      if (item.albumFullPrice) groups[albumId].albumFullPrice = item.albumFullPrice;
    });

    Object.values(groups).forEach(group => {
      group.hasFullAlbum = !!(group.albumPhotoCount && group.items.length === group.albumPhotoCount);
    });

    return Object.values(groups);
  }, [items]);

  React.useEffect(() => {
    if (albumGroups.length > 0 && expandedAlbums.size === 0) {
      setExpandedAlbums(new Set(albumGroups.map(g => g.albumId)));
    }
  }, [albumGroups]);

  const toggleAlbum = (albumId: number) => {
    setExpandedAlbums(prev => {
      const newSet = new Set(prev);
      if (newSet.has(albumId)) {
        newSet.delete(albumId);
      } else {
        newSet.add(albumId);
      }
      return newSet;
    });
  };

  const getAlbumItems = useCallback(() => {
    if (!enlargedPhoto) return [];
    return items.filter(i => i.album === enlargedPhoto.album);
  }, [enlargedPhoto, items]);

  const handleNextPhoto = useCallback(() => {
    const albumItems = getAlbumItems();
    const idx = albumItems.findIndex(i => i.id === enlargedPhoto?.id);
    if (idx < albumItems.length - 1) setEnlargedPhoto(albumItems[idx + 1]);
  }, [enlargedPhoto, getAlbumItems]);

  const handlePrevPhoto = useCallback(() => {
    const albumItems = getAlbumItems();
    const idx = albumItems.findIndex(i => i.id === enlargedPhoto?.id);
    if (idx > 0) setEnlargedPhoto(albumItems[idx - 1]);
  }, [enlargedPhoto, getAlbumItems]);

  useEffect(() => {
    if (!enlargedPhoto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setEnlargedPhoto(null); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleNextPhoto(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevPhoto(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enlargedPhoto, handleNextPhoto, handlePrevPhoto]);

  useEffect(() => {
    if (!enlargedPhoto) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

    let canScroll = true;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!canScroll) return;
      canScroll = false;
      e.deltaY > 0 ? handleNextPhoto() : handlePrevPhoto();
      setTimeout(() => canScroll = true, 300);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.setProperty('--scrollbar-width', '0px');
      window.removeEventListener('wheel', handleWheel);
    };
  }, [enlargedPhoto, handleNextPhoto, handlePrevPhoto]);

  const handleRemoveItem = (id: number) => {
    removeItem(id);
  };

  const handleClearCart = () => {
    if (confirm('Czy na pewno chcesz opróżnić koszyk?')) {
      clearCart();
    }
  };

  const handlePayment = async () => {
    if (items.length === 0) return;
    
    try {
      const photoIds = items.map(item => item.id);
      const paymentData = await createPayment(photoIds);
      window.location.href = paymentData.redirect_url;
    } catch (error) {
      alert('Błąd podczas tworzenia płatności');
      console.error(error);
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
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Koszyk</h1>
          <button
            onClick={handleClearCart}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <FaTrash className="mr-2" />
            Opróżnij koszyk
          </button>
        </div>

        <div className="space-y-4">
          {albumGroups.map((group) => {
            const isSingleAlbum = albumGroups.length === 1;
            const isExpanded = isSingleAlbum || expandedAlbums.has(group.albumId);
            
            return (
            <div key={group.albumId} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div
                onClick={() => !isSingleAlbum && toggleAlbum(group.albumId)}
                className={`w-full px-6 py-4 border-b border-slate-200 flex items-center justify-between transition-colors ${!isSingleAlbum ? 'cursor-pointer hover:bg-slate-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {!isSingleAlbum && (
                      expandedAlbums.has(group.albumId) ? (
                        <FaChevronUp className="text-slate-400" />
                      ) : (
                        <FaChevronDown className="text-slate-400" />
                      )
                    )}
                    <h2 className="text-lg font-semibold text-slate-900">{group.albumTitle}</h2>
                  </div>
                  <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {group.items.length} {group.items.length === 1 ? 'zdjęcie' : group.items.length < 5 ? 'zdjęcia' : 'zdjęć'}
                  </span>
                </div>
                <span className="text-lg font-semibold text-slate-700">
                  {group.hasFullAlbum && group.albumFullPrice && group.albumFullPrice < group.totalPrice ? (
                    <>
                      <span className="line-through text-slate-400 font-normal">{Number(group.totalPrice).toFixed(2)} zł</span>
                      <span className="ml-2 text-green-600">{Number(group.albumFullPrice).toFixed(2)} zł</span>
                    </>
                  ) : (
                    group.totalPrice > 0 ? `${Number(group.totalPrice).toFixed(2)} zł` : 'Darmowe'
                  )}
                </span>
              </div>

              {isExpanded && (
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {group.items.map((item: CartItem) => (
                      <div key={item.id} className="relative">
                        <div className="group aspect-square bg-slate-200 rounded-md overflow-hidden relative">
                          <img
                            src={getPhotoUrl(item.url)}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEnlargedPhoto(item)}
                              className="p-2 bg-white/90 text-slate-700 rounded-full hover:bg-white transition-colors"
                              title="Powiększ zdjęcie"
                            >
                              <FaExpand className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                              title="Usuń z koszyka"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 truncate" title={item.title}>
                          {item.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
      </div>

      {enlargedPhoto && (() => {
        const albumItems = items.filter(i => i.album === enlargedPhoto.album);
        const currentIdx = albumItems.findIndex(i => i.id === enlargedPhoto.id);
        const hasPrev = currentIdx > 0;
        const hasNext = currentIdx < albumItems.length - 1;
        
        return (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]"
            onClick={() => setEnlargedPhoto(null)}
          >
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); setEnlargedPhoto(albumItems[currentIdx - 1]); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 flex items-center justify-center z-[70]"
                aria-label="Poprzednie zdjęcie"
              >
                <FaArrowLeft />
              </button>
            )}

            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); setEnlargedPhoto(albumItems[currentIdx + 1]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 flex items-center justify-center z-[70]"
                aria-label="Następne zdjęcie"
              >
                <FaArrowRight />
              </button>
            )}

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <img
                src={getPhotoUrl(enlargedPhoto.url)}
                alt={enlargedPhoto.title || "Powiększone zdjęcie"}
                className="block max-w-[90vw] max-h-[80vh] object-contain select-none"
              />
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded">
                {enlargedPhoto.title || "Bez tytułu"} {enlargedPhoto.price ? `- ${Number(enlargedPhoto.price).toFixed(2)} zł` : ''} 
                <span className="ml-2 text-white/70">({currentIdx + 1}/{albumItems.length})</span>
              </div>
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl leading-none z-[70]"
                aria-label="Zamknij powiększone zdjęcie"
              >
                ×
              </button>
            </div>
          </div>
        );
      })()}

      <div className="fixed bottom-0 left-0 bg-white border-t border-slate-200 shadow-lg z-40" style={{ right: 'var(--scrollbar-width, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-700">
              <FaShoppingCart className="text-slate-500" />
              <span>W koszyku: <strong>{getTotalItems()}</strong> {getTotalItems() === 1 ? 'zdjęcie' : getTotalItems() < 5 ? 'zdjęcia' : 'zdjęć'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              {(() => {
                const regularTotal = getTotalPrice();
                const discountedTotal = albumGroups.reduce((sum, group) => {
                  if (group.hasFullAlbum && group.albumFullPrice && group.albumFullPrice < group.totalPrice) {
                    return sum + group.albumFullPrice;
                  }
                  return sum + group.totalPrice;
                }, 0);
                const hasDiscount = discountedTotal < regularTotal;
                
                if (hasDiscount && regularTotal > 0) {
                  return (
                    <span>Razem: <span className="line-through text-slate-400">{regularTotal.toFixed(2)} zł</span> <strong className="text-lg text-green-600">{discountedTotal.toFixed(2)} zł</strong></span>
                  );
                }
                return <span>Razem: <strong className="text-lg">{regularTotal > 0 ? `${regularTotal.toFixed(2)} zł` : 'Darmowe'}</strong></span>;
              })()}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/albums"
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              Kontynuuj zakupy
            </Link>
            <button 
              onClick={handlePayment}
              className="flex items-center px-5 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              <FaShoppingCart className="mr-2" />
              Przejdź do płatności
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
