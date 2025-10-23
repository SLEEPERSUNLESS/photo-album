"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isAuthenticated, getToken, removeToken } from './auth';

interface AuthContextType {
  isAuth: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      // Check if we have a token and if it's valid
      const token = getToken();
      if (token) {
        // You could add additional token validation here if needed
        // For now, we just check if the token exists
        setIsAuth(true);
      } else {
        setIsAuth(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token: string) => {
    // This would be called after successful login
    setIsAuth(true);
    setIsLoading(false);
  };

  const logout = () => {
    removeToken();
    setIsAuth(false);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuth,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}