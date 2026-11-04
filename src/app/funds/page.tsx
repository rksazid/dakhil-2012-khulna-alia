import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { formatCurrency, toBengaliNumber } from "@/lib/utils";
import { HeartHandshake, PhoneCall, ArrowRight, ShieldCheck, Users } from "lucide-react";


export default async function FundsPage() {
  const session = await getSession();

  const [funds, userCommitments] = await Promise.all([
    prisma.fund.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { commitments: true, contributions: true, expenses: true },
        },
      },
    }),
    session?.userId
      ? prisma.fundCommitment.findMany({
          where: { userId: session.userId, status: "ACTIVE" },
          select: { fundId: true, committedAmount: true },
        })
      : Promise.resolve([]),
  ]);

  const userCommitmentMap = new Map(
    userCommitments.map((c) => [c.fundId, Number(c.committedAmount)])
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar session={session} />

      <div className="bg-emerald-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-xs text-amber-300 font-medium">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>স্বচ্ছ ও জবাবদিহিতামূলক তহবিলসমূহ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            দাখিল ২০১২ ব্যাচ কল্যাণ তহবিলসমূহ
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            বন্ধুদের পারস্পরিক আপৎকালীন সহায়তা, চিকিৎসা ফান্ড, পুনর্মিলনী এবং স্থায়ী সদকায়ে যারিয়াহ প্রকল্পের জন্য পরিচালিত তহবিলসমূহ।
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {funds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-2">
            <p className="text-base font-bold text-slate-700">বর্তমানে কোনো সক্রিয় তহবিল তৈরি করা হয়নি।</p>
            <p className="text-xs text-slate-400">অ্যাডমিন প্যানেল থেকে নতুন কল্যাণ তহবিল বা প্রকল্প যুক্ত করা হলে তা এখানে প্রদর্শিত হবে।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {funds.map((fund) => {
            const target = Number(fund.targetAmount || 0);
            const balance = Number(fund.currentBalance);
            const percent = target > 0 ? Math.min(Math.round((balance / target) * 100), 100) : 100;
            const myCommittedAmount = userCommitmentMap.get(fund.id);

            return (
              <div
                key={fund.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="h-2 bg-emerald-600" />
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11.5px] font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 whitespace-nowrap">
                        {toBengaliNumber(fund._count.commitments)} জন প্রতিশ্রুতিবদ্ধ
                      </span>
                      <span
                        className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-md ${
                          fund.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {fund.isActive ? "সক্রিয়" : "স্থগিত"}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">{fund.title}</h2>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {fund.description || "তহবিলের উদ্দেশ্য ও বিস্তারিত দেখতে ক্লিক করুন।"}
                    </p>

                    {/* Active User Commitment Badge if logged in */}
                    {myCommittedAmount !== undefined && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs">
                        <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
                        <span>আপনার সক্রিয় প্রতিশ্রুতি: {formatCurrency(myCommittedAmount)}/মাস</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span className="text-slate-500">বর্তমান তহবিল স্থিতি:</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          {formatCurrency(balance)}
                        </span>
                      </div>
                      {target > 0 && (
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
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
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        <span>যোগাযোগ: {fund.contactPerson} ({fund.contactPhone})</span>
                      </div>
                    )}

                    <Link
                      href={`/funds/${fund.slug}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition shadow-2xs"
                    >
                      {myCommittedAmount !== undefined
                        ? "চাঁদা এন্ট্রি ও পরিচালনা"
                        : "শর্তাবলী দেখুন ও প্রতিশ্রুতি দিন"}{" "}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
