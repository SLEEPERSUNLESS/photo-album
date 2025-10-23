"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiPhotopea } from 'react-icons/si';
import { FaUser, FaShoppingCart } from 'react-icons/fa';
import { IoMdMenu, IoMdClose } from 'react-icons/io';
import { apiFetch } from '@/app/lib/api';
import { useCart } from '@/app/lib/CartProvider';
import TokenTimer from './TokenTimer';
import { isAuthenticated } from '@/app/lib/auth';

type Props = {
  albumTitle?: string;
};

export default function Navbar({ albumTitle }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  const auth = isAuthenticated();
  
  const linkBase = "px-3 py-2 rounded-md text-sm font-medium";
  const linkInactive = "text-slate-600 hover:text-slate-900";
  const linkActive = "text-slate-900 font-semibold bg-slate-100";
  const mobileLinkBase = "block px-3 py-2 rounded-md text-base font-medium";

  const isAlbumView = useMemo(() => {
    return Boolean(albumTitle);
  }, [albumTitle]);

  const toggleMenu = () => setIsMenuOpen((v) => !v);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!auth) {
          if (mounted) setIsAdmin(false);
          return;
        }
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
  }, [auth, pathname]);

  return (
    <nav className="bg-white shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <SiPhotopea className="text-slate-700 text-2xl mr-2" />
            </Link>
            <div className="flex flex-col">
              {isAlbumView ? (
                <>
                  <span className="text-slate-700 font-semibold text-xl">{albumTitle}</span>
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
            {isAdmin && (
              <Link
                href="/dashboard"
                className={`${linkBase} ${pathname.startsWith('/dashboard') ? linkActive : linkInactive}`}
              >
                Panel
              </Link>
            )}
            <Link
              href="/albums"
              className={`${linkBase} ${pathname.startsWith('/albums') ? linkActive : linkInactive}`}
            >
              Albumy
            </Link>
            <Link
              href="/cart"
              className={`${linkBase} ${pathname.startsWith('/cart') ? linkActive : linkInactive} relative`}
            >
              <FaShoppingCart className="inline mr-1" />
              Koszyk
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
            <TokenTimer />
            <Link
              href="/"
              className={`${linkBase} ${pathname === '/' ? linkActive : linkInactive}`}
            >
              Zamówienia
            </Link>
            <Link
              href="/"
              className={`${linkBase} ${pathname === '/' ? linkActive : linkInactive}`}
            >
              <FaUser className="inline mr-1" />
              Profil
            </Link>
            {isAdmin && (
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">
                Admin
              </span>
            )}
            {auth ? (
              <Link
                href="/logout"
                className={`${linkBase} ${pathname.startsWith('/logout') ? linkActive : linkInactive}`}
              >
                Wyloguj
              </Link>
            ) : (
              <Link
                href="/"
                className={`${linkBase} ${pathname === '/' ? linkActive : linkInactive}`}
              >
                Zaloguj
              </Link>
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
            {isAdmin && (
              <Link
                href="/dashboard"
                className={`${mobileLinkBase} ${pathname.startsWith('/dashboard') ? linkActive : linkInactive}`}
              >
                Panel
              </Link>
            )}
            <Link
              href="/albums"
              className={`${mobileLinkBase} ${pathname.startsWith('/albums') ? linkActive : linkInactive}`}
            >
              Albumy
            </Link>
            <Link
              href="/cart"
              className={`${mobileLinkBase} ${pathname.startsWith('/cart') ? linkActive : linkInactive} relative`}
            >
              <FaShoppingCart className="inline mr-1" />
              Koszyk
              {getTotalItems() > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 inline-flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
            <div className="px-3 py-2">
              <TokenTimer />
            </div>
            <Link
              href="/"
              className={`${mobileLinkBase} ${pathname === '/' ? linkActive : linkInactive}`}
            >
              Zamówienia
            </Link>
            <Link
              href="/"
              className={`${mobileLinkBase} ${pathname === '/' ? linkActive : linkInactive}`}
            >
              <FaUser className="inline mr-1" />
              Profil
            </Link>
            {isAdmin && (
              <div className="px-3 py-2 text-xs text-green-800 bg-green-50 rounded-md border border-green-200 inline-block">
                Admin
              </div>
            )}
            {auth ? (
              <Link
                href="/logout"
                className={`${mobileLinkBase} ${pathname.startsWith('/logout') ? linkActive : linkInactive}`}
              >
                Wyloguj
              </Link>
            ) : (
              <Link
                href="/"
                className={`${mobileLinkBase} ${pathname === '/' ? linkActive : linkInactive}`}
              >
                Zaloguj
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
