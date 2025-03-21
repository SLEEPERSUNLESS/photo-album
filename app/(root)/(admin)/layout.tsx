import React from "react";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1">
      <AdminNavbar />
      {children}
    </div>
  );
} 