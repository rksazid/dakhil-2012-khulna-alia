import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatBengaliDate, formatBengaliDateTime, formatCurrency, toBengaliNumber } from "@/lib/utils";
import { PaymentStatus } from "@prisma/client";
import {
  ShieldCheck,
  Clock,
  XCircle,
  FileText,
  User,
  HeartHandshake,
  Calendar,
  CreditCard,
  Hash,
  Download,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Shield,
  School,
  Lock,
} from "lucide-react";
import QRCode from "qrcode";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const contribution = await prisma.monthlyContribution.findUnique({
    where: { id },
    select: {
      amountPaid: true,
      monthYear: true,
      status: true,
      user: { select: { name: true } },
      fund: { select: { title: true } },
    },
  });

  if (!contribution) {
    return {
      title: "রশিদ যাচাইকরণ | দাখিল ২০১২ ব্যাচ",
      description: "ডিজিটাল মানি রিসিপ্ট সত্যতা যাচাইকরণ পোর্টাল।",
    };
  }

  const isApproved = contribution.status === PaymentStatus.VERIFIED;
  const amountStr = formatCurrency(Number(contribution.amountPaid));

  return {
    title: `${isApproved ? "✓ যাচাইকৃত রশিদ" : "রশিদ যাচাই"} — ${contribution.user.name} | ${contribution.fund.title}`,
    description: `দাখিল ২০১২ ব্যাচ খুলনা আলিয়া মাদ্রাসা ডিজিটাল অনুদান রশিদ। অনুদানদাতা: ${contribution.user.name}, পরিমাণ: ${amountStr}, অনুদানের মাস: ${contribution.monthYear}।`,
  };
}

export default async function ReceiptVerificationPage({ params }: Props) {
  const { id } = await params;

  const contribution = await prisma.monthlyContribution.findUnique({
    where: { id },
    include: {
      fund: true,
      user: true,
      verifiedBy: { select: { id: true, name: true, role: true } },
    },
  });

  if (!contribution) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900">
            রশিদের রেকর্ড পাওয়া যায়নি
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            প্রদত্ত কিউআর কোড বা রশিদ আইডির সাথে মিল পাওয়া যায়নি। অনুগ্রহ করে রশিদ নম্বরটি পুনরায় পরীক্ষা করুন।
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <ArrowLeft className="w-4 h-4" /> পোর্টালের হোমপেজে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = contribution.status === PaymentStatus.VERIFIED;
  const isPending = contribution.status === PaymentStatus.PENDING;
  const isRejected = contribution.status === PaymentStatus.REJECTED;

  const receiptNo = `RCPT-${contribution.monthYear.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, "")}-${contribution.id.slice(-6).toUpperCase()}`;
  const amountFormatted = formatCurrency(Number(contribution.amountPaid));

  const submissionDateFormatted = formatBengaliDateTime(contribution.createdAt);
  const approvalDateFormatted = contribution.verifiedAt
    ? formatBengaliDateTime(contribution.verifiedAt)
    : null;

  // Mask phone for public privacy while proving authenticity (e.g. 01833***302)
  const phone = contribution.user.phone || "";
  const maskedPhone =
    phone.length >= 8
      ? `${phone.slice(0, 5)}***${phone.slice(-3)}`
      : phone;

  // Generate QR Code data URL for this verification URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dakhil2012-alia.vercel.app";
  const verificationUrl = `${baseUrl.replace(/\/+$/, "")}/verify/receipt/${contribution.id}`;
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 140,
      color: { dark: "#064e3b", light: "#ffffff" },
    });
  } catch (err) {
    console.warn("QR Code render error:", err);
  }

  const sectionLabel =
    contribution.user.studentGroup === "SCIENCE"
      ? "বিজ্ঞান শাখা"
      : contribution.user.studentGroup === "ARTS"
      ? "সাধারণ / মানবিক শাখা"
      : contribution.user.classroom || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/logo.png"
                alt="দাখিল ২০১২ ব্যাচ লোগো"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <span className="block text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                দাখিল ২০১২ ব্যাচ
              </span>
              <span className="block text-[11px] font-semibold text-emerald-800">
                খুলনা আলিয়া মাদ্রাসা — সেন্ট্রাল পোর্টাল
              </span>
            </div>
          </Link>
          <p className="text-[11px] text-slate-500 font-medium">
            ডিজিটাল মানি রিসিপ্ট ও কল্যাণ অনুদান সত্যতা যাচাইকরণ
          </p>
        </div>

        {/* Verification Status Card */}
        <div
          className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 border shadow-lg ${
            isApproved
              ? "bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white border-emerald-700/60"
              : isRejected
              ? "bg-gradient-to-br from-red-900 via-rose-900 to-slate-950 text-white border-red-700/60"
              : "bg-gradient-to-br from-amber-900 via-amber-800 to-slate-950 text-white border-amber-700/60"
          }`}
        >
          {/* Background watermark badge */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            {isApproved ? (
              <ShieldCheck className="w-48 h-48" />
            ) : isRejected ? (
              <XCircle className="w-48 h-48" />
            ) : (
              <Clock className="w-48 h-48" />
            )}
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  isApproved
                    ? "bg-emerald-500 text-white"
                    : isRejected
                    ? "bg-red-500 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                {isApproved ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : isRejected ? (
                  <XCircle className="w-7 h-7" />
                ) : (
                  <Clock className="w-7 h-7" />
                )}
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-white/20 text-white backdrop-blur-xs">
                  {isApproved ? "VERIFIED & AUTHENTIC" : isRejected ? "REJECTED" : "PENDING VERIFICATION"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {isApproved
                    ? "ডিজিটাল মানি রিসিপ্টটি শতভাগ বৈধ ও অনুমোদিত"
                    : isRejected
                    ? "অনুদানের রেকর্ডটি বাতিল করা হয়েছে"
                    : "অনুদানের রেকর্ডটি যাচাই অপেক্ষমান রয়েছে"}
                </h2>
                <p className="text-xs text-white/80 leading-relaxed pt-0.5">
                  {isApproved
                    ? "এই রশিদের যাবতীয় লেনদেন তথ্য দাখিল ২০১২ ব্যাচ কল্যাণ তহবিলের কেন্দ্রীয় লেজারের সাথে সংরক্ষিত ও যাচাইকৃত।"
                    : isRejected
                    ? "লেনদেন তথ্যে অসঙ্গতির কারণে এই এন্ট্রিটি বাতিল করা হয়েছে।"
                    : "অনুদানটি ডাটাবেসে সফলভাবে জমা পড়েছে। কর্তৃপক্ষ কর্তৃক সত্যতা যাচাই সম্পন্ন হলে চূড়ান্ত অনুমোদন কার্যকর হবে।"}
                </p>
              </div>
            </div>

            {/* Quick QR box on top card */}
            {qrCodeDataUrl && (
              <div className="hidden sm:flex flex-col items-center bg-white p-2.5 rounded-2xl shadow-md shrink-0">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-20 h-20 rounded-lg"
                />
                <span className="text-[9px] font-bold text-emerald-900 mt-1">
                  ভেরিফিকেশন কিউআর
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Information Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
          {/* Header row: Receipt No & Amount */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                অফিসিয়াল রশিদ নম্বর
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-900 tracking-tight">
                #{receiptNo}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                পরিশোধিত অনুদানের পরিমাণ
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                {amountFormatted}
              </span>
            </div>
          </div>

          {/* Donor & Academic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              অনুদানদাতার পরিচিতি
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[11px] text-slate-500 block">সদস্যের নাম:</span>
                <span className="text-sm font-bold text-slate-900">
                  {contribution.user.name}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">ব্যাচ ও প্রতিষ্ঠান:</span>
                <span className="text-sm font-semibold text-slate-800">
                  দাখিল ২০১২, খুলনা আলিয়া মাদ্রাসা
                </span>
              </div>
              {contribution.user.classRoll && (
                <div>
                  <span className="text-[11px] text-slate-500 block">শ্রেণি রোল:</span>
                  <span className="text-sm font-semibold text-slate-800 font-mono">
                    #{toBengaliNumber(contribution.user.classRoll)}
                  </span>
                </div>
              )}
              {sectionLabel && (
                <div>
                  <span className="text-[11px] text-slate-500 block">শাখা / বিভাগ:</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {sectionLabel}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[11px] text-slate-500 block">মোবাইল নম্বর:</span>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {maskedPhone}
                </span>
              </div>
              {contribution.user.occupation && (
                <div>
                  <span className="text-[11px] text-slate-500 block">পেশা:</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {contribution.user.occupation}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Ledger Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
              তহবিল ও লেনদেন সারসংক্ষেপ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[11px] text-slate-500 block">খাত / তহবিলের নাম:</span>
                <span className="text-sm font-bold text-emerald-900">
                  {contribution.fund.title}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">অনুদানের মাস:</span>
                <span className="text-sm font-bold text-slate-900">
                  {contribution.monthYear}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">পেমেন্ট মাধ্যম:</span>
                <span className="text-sm font-semibold text-slate-800">
                  {contribution.paymentMethod}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">TrxID / রেফারেন্স:</span>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {contribution.transactionId || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">জমার তারিখ ও সময় (বাংলাদেশ সময়):</span>
                <span className="text-xs font-medium text-slate-800">
                  {submissionDateFormatted}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">অনুমোদনের তারিখ ও সময় (বাংলাদেশ সময়):</span>
                <span className="text-xs font-medium text-slate-800">
                  {approvalDateFormatted || "যাচাই অপেক্ষমান"}
                </span>
              </div>
              {contribution.verifiedBy && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-slate-500 block">অনুমোদনকারী কর্মকর্তা:</span>
                  <span className="text-xs font-bold text-emerald-800">
                    {contribution.verifiedBy.name} (
                    {contribution.verifiedBy.role === "SUPER_ADMIN"
                      ? "সুপার এডমিন"
                      : "ফান্ড ম্যানেজার"}
                    )
                  </span>
                </div>
              )}
              {contribution.note && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-slate-500 block">মন্তব্য / বিবরণ:</span>
                  <span className="text-xs text-slate-700 italic">
                    &ldquo;{contribution.note}&rdquo;
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={`/api/receipts/${contribution.id}`}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition"
            >
              <Download className="w-4 h-4" />
              অফিসিয়াল PDF রশিদ ডাউনলোড করুন
            </a>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              মূল পোর্টাল
            </Link>
          </div>
        </div>

        {/* Security & Cryptographic Note */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200/80 text-center space-y-1 text-slate-500 text-[11px]">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>নিরাপদ ও এনক্রিপ্টেড ডিজিটাল ভেরিফিকেশন সিস্টেম</span>
          </div>
          <p className="max-w-lg mx-auto text-slate-400">
            এই ভেরিফিকেশন পেজটি সরাসরি দাখিল ২০১২ ব্যাচ খুলনা আলিয়া মাদ্রাসা ক্লাউড ডাটাবেসের সাথে সংযুক্ত।
            কাগজের প্রিন্ট করা কপি অথবা মোবাইল স্ক্রিনের কিউআর কোড স্ক্যান করে যে কেউ তাৎক্ষণিক সত্যতা যাচাই করতে পারেন।
          </p>
        </div>
      </div>
    </div>
  );
}

