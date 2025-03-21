'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiPhotopea } from 'react-icons/si';
import { FaUser } from 'react-icons/fa';
import { IoMdMenu, IoMdClose } from 'react-icons/io';

const UserNavbar = ({ albumTitle }: { albumTitle?: string }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const isAlbumPage = pathname.includes('/albums/') && pathname !== '/albums';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-4">
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
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/albums" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
              Albumy
            </Link>
            <Link href="/" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
              Zamówienia
            </Link>
            <Link href="/" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
              <FaUser className="inline mr-1" />
              Profil
            </Link>
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
