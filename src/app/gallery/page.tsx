import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GalleryClient, GalleryItemView } from "./gallery-client";
import { Image as ImageIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "স্মৃতি ও ছবির অ্যালবাম — দাখিল ২০১২ ব্যাচ",
  description: "খুলনা আলিয়া মাদ্রাসা দাখিল ২০১২ ব্যাচের সোনালী স্মৃতি, পুনর্মিলনী ও বন্ধুদের আনন্দঘন মুহূর্তসমূহের ছবির সংগ্রহশালা।",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const user = await getCurrentUser();

  const galleryItems = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "desc" },
  });

  const canManage =
    user?.role === "SUPER_ADMIN" || user?.role === "FUND_MANAGER";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        session={
          user
            ? {
                userId: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                thumbnailUrl: user.thumbnailUrl,
              }
            : null
        }
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-xs text-amber-300 font-medium border border-emerald-700/50">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>স্মৃতি ও ছবির অ্যালবাম</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            খুলনা আলিয়া ২০১২ ব্যাচের স্মৃতিকথা
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            ক্যাম্পাসের সোনালী দিন, বার্ষিক ইফতার মাহফিল, পুনর্মিলনী ও বন্ধুদের আনন্দঘন মুহূর্তসমূহের ছবির সংগ্রহশালা।
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <GalleryClient
          initialItems={galleryItems as unknown as GalleryItemView[]}
          canManage={canManage}
        />
      </main>

      <Footer />
    </div>
  );
}
