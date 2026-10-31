import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { formatBengaliDate } from "@/lib/utils";
import { Bell, Pin, Calendar, User, AlertCircle, FileText } from "lucide-react";


export default async function NoticesPage() {
  const session = await getSession();

  const notices = await prisma.notice.findMany({
    where: { isPublished: true },
    include: {
      author: { select: { name: true, role: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar session={session} />

      <div className="bg-emerald-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-xs text-amber-300 font-medium">
            <Bell className="w-3.5 h-3.5" />
            <span>অফিসিয়াল নোটিশ বোর্ড</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            বিজ্ঞপ্তি ও ব্যাচ বার্তা
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            দাখিল ২০১২ ব্যাচের সভা, পুনর্মিলনী, কল্যাণ তহবিলের মাসিক বকেয়া পর্যালোচনা এবং জরুরি সিদ্ধান্তের সমন্বিত তথ্য।
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
        {notices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-sm text-slate-500">বর্তমানে কোনো প্রকাশিত নোটিশ নেই।</p>
          </div>
        ) : (
          <div className="space-y-6">
            {notices.map((notice) => (
              <article
                key={notice.id}
                className={`bg-white rounded-2xl p-6 sm:p-8 border shadow-xs space-y-4 transition ${
                  notice.isPinned
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {notice.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                        <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                        পিন করা নোটিশ
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        notice.category === "URGENT"
                          ? "bg-red-100 text-red-800"
                          : notice.category === "MEETING"
                          ? "bg-amber-100 text-amber-800"
                          : notice.category === "FUND"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {notice.category === "URGENT"
                        ? "জরুরি নোটিশ"
                        : notice.category === "MEETING"
                        ? "সভা আহ্বান"
                        : notice.category === "FUND"
                        ? "তহবিল সংক্রান্ত"
                        : "সাধারণ বার্তা"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatBengaliDate(notice.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {notice.title}
                  </h2>
                  <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {notice.content}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>প্রকাশক: {notice.author?.name || "কমিটি"}</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
