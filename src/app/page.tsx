import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { formatCurrency, toBengaliNumber, formatBengaliDate } from "@/lib/utils";
import {
  HeartHandshake,
  Users,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
} from "lucide-react";


export default async function HomePage() {
  const session = await getSession();

  // 1. Fetch Site Settings
  const settingsRows = await prisma.siteSetting.findMany();
  const settings = settingsRows.reduce<Record<string, string>>((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  const heroTitle = settings["hero_title"] || "দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া";
  const heroSubtitle =
    settings["hero_subtitle"] ||
    "একযুগের ভ্রাতৃত্ব, আত্মিক বন্ধন ও পারস্পরিক কল্যাণে অটুট ঐক্য। শতভাগ স্বচ্ছতা ও দায়িত্বশীলতায় পরিচালিত আমাদের কল্যাণ ফান্ড।";
  const marqueeNotice =
    settings["marquee_notice"] ||
    "📢 দাখিল ২০১২ ব্যাচের সকল বন্ধুদের প্রোফাইল হালনাগাদ এবং কল্যাণ ফান্ডের মাসিক চাঁদা নিয়মিত পরিশোধের আহ্বান জানানো হচ্ছে।";

  // 2. Compute Transparency Financial Stats
  const activeFunds = await prisma.fund.findMany({
    where: { isActive: true },
    include: {
      managers: {
        include: { user: { select: { name: true, phone: true } } },
      },
      _count: {
        select: { commitments: true, contributions: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalMembers = await prisma.user.count({
    where: { isActive: true },
  });

  const allVerifiedContributions = await prisma.monthlyContribution.aggregate({
    where: { status: "VERIFIED" },
    _sum: { amountPaid: true },
  });

  const allExpenses = await prisma.fundExpense.aggregate({
    _sum: { amount: true },
  });

  const totalCollected = Number(allVerifiedContributions._sum.amountPaid || 0);
  const totalSpent = Number(allExpenses._sum.amount || 0);
  const currentNetBalance = activeFunds.reduce(
    (sum, f) => sum + Number(f.currentBalance),
    0
  );

  // 3. Fetch Latest Notices
  const latestNotices = await prisma.notice.findMany({
    where: { isPublished: true },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 3,
    include: { author: { select: { name: true } } },
  });

  // 4. Fetch Sample Gallery Items
  const galleryItems = await prisma.galleryItem.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-emerald-200">
      <Navbar session={session} />

      {/* Marquee Ticker */}
      {marqueeNotice && (
        <div className="bg-emerald-900 text-emerald-100 py-2 px-4 border-b border-emerald-950 text-xs font-medium flex items-center overflow-hidden">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-sm font-bold shrink-0 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" /> নোটিশ
            </span>
            <div className="truncate flex-1">
              <span className="hover:underline">{marqueeNotice}</span>
            </div>
            <Link
              href="/notices"
              className="text-amber-400 hover:text-amber-300 text-xs shrink-0 flex items-center gap-0.5 ml-2"
            >
              সব নোটিশ <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-xs text-emerald-200 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>দাখিল ২০১২ অ্যালামনাই পোর্টাল ও কল্যাণ তহবিল</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {heroTitle}
          </h1>

          <p className="text-sm sm:text-lg text-emerald-100/90 max-w-3xl mx-auto font-normal leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/funds"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg hover:shadow-xl"
            >
              <HeartHandshake className="w-4 h-4" />
              তহবিলসমূহ ও অনুদান
            </Link>
            <Link
              href="/members"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white border border-emerald-500/40 font-medium text-sm transition"
            >
              <Users className="w-4 h-4" />
              ব্যাচমেট ডিরেক্টরি
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-sm transition backdrop-blur-xs"
              >
                আমার ড্যাশবোর্ড
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-sm transition backdrop-blur-xs"
              >
                যোগ দিন
              </Link>
            )}
          </div>
        </div>

        {/* Live Transparency Stats Bar */}
        <div className="max-w-6xl mx-auto mt-14 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/15 shadow-2xl">
            <div className="text-center p-3 border-r border-white/10">
              <span className="block text-xs text-emerald-200 font-medium">সক্রিয় তহবিল</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">
                {toBengaliNumber(activeFunds.length)}টি
              </span>
              <span className="text-[11px] text-emerald-300/80">সদস্য পরিচালিত</span>
            </div>

            <div className="text-center p-3 border-r border-white/10">
              <span className="block text-xs text-emerald-200 font-medium">সর্বমোট সংগৃহীত</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1 block">
                {formatCurrency(totalCollected)}
              </span>
              <span className="text-[11px] text-emerald-300/80">যাচাইকৃত জমা</span>
            </div>

            <div className="text-center p-3 border-r border-white/10">
              <span className="block text-xs text-emerald-200 font-medium">কল্যাণে মোট ব্যয়</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-100 mt-1 block">
                {formatCurrency(totalSpent)}
              </span>
              <span className="text-[11px] text-emerald-300/80">সহায়তা ও সেবা</span>
            </div>

            <div className="text-center p-3">
              <span className="block text-xs text-emerald-200 font-medium">নিবন্ধিত ব্যাচমেট</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">
                {toBengaliNumber(totalMembers)} জন
              </span>
              <span className="text-[11px] text-emerald-300/80">১২ ব্যাচ পরিবার</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 w-full">
        {/* Active Funds Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                স্বচ্ছ কল্যাণ তহবিল
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                চলমান তহবিল ও প্রকল্পসমূহ
              </h2>
            </div>
            <Link
              href="/funds"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              সকল তহবিল দেখুন <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeFunds.map((fund) => {
              const target = Number(fund.targetAmount || 0);
              const balance = Number(fund.currentBalance);
              const percent = target > 0 ? Math.min(Math.round((balance / target) * 100), 100) : 100;

              return (
                <div
                  key={fund.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col overflow-hidden group"
                >
                  <div className="h-2 bg-emerald-600 group-hover:bg-amber-500 transition-colors" />
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          {toBengaliNumber(fund._count.commitments)} জন প্রতিশ্রুতিবদ্ধ
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          #{fund.slug}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition">
                        {fund.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {fund.description || "তহবিলের নির্দিষ্ট উদ্দেশ্য ও বিস্তারিত নিয়মাবলী দেখতে ক্লিক করুন।"}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">বর্তমান স্থিতি:</span>
                          <span className="font-bold text-emerald-800">
                            {formatCurrency(balance)}
                          </span>
                        </div>
                        {target > 0 && (
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}
                        {target > 0 && (
                          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                            <span>টার্গেট: {formatCurrency(target)}</span>
                            <span>{toBengaliNumber(percent)}% সংগৃহীত</span>
                          </div>
                        )}
                      </div>

                      {fund.contactPerson && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>যোগাযোগ: {fund.contactPerson}</span>
                        </div>
                      )}

                      <Link
                        href={`/funds/${fund.slug}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-emerald-800 text-white rounded-xl transition"
                      >
                        শর্ত, নিয়মাবলী ও অনুদান দিন <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Notices & Announcements Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                সর্বশেষ বিজ্ঞপ্তি
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                নোটিশ বোর্ড ও ব্যাচ বার্তা
              </h2>
            </div>
            <Link
              href="/notices"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              সকল নোটিশ আর্কাইভ <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNotices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        notice.category === "URGENT"
                          ? "bg-red-100 text-red-800"
                          : notice.category === "MEETING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {notice.category === "URGENT"
                        ? "জরুরি নোটিশ"
                        : notice.category === "MEETING"
                        ? "সভা আহ্বান"
                        : "সাধারণ বার্তা"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatBengaliDate(notice.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 hover:text-emerald-800 transition line-clamp-2">
                    {notice.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                    {notice.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    প্রকাশক: {notice.author?.name || "কমিটি"}
                  </span>
                  <Link
                    href={`/notices`}
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    বিস্তারিত পড়ুন →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How Transparency Works: 3 Steps */}
        <section className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto space-y-8 text-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                আমাদের অঙ্গীকার
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
                কিভাবে কাজ করে আমাদের ফান্ড ব্যবস্থাপনা?
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200 mt-2 max-w-2xl mx-auto">
                আমাদের প্রতিটি টাকা বন্ধুদের আমানত। ডিজিটাল স্বচ্ছতার মাধ্যমে প্রতিটি জমার হিসাব এবং খরচের পুঙ্খানুপুঙ্খ তথ্য সবার জন্য উন্মুক্ত।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-lg">
                  ১
                </div>
                <h3 className="font-bold text-white text-sm">মাসিক অঙ্গীকার নির্ধারণ</h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  আপনার সামর্থ্য অনুযায়ী ২০০/-, ৫০০/- বা ১০০০/- টাকা মাসিক কিস্তির অঙ্গীকার করুন এবং স্বয়ংক্রিয় রিমাইন্ডার পান।
                </p>
              </div>

              <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-lg">
                  ২
                </div>
                <h3 className="font-bold text-white text-sm">সহজ ডিজিটাল পেমেন্ট</h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  নির্ধারিত বিকাশ, নগদ বা ব্যাংক একাউন্টে পাঠিয়ে পোর্টালে সরাসরি ট্রানজেকশন আইডি এন্ট্রি দিন।
                </p>
              </div>

              <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-lg">
                  ৩
                </div>
                <h3 className="font-bold text-white text-sm">স্বচ্ছ লেজার ও ডিজিটাল রসিদ</h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  ফান্ড ম্যানেজার যাচাই করার সাথে সাথে আপনার ব্যক্তিগত অ্যাকাউন্টে সবুজ স্বীকৃতি ও ডিজিটাল ভাউচার সংরক্ষিত হবে।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery / Memories Preview */}
        {galleryItems.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  স্মৃতিময় দিনগুলো
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  খুলনা আলিয়া ফটো গ্যালারি
                </h2>
              </div>
              <Link
                href="/gallery"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                পুরো অ্যালবাম দেখুন <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {galleryItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs group"
                >
                  <div className="h-48 overflow-hidden bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-emerald-700 font-semibold">
                      <span>{item.category || "স্মৃতিচারণ"}</span>
                      <span>{item.eventDate}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                    {item.caption && (
                      <p className="text-xs text-slate-500 line-clamp-2">{item.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
