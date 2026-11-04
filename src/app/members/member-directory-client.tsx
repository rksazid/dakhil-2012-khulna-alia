"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Droplet,
  GraduationCap,
  Hash,
  School,
  ExternalLink,
  Eye,
} from "lucide-react";
import { MemberDetailModal, MemberDetailData } from "@/components/members/member-detail-modal";

export type MemberItem = MemberDetailData;

export function MemberDirectoryClient({ members }: { members: MemberItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedBlood, setSelectedBlood] = useState<string>("ALL");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);

  const bloodGroups = ["ALL", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const filtered = members.filter((m) => {
    const query = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(query) ||
      (m.email && m.email.toLowerCase().includes(query)) ||
      m.phone.includes(query) ||
      (m.occupation && m.occupation.toLowerCase().includes(query)) ||
      (m.workplace && m.workplace.toLowerCase().includes(query)) ||
      (m.presentAddress && m.presentAddress.toLowerCase().includes(query)) ||
      (m.permanentAddress && m.permanentAddress.toLowerCase().includes(query)) ||
      (m.classRoll && m.classRoll.includes(query)) ||
      (m.classroom && m.classroom.toLowerCase().includes(query));

    const matchesBlood = selectedBlood === "ALL" || m.bloodGroup === selectedBlood;
    const matchesSection =
      selectedSection === "ALL" ||
      (selectedSection === "SCIENCE" && m.studentGroup === "SCIENCE") ||
      (selectedSection === "ARTS" && m.studentGroup === "ARTS") ||
      (selectedSection === "COMMERCE" && m.studentGroup === "COMMERCE");

    return matchesSearch && matchesBlood && matchesSection;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম, মোবাইল, ইমেইল, রোল, বিভাগ, পেশা বা ঠিকানা দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Academic Section Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { key: "ALL", label: "সকল বিভাগ" },
              { key: "SCIENCE", label: "বিজ্ঞান" },
              { key: "ARTS", label: "মানবিক" },
              { key: "COMMERCE", label: "ব্যবসায় শিক্ষা" },
            ].map((sec) => (
              <button
                key={sec.key}
                onClick={() => setSelectedSection(sec.key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedSection === sec.key
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Blood Group Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Droplet className="w-3.5 h-3.5 text-red-500" /> রক্তের গ্রুপ:
          </span>
          {bloodGroups.map((bg) => (
            <button
              key={bg}
              onClick={() => setSelectedBlood(bg)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedBlood === bg
                  ? "bg-red-600 text-white font-bold shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {bg === "ALL" ? "সকল গ্রুপ" : bg}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
          <p className="text-sm font-semibold text-slate-700">কোনো সদস্য পাওয়া যায়নি।</p>
          <p className="text-xs text-slate-500">অন্য শব্দ দিয়ে খুঁজুন অথবা ফিল্টার রিসেট করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
            >
              {/* Card Header with decorative banner & prominent large portrait */}
              <div className="relative">
                {/* Decorative soft banner */}
                <div className="h-20 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 relative">
                  {/* Blood group tag on top right */}
                  {member.bloodGroup && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-black bg-white/95 text-red-600 shadow-2xs backdrop-blur-xs border border-red-100">
                      <Droplet className="w-3 h-3 fill-red-600 text-red-600" />
                      {member.bloodGroup}
                    </span>
                  )}

                  {/* Role tag on top left */}
                  <div className="absolute top-3 left-3">
                    {member.role === "SUPER_ADMIN" ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.8 rounded-full bg-purple-900/90 text-purple-200 border border-purple-400/40 shadow-2xs">
                        সুপার অ্যাডমিন
                      </span>
                    ) : member.role === "FUND_MANAGER" ? (
                      <span className="text-[10px] font-black px-2.5 py-0.8 rounded-full bg-amber-400 text-slate-950 shadow-2xs">
                        ফান্ড ম্যানেজার
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                        দাখিল ২০১২
                      </span>
                    )}
                  </div>
                </div>

                {/* Big Photo Container (overlapping banner) */}
                <div className="px-5 -mt-11 flex items-end justify-between">
                  <div
                    onClick={() => setSelectedMember(member)}
                    className="relative cursor-pointer group/avatar"
                    title="প্রোফাইল বড় করে দেখুন"
                  >
                    {member.avatarUrl ? (
                      <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-slate-100 transition-transform duration-200 group-hover/avatar:scale-105">
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-md transition-transform duration-200 group-hover/avatar:scale-105">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Group & Roll pills next to photo */}
                  <div className="flex flex-col items-end gap-1 pb-1">
                    {member.studentGroup && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                          member.studentGroup === "SCIENCE"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : member.studentGroup === "ARTS"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {member.studentGroup === "SCIENCE"
                          ? "বিজ্ঞান"
                          : member.studentGroup === "ARTS"
                          ? "মানবিক"
                          : "ব্যবসায় শিক্ষা"}
                      </span>
                    )}
                    {member.classRoll && (
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                        রোল: #{member.classRoll}
                      </span>
                    )}
                    {member.classroom && (
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        ({member.classroom})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  {/* Clickable Name */}
                  <div>
                    <h3
                      onClick={() => setSelectedMember(member)}
                      className="font-black text-slate-900 text-base sm:text-lg cursor-pointer hover:text-emerald-700 transition-colors inline-block"
                      title="সম্পূর্ণ প্রোফাইল মডালে দেখুন"
                    >
                      {member.name}
                    </h3>

                    {member.occupation && (
                      <p className="text-xs font-semibold text-emerald-800 mt-0.5 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{member.occupation}</span>
                        {member.workplace && (
                          <span className="text-slate-400 font-normal truncate">
                            ({member.workplace})
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Bio quote if present */}
                  {member.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{member.bio}"
                    </p>
                  )}

                  {/* Contact details */}
                  <div className="space-y-1.5 pt-1 text-xs text-slate-600 border-t border-slate-100">
                    {/* Email */}
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {member.email ? (
                        <a
                          href={`mailto:${member.email}`}
                          className="font-mono text-slate-700 hover:text-emerald-700 truncate hover:underline"
                          title={member.email}
                        >
                          {member.email}
                        </a>
                      ) : (
                        <span className="font-mono text-slate-400 italic">
                          ইমেইল যুক্ত করা হয়নি
                        </span>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a
                        href={`tel:${member.phone}`}
                        className="font-mono text-emerald-700 font-medium hover:underline"
                      >
                        {member.phone}
                      </a>
                    </div>

                    {/* Address */}
                    {member.presentAddress && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{member.presentAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${member.phone}`}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-700" /> কল দিন
                  </a>

                  <button
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className="flex-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> বিস্তারিত
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Profile Detail Modal */}
      <MemberDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}
