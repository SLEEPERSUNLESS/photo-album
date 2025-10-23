'use client';

import UserNavbar from "@/components/userNavbar";
import Footer from "@/components/Footer";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "../../lib/AuthGuard";

export default function UserViewLayout({
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
    <AuthGuard>
      <div className="user-view-layout flex flex-col min-h-screen">
        <UserNavbar albumTitle={albumTitle} />
        <div className="flex-grow">{children}</div>
        <Footer />
      </div>
    </AuthGuard>
  );
} 