"use client";

import { useState, useTransition } from "react";
import { toBengaliNumber, formatBengaliDate } from "@/lib/utils";
import { Role } from "@prisma/client";
import { updateMemberRoleAction, toggleMemberActiveAction } from "@/actions/member-actions";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Droplet,
  Briefcase,
} from "lucide-react";

interface MemberData {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  isActive: boolean;
  bloodGroup: string | null;
  occupation: string | null;
  workplace: string | null;
  createdAt: Date;
  managedFunds: { fund: { title: string } }[];
  _count: { commitments: number; contributions: number };
}

export function MembersManagerClient({
  members,
  currentUserId,
}: {
  members: MemberData[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filtered = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase())) ||
      (m.occupation && m.occupation.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = filterRole === "ALL" || m.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: Role) => {
    startTransition(async () => {
      const res = await updateMemberRoleAction(userId, newRole);
      if (res.success) {
        setFeedback({ type: "success", message: "সদস্যের ভূমিকা (Role) সফলভাবে পরিবর্তন করা হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "ভূমিকা পরিবর্তন ব্যর্থ।" });
      }
    });
  };

  const handleToggleActive = (userId: string, currentActive: boolean) => {
    if (!confirm(`আপনি কি এই অ্যাকাউন্টটি ${currentActive ? "স্থগিত" : "সক্রিয়"} করতে চান?`)) return;
    startTransition(async () => {
      const res = await toggleMemberActiveAction(userId, !currentActive);
      if (res.success) {
        setFeedback({ type: "success", message: "সদস্য স্ট্যাটাস পরিবর্তিত হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "ব্যর্থ হয়েছে।" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-red-50 text-red-900 border-red-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            সদস্য ডিরেক্টরি ও ভূমিকা নির্ধারণ (RBAC)
          </h1>
          <p className="text-xs text-slate-500">
            সুপার অ্যাডমিন কর্তৃক সদস্যের এক্সেস পারমিশন, রোল এবং অ্যাকাউন্ট নিয়ন্ত্রণ
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          মোট নিবন্ধিত সদস্য: {toBengaliNumber(members.length)} জন
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম, মোবাইল, ইমেইল অথবা পেশা দিয়ে সদস্য খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
        >
          <option value="ALL">সকল রোল / ভূমিকা</option>
          <option value="SUPER_ADMIN">সুপার অ্যাডমিন</option>
          <option value="FUND_MANAGER">তহবিল ব্যবস্থাপক</option>
          <option value="MEMBER">সাধারণ ব্যাচমেট</option>
        </select>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">সদস্যের নাম ও রক্ত</th>
                <th className="py-3 px-3">যোগাযোগ (মোবাইল ও ইমেইল)</th>
                <th className="py-3 px-3">পেশা ও কর্মস্থল</th>
                <th className="py-3 px-3">অ্যাক্টিভিটি</th>
                <th className="py-3 px-3">ভূমিকা / রোল পরিবর্তন</th>
                <th className="py-3 px-4 text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{m.name}</p>
                        {m.bloodGroup && (
                          <span className="text-[10px] text-red-600 font-bold inline-flex items-center gap-0.5">
                            <Droplet className="w-2.5 h-2.5 fill-red-600" /> {m.bloodGroup}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <p className="font-mono text-slate-800">{m.phone}</p>
                    {m.email && <p className="font-mono text-slate-400 text-[11px]">{m.email}</p>}
                  </td>

                  <td className="py-3 px-3 text-slate-700">
                    <p className="font-medium">{m.occupation || "—"}</p>
                    {m.workplace && <p className="text-[11px] text-slate-400">{m.workplace}</p>}
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    <p>{toBengaliNumber(m._count.contributions)}টি চাঁদা এন্ট্রি</p>
                    {m.managedFunds.length > 0 && (
                      <span className="text-[10px] text-emerald-700 block">
                        ম্যানেজার: {m.managedFunds.map((mf) => mf.fund.title).join(", ")}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <select
                      value={m.role}
                      disabled={isPending || m.id === currentUserId}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded-md font-semibold bg-white disabled:opacity-50"
                    >
                      <option value="MEMBER">MEMBER (সাধারণ সদস্য)</option>
                      <option value="FUND_MANAGER">FUND_MANAGER (তহবিল ব্যবস্থাপক)</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN (সুপার অ্যাডমিন)</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(m.id, m.isActive)}
                      disabled={isPending || m.id === currentUserId}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition disabled:opacity-50 ${
                        m.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-amber-100 hover:text-amber-900"
                          : "bg-red-100 text-red-800 hover:bg-emerald-100 hover:text-emerald-900"
                      }`}
                    >
                      {m.isActive ? "সক্রিয়" : "স্থগিত"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
