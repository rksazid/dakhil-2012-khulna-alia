"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Check for service worker updates
            reg.update();
          })
          .catch((err) => {
            console.warn("PWA Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
