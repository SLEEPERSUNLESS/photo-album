"use client";

import { AuthProvider } from '../lib/AuthProvider';
import { CartProvider } from '../lib/CartProvider';
import Footer from '../../components/Footer';
import Navbar from '../../components/Navbar';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [albumTitle, setAlbumTitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (pathname.includes('/albums/')) {
      const albumId = pathname.split('/').pop();
      if (albumId) {
        setAlbumTitle(`Album ${albumId}`);
      }
    } else {
      setAlbumTitle(undefined);
    }
  }, [pathname]);

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen">
          <div className="fixed top-0 left-0 right-0 z-50">
            <Navbar albumTitle={albumTitle} />
          </div>
          <div className="pt-16 pb-12">
            {children}
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <Footer />
          </div>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}