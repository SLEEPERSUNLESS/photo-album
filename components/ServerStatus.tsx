"use client";

import { useState } from "react";
import { healthCheck } from "@/app/lib/api";

export default function ServerStatus() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      await healthCheck();
      setStatus("ok");
    } catch {
      setStatus("error");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={check}
        disabled={checking}
        className={`px-3 py-1.5 rounded-md text-xs font-medium ${
          status === "ok"
            ? "bg-green-500 text-white"
            : status === "error"
            ? "bg-red-500 text-white"
            : "bg-slate-600 text-white hover:bg-slate-700"
        }`}
      >
        {checking ? "..." : status === "ok" ? "Serwer OK" : status === "error" ? "Serwer niedostępny" : "Status serwera"}
      </button>
    </div>
  );
}

