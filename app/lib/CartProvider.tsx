"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { decodeJwt } from './auth';

export interface CartItem {
  id: number;
  title: string;
  url: string;
  album: number;
  albumTitle?: string;
  price?: number; // For future pricing functionality
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { isAuth, logout } = useAuth();

  // Get user-specific cart key
  const getCartKey = () => {
    if (typeof window === "undefined") return "cart";
    const token = localStorage.getItem("access");
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.user_id) {
        return `cart_${decoded.user_id}`;
      }
    }
    return "cart_guest";
  };

  useEffect(() => {
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [isAuth]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(items));
  }, [items, isAuth]);

  // Clear cart on logout
  useEffect(() => {
    const handleLogout = () => {
      clearCart();
    };

    if (typeof window !== "undefined") {
      window.addEventListener('userLogout', handleLogout);
      return () => window.removeEventListener('userLogout', handleLogout);
    }
  }, []);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      // Check if item already exists
      if (prev.some(existing => existing.id === item.id)) {
        return prev; // Don't add duplicates
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    const cartKey = getCartKey();
    localStorage.removeItem(cartKey);
  };

  const isInCart = (id: number) => {
    return items.some(item => item.id === id);
  };

  const getTotalItems = () => {
    return items.length;
  };

  const getTotalPrice = () => {
    // For now, return 0 since we don't have pricing yet
    // In the future, this could sum up item prices
    return 0;
  };

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    clearCart,
    isInCart,
    getTotalItems,
    getTotalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}