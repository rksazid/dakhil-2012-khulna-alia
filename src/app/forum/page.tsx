import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ForumFeedClient, ForumPostItem } from "./forum-feed-client";
import { MessageSquare, Users, LogIn, UserPlus, Sparkles, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "কমিউনিটি ফোরাম ও আড্ডা — দাখিল ২০১২ ব্যাচ",
  description: "খুলনা আলিয়া মাদ্রাসা দাখিল ২০১২ ব্যাচের সকল সহপাঠী ও বন্ধুদের উন্মুক্ত আলোচনা, স্মৃতিচারণ ও বার্তা বিনিময় ফোরাম।",
};

const authorSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  avatarUrl: true,
  thumbnailUrl: true,
  bannerUrl: true,
  bio: true,
  bloodGroup: true,
  studentGroup: true,
  classRoll: true,
  classroom: true,
  occupation: true,
  workplace: true,
  presentAddress: true,
  permanentAddress: true,
  role: true,
  showPhoneInDirectory: true,
  showEmailInDirectory: true,
};

export default async function ForumPage() {
  const user = await getCurrentUser();

  // If not logged in, prompt to login
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar session={null} />

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 flex items-center justify-center">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-12 text-center space-y-6 max-w-lg w-full">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900">
                দাখিল ২০১২ ব্যাচমেট ফোরাম
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                এটি আমাদের ব্যাচের সকল নিবন্ধিত বন্ধুদের একটি উন্মুক্ত আলোচনা ও যোগাযোগের প্ল্যাটফর্ম। আলোচনা পড়তে এবং বার্তা লিখতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login?callbackUrl=/forum"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition shadow-xs"
              >
                <LogIn className="w-4 h-4" /> লগইন করুন
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition"
              >
                <UserPlus className="w-4 h-4" /> নতুন একাউন্ট খুলুন
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>শুধুমাত্র খুলনা আলিয়া ২০১২ ব্যাচমেটদের জন্য সংরক্ষিত</span>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Fetch initial posts for logged-in user
  const rawPosts = await prisma.forumPost.findMany({
    where: { parentId: null },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      author: { select: authorSelect },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: authorSelect },
        },
      },
    },
  });

  const totalPostsCount = await prisma.forumPost.count();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        session={{
          userId: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          thumbnailUrl: user.thumbnailUrl,
        }}
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-xs text-amber-300 font-medium border border-emerald-700/50">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>দাখিল ২০১২ কমিউনিটি ফোরাম ও আড্ডা</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            সহপাঠীদের উন্মুক্ত মতামত ও বার্তা ওয়াল
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
            বন্ধুদের খোঁজ-খবর, স্মৃতিচারণ, মতামত বা যেকোনো কল্যাণমূলক আলোচনা এখানে সবার সাথে শেয়ার করুন এবং সরাসরি উত্তর দিন।
          </p>
        </div>
      </div>

      {/* Main Forum Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <ForumFeedClient
          initialPosts={rawPosts as unknown as ForumPostItem[]}
          currentUser={{
            id: user.id,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            thumbnailUrl: user.thumbnailUrl,
          }}
        />
      </main>

      <Footer />
    </div>
  );
}

