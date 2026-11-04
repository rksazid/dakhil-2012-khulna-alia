"use client";

import { useEffect, useState } from "react";
import {
  X,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Droplet,
  GraduationCap,
  Hash,
  School,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Heart,
  Calendar,
} from "lucide-react";

export interface MemberDetailData {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  avatarUrl?: string | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  bloodGroup?: string | null;
  studentGroup?: string | null;
  classRoll?: string | null;
  classroom?: string | null;
  occupation?: string | null;
  workplace?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  role?: string | null;
  showPhoneInDirectory?: boolean;
  showEmailInDirectory?: boolean;
}

interface MemberDetailModalProps {
  member: MemberDetailData | null;
  onClose: () => void;
}

export function MemberDetailModal({ member, onClose }: MemberDetailModalProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (member) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [member, onClose]);

  if (!member) return null;

  const handleCopy = (text: string, type: "phone" | "email") => {
    navigator.clipboard.writeText(text);
    if (type === "phone") {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-lg w-full overflow-hidden my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col relative"
      >
        {/* Top Header Block: Cover Banner + Avatar + Member Name (Non-scrolling so avatar never gets clipped) */}
        <div className="relative shrink-0 bg-white">
          {/* Cover Banner */}
          <div className="h-32 sm:h-40 w-full relative overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950">
            {member.bannerUrl ? (
              <img
                src={member.bannerUrl}
                alt={`${member.name} কভার ব্যানার`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full relative">
                {/* Decorative Islamic Geometric Pattern & Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-emerald-800 to-teal-900 opacity-95" />
                <div className="absolute inset-0 bg-[radial-gradient(#34d399_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-25" />
                {/* Subtle luminous glow */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/20 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-teal-500/20 blur-xl" />
                {/* Watermark */}
                <div className="absolute bottom-2 right-4 text-emerald-200/20 font-black text-3xl sm:text-4xl tracking-widest pointer-events-none select-none">
                  ২০১২
                </div>
              </div>
            )}

            {/* Subtle gradient vignette at bottom of banner */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Close button with high contrast & smooth hover */}
            <button
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition shadow-md z-30 backdrop-blur-xs border border-white/20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Blood group tag on banner */}
            {member.bloodGroup && (
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/95 text-red-600 shadow-md backdrop-blur-xs border border-red-100 z-30">
                <Droplet className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                <span>রক্তের গ্রুপ: {member.bloodGroup}</span>
              </div>
            )}
          </div>

          {/* Profile Identity Bar: Avatar overlapping banner + Name & Badges */}
          <div className="px-5 sm:px-6 pb-3 pt-1">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5 -mt-14 sm:-mt-16">
              {/* Avatar: perfectly square, rounded-3xl, thick white border, elevated shadow */}
              <div className="relative group shrink-0 z-20">
                {member.avatarUrl ? (
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white aspect-square shrink-0 ring-1 ring-slate-900/10">
                    <img
                      src={member.thumbnailUrl || member.avatarUrl}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 [image-rendering:-webkit-optimize-contrast]"
                    />
                    <a
                      href={member.avatarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity backdrop-blur-xs"
                      title="বড় আকারে ছবি দেখুন"
                    >
                      <ExternalLink className="w-4 h-4" /> পূর্ণ ছবি
                    </a>
                  </div>
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-white font-black text-4xl flex items-center justify-center border-4 border-white shadow-2xl aspect-square shrink-0 ring-1 ring-slate-900/10">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name & Role Badges */}
              <div className="text-center sm:text-left flex-1 min-w-0 pt-1 sm:pt-0 pb-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {member.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1.5">
                  {member.role === "SUPER_ADMIN" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                      <Shield className="w-3 h-3 text-purple-700" /> সুপার অ্যাডমিন
                    </span>
                  ) : member.role === "FUND_MANAGER" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                      <Shield className="w-3 h-3 text-emerald-700" /> তহবিল ব্যবস্থাপক
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      সহপাঠী / ব্যাচমেট
                    </span>
                  )}

                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    দাখিল ২০১২ ব্যাচ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body for Member Details */}
        <div className="overflow-y-auto px-5 sm:px-6 pb-6 pt-2 space-y-4 custom-scrollbar flex-1 border-t border-slate-100">
          {/* Bio Quote if present */}
          {member.bio && (
            <div className="bg-emerald-50/60 border border-emerald-200/70 p-3.5 rounded-2xl relative">
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed text-center sm:text-left">
                "{member.bio}"
              </p>
            </div>
          )}

          {/* Academic & Madrasa Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
              <School className="w-4 h-4 text-emerald-700" />
              <span>মাদ্রাসা ও ব্যাচ তথ্য (খুলনা আলিয়া মাদ্রাসা)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-medium">শিক্ষাবর্ষ / ব্যাচ:</span>
                <span className="font-bold text-slate-900 mt-0.5 block">দাখিল ২০১২</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-medium">বিভাগ (Group):</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {member.studentGroup === "SCIENCE"
                    ? "বিজ্ঞান বিভাগ"
                    : member.studentGroup === "ARTS"
                    ? "মানবিক বিভাগ"
                    : "সাধারণ"}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-medium">ক্লাস রোল:</span>
                <span className="font-bold text-emerald-800 font-mono mt-0.5 block">
                  {member.classRoll ? `#${member.classRoll}` : "উল্লেখ নেই"}
                </span>
              </div>

              {member.classroom && (
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px] font-medium">শাখা / রুম:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{member.classroom}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profession & Workplace */}
          {(member.occupation || member.workplace) && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                <Briefcase className="w-4 h-4 text-emerald-700" />
                <span>বর্তমান পেশা ও কর্মস্থল</span>
              </div>

              <div className="text-xs space-y-1">
                {member.occupation && (
                  <p className="font-bold text-slate-900 text-sm">
                    {member.occupation}
                  </p>
                )}
                {member.workplace && (
                  <p className="text-slate-600 font-medium">
                    প্রতিষ্ঠান / কর্মস্থল: <span className="font-bold text-slate-800">{member.workplace}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Address Details */}
          {(member.presentAddress || member.permanentAddress) && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>ঠিকানা ও অবস্থান</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {member.presentAddress && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">বর্তমান ঠিকানা:</span>
                    <span className="font-semibold text-slate-800">{member.presentAddress}</span>
                  </div>
                )}
                {member.permanentAddress && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">স্থায়ী ঠিকানা:</span>
                    <span className="font-semibold text-slate-800">{member.permanentAddress}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Details & Direct Call / Email buttons */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              যোগাযোগ মাধ্যম
            </h4>

            {/* Phone Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">মোবাইল নম্বর</span>
                  <a
                    href={`tel:${member.phone}`}
                    className="text-xs sm:text-sm font-bold font-mono text-emerald-700 hover:underline"
                  >
                    {member.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(member.phone, "phone")}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center gap-1"
                  title="নম্বর কপি করুন"
                >
                  {copiedPhone ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>কপি</span>
                    </>
                  )}
                </button>

                <a
                  href={`tel:${member.phone}`}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition flex items-center gap-1 shadow-xs"
                >
                  <Phone className="w-3 h-3" /> কল দিন
                </a>
              </div>
            </div>

            {/* Email Row */}
            {member.email && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">ইমেইল ঠিকানা</span>
                    <a
                      href={`mailto:${member.email}`}
                      className="text-xs sm:text-sm font-bold font-mono text-slate-800 hover:text-emerald-700 hover:underline truncate block"
                    >
                      {member.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(member.email || "", "email")}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center gap-1"
                    title="ইমেইল কপি করুন"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">কপি</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>কপি</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`mailto:${member.email}`}
                    className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition flex items-center gap-1 shadow-2xs"
                  >
                    <Mail className="w-3 h-3" /> ইমেইল
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            দাখিল ২০১২ ব্যাচমেট ডিরেক্টরি • খুলনা আলিয়া মাদ্রাসা
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
