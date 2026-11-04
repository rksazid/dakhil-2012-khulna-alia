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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
          >
            {/* Top decorative gradient bar */}
            <div className="h-16 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 relative">
              {/* Blood group tag on top right */}
              {member.bloodGroup && (
                <span className="absolute top-2.5 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/95 text-red-600 shadow-2xs border border-red-100">
                  <Droplet className="w-3 h-3 fill-red-600 text-red-600" />
                  {member.bloodGroup}
                </span>
              )}

              {/* Department pill on top left */}
              {member.studentGroup && (
                <span className="absolute top-2.5 left-3 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                  {member.studentGroup === "SCIENCE"
                    ? "বিজ্ঞান বিভাগ"
                    : member.studentGroup === "ARTS"
                    ? "মানবিক বিভাগ"
                    : "ব্যবসায় শিক্ষা"}
                </span>
              )}
            </div>

            {/* Big Avatar overlapping header */}
            <div className="px-5 -mt-9 flex items-end justify-between">
              <div
                onClick={() => setSelectedMember(member)}
                className="cursor-pointer group/avatar relative"
                title="প্রোফাইল বড় করে দেখুন"
              >
                {member.avatarUrl ? (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-slate-100 group-hover/avatar:scale-105 transition-transform duration-200">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-white font-black text-2xl flex items-center justify-center border-4 border-white shadow-md group-hover/avatar:scale-105 transition-transform duration-200">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Roll & Section */}
              <div className="flex flex-col items-end gap-1 pb-1 text-right">
                {member.classRoll && (
                  <span className="px-2 py-0.5 rounded-md text-[10.5px] bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                    রোল: #{member.classRoll}
                  </span>
                )}
                {member.classroom && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {member.classroom}
                  </span>
                )}
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 pt-3 space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <h4
                  onClick={() => setSelectedMember(member)}
                  className="font-black text-slate-900 text-base cursor-pointer hover:text-emerald-700 transition-colors inline-block"
                  title="সম্পূর্ণ প্রোফাইল মডালে দেখুন"
                >
                  {member.name}
                </h4>

                <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium truncate">
                    {member.occupation || "দাখিল ২০১২ ব্যাচমেট"}
                    {member.workplace && ` (${member.workplace})`}
                  </span>
                </p>

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
                <a
                  href={`tel:${member.phone}`}
                  className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <Phone className="w-3 h-3 text-emerald-700" /> কল দিন
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="flex-1 py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Eye className="w-3 h-3" /> প্রোফাইল
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Member Full Detail Modal */}
      <MemberDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
}
