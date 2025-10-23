"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiPhotopea } from 'react-icons/si';
import { FaUser, FaShoppingCart } from 'react-icons/fa';
import { IoMdMenu, IoMdClose } from 'react-icons/io';
import { isAuthenticated, removeToken } from '../app/lib/auth';
import { apiFetch } from '../app/lib/api';
import { useCart } from '../app/lib/CartProvider';
import TokenTimer from './TokenTimer';

const UserNavbar = ({ albumTitle }: { albumTitle?: string }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  
  const isAlbumPage = pathname.includes('/albums/') && pathname !== '/albums';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const auth = isAuthenticated();

  function logout() {
    removeToken();
    window.location.href = '/';
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!auth) return;
        const r = await apiFetch('/api/auth/me/');
        const me = await r.json();
        if (mounted) setIsAdmin(!!me?.is_staff);
      } catch (e) {
        if (mounted) setIsAdmin(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [auth]);

  return (
    <nav className="bg-white shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <SiPhotopea className="text-slate-700 text-2xl mr-2" />
            <div className="flex flex-col">
              {isAlbumPage ? (
                <>
                  <span className="text-slate-700 font-semibold text-xl">{albumTitle || `Album`}</span>
                  <span className="text-slate-500 text-sm">Nazwa Firmy</span>
                </>
              ) : (
                <>
                  <span className="text-slate-700 font-semibold text-xl">Twoje kolekcje zdjęć</span>
                  <span className="text-slate-700 text-sm">Nazwa Firmy</span>
                </>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {auth && (
              <>
                <Link href="/albums" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                  Albumy
                </Link>
                {isAdmin && (
                  <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                    Panel
                  </Link>
                )}
                <Link href="/cart" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium relative">
                  <FaShoppingCart className="inline mr-1" />
                  Koszyk
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
                <TokenTimer />
                <Link href="/" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                  Zamówienia
                </Link>
                <Link href="/" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                  <FaUser className="inline mr-1" />
                  Profil
                </Link>
              </>
            )}

            {!auth && (
              <Link href="/" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                Zaloguj
              </Link>
            )}

            {auth && (
              <button onClick={logout} className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Wyloguj</button>
            )}
          </div>
          
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-expanded="false"
            >
              {isMenuOpen ? (
                <IoMdClose className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <IoMdMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white">
            <Link href="/albums" className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium">
              Albumy
            </Link>
            {auth && isAdmin && (
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium">
                Panel
              </Link>
            )}
            <Link href="/cart" className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium relative">
              <FaShoppingCart className="inline mr-1" />
              Koszyk
              {getTotalItems() > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 inline-flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
            <Link href="/" className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium">
              Zamówienia
            </Link>
            <Link href="/" className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium">
              <FaUser className="inline mr-1" />
              Profil
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;
