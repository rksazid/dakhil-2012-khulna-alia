"use client";

import { useState } from "react";
import {
  Briefcase,
  Mail,
  Phone,
  Droplet,
  Eye,
  ArrowRight,
  School,
  CheckCircle2,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { MemberDetailModal, MemberDetailData } from "@/components/members/member-detail-modal";

export function HomepageMembersClient({
  members,
}: {
  members: MemberDetailData[];
}) {
  const [selectedMember, setSelectedMember] = useState<MemberDetailData | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          const isOffline = member.isClaimed === false || member.phone.startsWith("offline_");
          const hasRealPhone = !member.phone.startsWith("offline_");

          return (
            <div
              key={member.id}
              className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-emerald-400/80 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* Top decorative gradient bar */}
              <div className="h-20 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none" />

                {/* Role & Category tags on top left */}
                <div className="absolute top-2.5 left-3 flex items-center gap-1.5 flex-wrap">
                  {member.role === "SUPER_ADMIN" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/85 text-amber-300 border border-amber-400/40 shadow-xs backdrop-blur-md">
                      সুপার অ্যাডমিন
                    </span>
                  ) : member.role === "FUND_MANAGER" ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                      ফান্ড ম্যানেজার
                    </span>
                  ) : null}

                  {member.userType === "TEACHER" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs border border-amber-300">
                      সম্মানিত শিক্ষক
                    </span>
                  ) : member.userType === "WELL_WISHER" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400 text-slate-950 shadow-xs border border-teal-300">
                      শুভাকাঙ্ক্ষী
                    </span>
                  ) : member.role !== "SUPER_ADMIN" && member.role !== "FUND_MANAGER" ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs border border-white/20">
                      দাখিল ২০১২
                    </span>
                  ) : null}
                </div>

                {/* Blood group tag on top right */}
                {member.bloodGroup && (
                  <span className="absolute top-2.5 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/95 text-red-600 shadow-2xs border border-red-100">
                    <Droplet className="w-3 h-3 fill-red-600 text-red-600" />
                    {member.bloodGroup}
                  </span>
                )}
              </div>

              {/* Avatar overlapping header */}
              <div className="px-5 -mt-10 flex items-end justify-between">
                <div
                  onClick={() => setSelectedMember(member)}
                  className="cursor-pointer group/avatar relative"
                  title="প্রোফাইল বড় করে দেখুন"
                >
                  {member.thumbnailUrl || member.avatarUrl ? (
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-slate-100 transition-transform duration-300 group-hover/avatar:scale-105 relative">
                      <img
                        src={member.thumbnailUrl || member.avatarUrl!}
                        alt={member.name}
                        className="w-full h-full object-cover [image-rendering:-webkit-optimize-contrast] transition-transform duration-300 group-hover/avatar:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-white font-black text-2xl flex items-center justify-center border-4 border-white shadow-md transition-transform duration-300 group-hover/avatar:scale-105 relative">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  {member.isClaimed && (
                    <span
                      className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-600 text-white rounded-full border-2 border-white shadow-xs"
                      title="যাচাইকৃত নিবন্ধিত সদস্য"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Roll, Section, Offline badge */}
                <div className="flex flex-col items-end gap-1 pb-1 text-right">
                  {isOffline && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                      অফলাইন সদস্য
                    </span>
                  )}
                  {member.classRoll && (
                    <span className="px-2 py-0.5 rounded-lg text-[10.5px] bg-slate-100/90 text-slate-700 font-mono font-bold border border-slate-200 shadow-2xs">
                      রোল: #{member.classRoll}
                    </span>
                  )}
                  {member.studentGroup && (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        member.studentGroup === "SCIENCE"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {member.studentGroup === "SCIENCE" ? "বিজ্ঞান" : "মানবিক"}
                    </span>
                  )}
                  {member.classroom && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      ({member.classroom})
                    </span>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 pt-3 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h4
                    onClick={() => setSelectedMember(member)}
                    className="font-black text-slate-900 text-base cursor-pointer hover:text-emerald-700 transition-colors inline-block leading-tight"
                    title="সম্পূর্ণ প্রোফাইল মডালে দেখুন"
                  >
                    {member.name}
                  </h4>

                  <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 truncate">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium truncate">
                      {member.occupation || "দাখিল ২০১২ ব্যাচমেট"}
                      {member.workplace && ` (${member.workplace})`}
                    </span>
                  </p>

                  {member.presentAddress && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{member.presentAddress}</span>
                    </p>
                  )}

                  {member.email && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono truncate">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a
                        href={`mailto:${member.email}`}
                        className="hover:underline hover:text-emerald-700 truncate"
                      >
                        {member.email}
                      </a>
                    </p>
                  )}
                </div>

                {/* Quick action footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {hasRealPhone ? (
                    <>
                      <a
                        href={`tel:${member.phone}`}
                        className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border border-emerald-200/70"
                      >
                        <Phone className="w-3 h-3 text-emerald-700" /> কল দিন
                      </a>

                      <button
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className="flex-1 py-1.5 px-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3 h-3" /> প্রোফাইল
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="w-full py-1.5 px-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Eye className="w-3 h-3" /> বিস্তারিত প্রোফাইল দেখুন
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Full Detail Modal */}
      <MemberDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
}

