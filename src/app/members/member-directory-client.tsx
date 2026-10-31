"use client";

import { useState } from "react";
import { toBengaliNumber } from "@/lib/utils";
import {
  Search,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Droplet,
  ShieldAlert,
  Shield,
  Sparkles,
  GraduationCap,
  Hash,
  School,
} from "lucide-react";

export interface MemberItem {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  avatarUrl: string | null;
  bio: string | null;
  bloodGroup: string | null;
  studentGroup?: string | null;
  classRoll?: string | null;
  classroom?: string | null;
  occupation: string | null;
  workplace: string | null;
  presentAddress: string | null;
  role: string;
  showPhoneInDirectory: boolean;
  showEmailInDirectory: boolean;
}

export function MemberDirectoryClient({ members }: { members: MemberItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedBlood, setSelectedBlood] = useState<string>("ALL");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");

  const bloodGroups = ["ALL", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const filtered = members.filter((m) => {
    const query = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(query) ||
      (m.email && m.email.toLowerCase().includes(query)) ||
      m.phone.includes(query) ||
      (m.occupation && m.occupation.toLowerCase().includes(query)) ||
      (m.presentAddress && m.presentAddress.toLowerCase().includes(query)) ||
      (m.classRoll && m.classRoll.toLowerCase().includes(query)) ||
      (m.studentGroup && m.studentGroup.toLowerCase().includes(query)) ||
      (m.classroom && m.classroom.toLowerCase().includes(query));

    const matchesBlood =
      selectedBlood === "ALL" || (m.bloodGroup && m.bloodGroup.toUpperCase() === selectedBlood);

    const matchesSection =
      selectedSection === "ALL" || (m.studentGroup && m.studentGroup.toUpperCase() === selectedSection);

    return matchesSearch && matchesBlood && matchesSection;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম, রোল, ইমেইল, মোবাইল, পেশা বা অবস্থান দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl text-center">
            পাওয়া গেছে: {toBengaliNumber(filtered.length)} জন সদস্য
          </div>
        </div>

        {/* Section filter tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> বিভাগ / শাখা:
          </span>
          {[
            { key: "ALL", label: "সকল বিভাগ" },
            { key: "SCIENCE", label: "বিজ্ঞান (Science)" },
            { key: "ARTS", label: "মানবিক (Arts)" },
            { key: "COMMERCE", label: "ব্যবসায় শিক্ষা" },
          ].map((sec) => (
            <button
              key={sec.key}
              onClick={() => setSelectedSection(sec.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedSection === sec.key
                  ? "bg-blue-600 text-white font-bold shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Blood group filter tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-2xs">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {member.role === "SUPER_ADMIN" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                            সুপার অ্যাডমিন
                          </span>
                        ) : member.role === "FUND_MANAGER" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ফান্ড ম্যানেজার
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            ব্যাচমেট
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {member.bloodGroup && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 shrink-0">
                      <Droplet className="w-3 h-3 fill-red-600 text-red-600" />
                      {member.bloodGroup}
                    </span>
                  )}
                </div>

                {/* মাদ্রাসার শিক্ষাবর্ষ তথ্য (বিজ্ঞান/মানবিক, ক্লাস রোল, শাখা) */}
                {(member.studentGroup || member.classRoll || member.classroom) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    {member.studentGroup && (
                      <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                        member.studentGroup === "SCIENCE"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : member.studentGroup === "ARTS"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}>
                        {member.studentGroup === "SCIENCE" ? "বিজ্ঞান বিভাগ" : member.studentGroup === "ARTS" ? "মানবিক বিভাগ" : "ব্যবসায় শিক্ষা"}
                      </span>
                    )}
                    {member.classRoll && (
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                        রোল: {member.classRoll}
                      </span>
                    )}
                    {member.classroom && (
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        ({member.classroom})
                      </span>
                    )}
                  </div>
                )}

                {member.bio && (
                  <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{member.bio}"
                  </p>
                )}

                <div className="space-y-2 pt-2 text-xs text-slate-600">
                  {/* Email (Explicit requirement) */}
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-mono text-slate-800 truncate">
                      {member.email || "ইমেইল প্রদান করা হয়নি"}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <a
                      href={`tel:${member.phone}`}
                      className="font-mono text-emerald-700 hover:underline"
                    >
                      {member.phone}
                    </a>
                  </div>

                  {/* Occupation */}
                  {member.occupation && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {member.occupation} {member.workplace ? `(${member.workplace})` : ""}
                      </span>
                    </div>
                  )}

                  {/* Location */}
                  {member.presentAddress && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{member.presentAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`tel:${member.phone}`}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> কল করুন
                </a>
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> ইমেইল পাঠান
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
