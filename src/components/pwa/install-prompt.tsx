"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt || isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-emerald-900 text-white rounded-xl p-4 shadow-2xl border border-emerald-700/50 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center shrink-0 border border-emerald-600">
          <Download className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <p className="text-sm font-semibold">অ্যাপ হিসেবে ইনস্টল করুন</p>
          <p className="text-xs text-emerald-200">মোবাইল হোমস্ক্রিনে সহজে এক ক্লিকে ব্যবহার করুন।</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs px-3 py-1.5 rounded-lg transition"
        >
          ইনস্টল
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-emerald-300 hover:text-white p-1 rounded-lg"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
