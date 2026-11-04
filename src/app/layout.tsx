import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export const metadata: Metadata = {
  metadataBase: new URL("https://dakhil2012-alia.vercel.app"),
  title: {
    default: "দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া মাদ্রাসা | পোর্টাল ও কল্যাণ ফান্ড",
    template: "%s | দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া মাদ্রাসা",
  },
  description:
    "খুলনা আলিয়া মাদ্রাসা দাখিল ২০১২ ব্যাচের অফিসিয়াল পোর্টাল ও কল্যাণ ফান্ড ম্যানেজমেন্ট সিস্টেম। স্বচ্ছতা, জবাবদিহিতা ও বন্ধুত্বের এক অনন্য ডিজিটাল প্ল্যাটফর্ম।",
  openGraph: {
    title: "দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া মাদ্রাসা",
    description:
      "খুলনা আলিয়া মাদ্রাসা দাখিল ২০১২ ব্যাচের অফিসিয়াল পোর্টাল ও কল্যাণ ফান্ড ম্যানেজমেন্ট সিস্টেম। স্বচ্ছতা, জবাবদিহিতা ও বন্ধুত্বের এক অনন্য ডিজিটাল প্ল্যাটফর্ম।",
    url: "https://dakhil2012-alia.vercel.app",
    siteName: "দাখিল ২০১২ ব্যাচ খুলনা আলিয়া মাদ্রাসা",
    images: [
      {
        url: "/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া মাদ্রাসা অফিসিয়াল ব্যানার",
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া মাদ্রাসা",
    description:
      "খুলনা আলিয়া মাদ্রাসা দাখিল ২০১২ ব্যাচের অফিসিয়াল পোর্টাল ও কল্যাণ ফান্ড ম্যানেজমেন্ট সিস্টেম।",
    images: ["/og-banner.jpg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "দাখিল ২০১২",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <PwaRegister />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
