'use client';

import React from "react";
import { AuthGuard } from "../../lib/AuthGuard";

export default function UserViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="user-view-layout">
        {children}
      </div>
    </AuthGuard>
  );
} 