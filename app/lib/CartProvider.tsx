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
  price?: number;
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
  const [currentCartKey, setCurrentCartKey] = useState<string>("");

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
    setCurrentCartKey(cartKey);
    
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        let parsedCart = JSON.parse(savedCart);
        parsedCart = parsedCart.map((item: CartItem) => ({
          ...item,
          price: parseFloat(item.price as any) || 0,
        }));
        setItems(parsedCart);
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    if (currentCartKey) {
      localStorage.setItem(currentCartKey, JSON.stringify(items));
    }
  }, [items, currentCartKey]);

  useEffect(() => {
    const handleAuthChange = () => {
      const newCartKey = getCartKey();
      if (newCartKey !== currentCartKey) {
        if (currentCartKey) {
          localStorage.setItem(currentCartKey, JSON.stringify(items));
        }
        
        setCurrentCartKey(newCartKey);
        const savedCart = localStorage.getItem(newCartKey);
        if (savedCart) {
          try {
            let parsedCart = JSON.parse(savedCart);
            parsedCart = parsedCart.map((item: CartItem) => ({
              ...item,
              price: parseFloat(item.price as any) || 0,
            }));
            setItems(parsedCart);
          } catch (error) {
            console.error('Failed to parse saved cart on auth change:', error);
            setItems([]);
          }
        } else {
          setItems([]);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener('userLogout', handleAuthChange);
      window.addEventListener('userLogin', handleAuthChange);
      return () => {
        window.removeEventListener('userLogout', handleAuthChange);
        window.removeEventListener('userLogin', handleAuthChange);
      };
    }
  }, [currentCartKey, items]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      if (prev.some(existing => existing.id === item.id)) {
        return prev;
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
    return items.reduce((total, item) => total + (parseFloat(item.price as any) || 0), 0);
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