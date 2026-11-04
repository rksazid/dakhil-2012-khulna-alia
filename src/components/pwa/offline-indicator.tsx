"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => {
        setIsOffline(false);
        setJustReconnected(true);
        // Soft refresh or revalidate after 2 seconds
        const timer = setTimeout(() => {
          setJustReconnected(false);
          // Trigger a soft refresh to sync latest data
          if (window.location) {
            window.location.reload();
          }
        }, 1800);
        return () => clearTimeout(timer);
      };

      const handleOffline = () => {
        setIsOffline(true);
        setJustReconnected(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  if (justReconnected) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-in slide-in-from-bottom duration-300">
        <div className="bg-emerald-900/95 backdrop-blur-md text-white border border-emerald-500/50 shadow-2xl rounded-2xl py-2.5 px-4 flex items-center justify-center gap-2.5 text-xs font-bold">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>ইন্টারনেট সংযোগ ফিরে এসেছে — নতুন তথ্য সিঙ্ক হচ্ছে...</span>
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
        </div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-in slide-in-from-bottom duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-amber-500/40 shadow-2xl rounded-2xl py-2.5 px-4 flex items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11.5px] sm:text-xs">
              অফলাইন মোড: সংরক্ষিত তথ্য দেখাচ্ছে। সংযোগ এলে সিঙ্ক হবে।
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
