"use client";

import React, { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";
import { AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";

export default function ColdStartBanner() {
  const [isWaking, setIsWaking] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const testConnection = async () => {
    try {
      setRetrying(true);
      await checkHealth();
      setIsWaking(false);
    } catch {
      setIsWaking(true);
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  if (!isWaking) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
          <span>
            <strong>Waking up the server</strong> — free-tier instances may sleep after inactivity; this can take ~30 seconds on cold start.
          </span>
        </div>
        <button
          onClick={testConnection}
          disabled={retrying}
          className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-200 hover:bg-amber-300 rounded-md text-xs font-semibold text-amber-950 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
          <span>{retrying ? "Checking..." : "Retry Connection"}</span>
        </button>
      </div>
    </div>
  );
}

