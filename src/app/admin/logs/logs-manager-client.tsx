"use client";

import { useState, useMemo } from "react";
import { formatBengaliDate, toBengaliNumber, formatCurrency } from "@/lib/utils";
import {
  History,
  Shield,
  Clock,
  User,
  Search,
  Filter,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  FileText,
  Landmark,
  Receipt,
  CreditCard,
  UserCheck,
  UserPlus,
  Code2,
  Copy,
  Check,
  Printer,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export interface LogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  fundId: string | null;
  performedByUserId: string | null;
  details: string | null;
  timestamp: Date;
  performedBy: { name: string; phone: string | null } | null;
  fund: { title: string } | null;
}

const ACTION_MAP: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CREATE_FUND: {
    label: "নতুন তহবিল তৈরি",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Landmark,
  },
  EDIT_FUND: {
    label: "তহবিল তথ্য সম্পাদন",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: Landmark,
  },
  ASSIGN_MANAGER: {
    label: "ম্যানেজার নিয়োগ",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    icon: UserCheck,
  },
  REMOVE_MANAGER: {
    label: "ম্যানেজার অপসারণ",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: UserCheck,
  },
  RECORD_EXPENSE: {
    label: "ব্যয় ও অনুদান অনুমোদন",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: Receipt,
  },
  RECORD_PAYMENT: {
    label: "নতুন চাঁদা জমাদান",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: CreditCard,
  },
  VERIFY_PAYMENT: {
    label: "চাঁদা ভেরিফিকেশন",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  REJECT_PAYMENT: {
    label: "চাঁদা বাতিল",
    badgeClass: "bg-red-50 text-red-800 border-red-200",
    icon: XCircle,
  },
  CREATE_USER: {
    label: "নতুন সদস্য যোগ",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: UserPlus,
  },
  UPDATE_USER_DETAILS: {
    label: "সদস্য তথ্য আপডেট",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: User,
  },
  UPDATE_USER_ROLE: {
    label: "পদবি / রোল পরিবর্তন",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    icon: Shield,
  },
  TOGGLE_USER_ACTIVE: {
    label: "অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Shield,
  },
  CREATE_NOTICE: {
    label: "নোটিশ প্রকাশ",
    badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
    icon: FileText,
  },
  EDIT_NOTICE: {
    label: "নোটিশ সম্পাদনা",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: FileText,
  },
  DELETE_NOTICE: {
    label: "নোটিশ মুছে ফেলা",
    badgeClass: "bg-red-50 text-red-800 border-red-200",
    icon: XCircle,
  },
  UPDATE_HOMEPAGE_SETTINGS: {
    label: "হোমপেজ সেটিংস",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    icon: History,
  },
};

const FIELD_TRANSLATIONS: Record<string, string> = {
  title: "তহবিলের নাম",
  targetAmount: "লক্ষ্যমাত্রা",
  amount: "পরিমাণ",
  purpose: "খাত / উদ্দেশ্য",
  managerName: "ম্যানেজার",
  memberName: "সদস্যের নাম",
  contributorName: "চাঁদা প্রদানকারী",
  monthYear: "মাস",
  role: "ভূমিকা / পদবি",
  oldRole: "পূর্বের পদবি",
  newRole: "নতুন পদবি",
  status: "অনুমোদন স্ট্যাটাস",
  oldStatus: "পূর্বের স্ট্যাটাস",
  newStatus: "নতুন স্ট্যাটাস",
  isActive: "অ্যাকাউন্ট সক্রিয়তা",
  bloodGroup: "রক্তের গ্রুপ",
  studentGroup: "বিভাগ",
  classRoll: "ক্লাস রোল",
  classroom: "শাখা / ক্লাসরুম",
  occupation: "পেশা",
  workplace: "কর্মস্থল",
  presentAddress: "বর্তমান ঠিকানা",
  paymentMethod: "পেমেন্ট মাধ্যম",
  transactionId: "ট্রানজেকশন আইডি",
  contactPerson: "যোগাযোগের ব্যক্তি",
  contactPhone: "যোগাযোগ নম্বর",
  rules: "শর্ত ও নিয়মাবলী",
  description: "বিবরণ",
  note: "মন্তব্য",
};

function formatValue(key: string, val: unknown): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "সক্রিয় (Active)" : "স্থগিত (Inactive)";
  
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("amount") || lowerKey === "amount") {
    const num = Number(val);
    if (!isNaN(num)) return formatCurrency(num);
  }

  if (val === "SUPER_ADMIN") return "সুপার অ্যাডমিন";
  if (val === "FUND_MANAGER") return "তহবিল ব্যবস্থাপক";
  if (val === "MEMBER") return "সাধারণ ব্যাচমেট";
  if (val === "VERIFIED") return "অনুমোদিত (VERIFIED)";
  if (val === "PENDING") return "অপেক্ষমান (PENDING)";
  if (val === "REJECTED") return "বাতিল (REJECTED)";
  if (val === "SCIENCE") return "বিজ্ঞান বিভাগ";
  if (val === "ARTS") return "মানবিক বিভাগ";
  if (val === "COMMERCE") return "ব্যবসায় শিক্ষা";

  if (typeof val === "object") {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }

  return String(val);
}

interface ParsedDetails {
  summary: string | null;
  diffs: Array<{ field: string; label: string; before: string; after: string }>;
  metadata: Array<{ field: string; label: string; value: string }>;
  rawJson: Record<string, unknown> | null;
}

function parseLogDetails(detailsStr: string | null): ParsedDetails {
  if (!detailsStr) {
    return { summary: null, diffs: [], metadata: [], rawJson: null };
  }

  let obj: Record<string, unknown> | null = null;
  try {
    obj = JSON.parse(detailsStr);
  } catch {
    return { summary: detailsStr, diffs: [], metadata: [], rawJson: null };
  }

  if (!obj || typeof obj !== "object") {
    return { summary: detailsStr, diffs: [], metadata: [], rawJson: null };
  }

  const summary = typeof obj.summary === "string" ? obj.summary : null;
  const diffs: Array<{ field: string; label: string; before: string; after: string }> = [];
  const metadata: Array<{ field: string; label: string; value: string }> = [];

  // 1. Check explicit before & after objects
  if (obj.before && typeof obj.before === "object" && obj.after && typeof obj.after === "object") {
    const beforeObj = obj.before as Record<string, unknown>;
    const afterObj = obj.after as Record<string, unknown>;
    const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));

    for (const key of allKeys) {
      const bVal = beforeObj[key];
      const aVal = afterObj[key];
      if (bVal !== aVal) {
        diffs.push({
          field: key,
          label: FIELD_TRANSLATIONS[key] || key,
          before: formatValue(key, bVal),
          after: formatValue(key, aVal),
        });
      }
    }
  }

  // 2. Check oldStatus vs newStatus
  if (obj.oldStatus !== undefined && obj.newStatus !== undefined && obj.oldStatus !== obj.newStatus) {
    const alreadyPresent = diffs.some((d) => d.field === "status" || d.field === "oldStatus");
    if (!alreadyPresent) {
      diffs.push({
        field: "status",
        label: "অনুমোদন স্ট্যাটাস",
        before: formatValue("status", obj.oldStatus),
        after: formatValue("status", obj.newStatus),
      });
    }
  }

  // 3. Check oldRole vs newRole
  if (obj.oldRole !== undefined && obj.newRole !== undefined && obj.oldRole !== obj.newRole) {
    const alreadyPresent = diffs.some((d) => d.field === "role" || d.field === "oldRole");
    if (!alreadyPresent) {
      diffs.push({
        field: "role",
        label: "ভূমিকা / পদবি",
        before: formatValue("role", obj.oldRole),
        after: formatValue("role", obj.newRole),
      });
    }
  }

  // 4. Collect other informative metadata
  const skippedKeys = new Set([
    "summary",
    "before",
    "after",
    "oldStatus",
    "newStatus",
    "oldRole",
    "newRole",
  ]);

  for (const [key, val] of Object.entries(obj)) {
    if (skippedKeys.has(key)) continue;
    if (val === null || val === undefined || val === "") continue;
    metadata.push({
      field: key,
      label: FIELD_TRANSLATIONS[key] || key,
      value: formatValue(key, val),
    });
  }

  return {
    summary,
    diffs,
    metadata,
    rawJson: obj,
  };
}

export function LogsManagerClient({ logs }: { logs: LogItem[] }) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [selectedRawPayload, setSelectedRawPayload] = useState<{
    id: string;
    action: string;
    timestamp: Date;
    performedBy: string;
    json: Record<string, unknown> | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Distinct Actions list for dropdown
  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action))).sort();
  }, [logs]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const financial = logs.filter(
      (l) => l.entityType === "EXPENSE" || l.entityType === "PAYMENT"
    ).length;
    const fundsAndPolicies = logs.filter(
      (l) => l.entityType === "FUND" || l.entityType === "SETTINGS"
    ).length;
    const membersAndRbac = logs.filter((l) => l.entityType === "USER").length;
    return { total, financial, fundsAndPolicies, membersAndRbac };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const actionName = ACTION_MAP[log.action]?.label || log.action;
      const performerName = log.performedBy?.name || "সিস্টেম";
      const performerPhone = log.performedBy?.phone || "";
      const fundName = log.fund?.title || "";
      const rawDetails = log.details || "";

      const matchesSearch =
        !query ||
        actionName.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        performerName.toLowerCase().includes(query) ||
        performerPhone.includes(query) ||
        fundName.toLowerCase().includes(query) ||
        rawDetails.toLowerCase().includes(query);

      const matchesEntity = entityFilter === "ALL" || log.entityType === entityFilter;
      const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

      return matchesSearch && matchesEntity && matchesAction;
    });
  }, [logs, search, entityFilter, actionFilter]);

  const handleCopyJson = () => {
    if (!selectedRawPayload?.json) return;
    navigator.clipboard.writeText(JSON.stringify(selectedRawPayload.json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <History className="w-3.5 h-3.5 text-emerald-700" />
            <span>সিস্টেম অডিট ও নিরীক্ষা ট্রেইল</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            পূর্ণাঙ্গ অডিট ট্রেইল ও কার্যক্রম লগ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            কে, কখন, কী তথ্য পরিবর্তন করেছেন তার ডিজিটাল ক্রমানুক্রমিক অডিট রেকর্ড
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>প্রিন্ট / রিপোর্ট</span>
          </button>
          <div className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
            সর্বমোট: {toBengaliNumber(stats.total)}টি কার্যক্রম
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">মোট সংরক্ষিত রেকর্ড</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {toBengaliNumber(stats.total)} টি
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">আর্থিক লেনদেন ও ব্যয়</p>
            <p className="text-lg font-black text-blue-900 mt-0.5">
              {toBengaliNumber(stats.financial)} টি
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">সদস্য ও পারমিশন লগ</p>
            <p className="text-lg font-black text-purple-900 mt-0.5">
              {toBengaliNumber(stats.membersAndRbac)} টি
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">তহবিল ও সেটিংস নীতি</p>
            <p className="text-lg font-black text-amber-900 mt-0.5">
              {toBengaliNumber(stats.fundsAndPolicies)} টি
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম, ফোন নম্বর, তহবিলের নাম, অ্যাকশন বা বিবরণ দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
            >
              <option value="ALL">সকল অ্যাকশন টাইপ</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {ACTION_MAP[act]?.label || act}
                </option>
              ))}
            </select>

            {(search || entityFilter !== "ALL" || actionFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setEntityFilter("ALL");
                  setActionFilter("ALL");
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
              >
                রিসেট
              </button>
            )}
          </div>
        </div>

        {/* Entity Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> ফিল্টার খাত:
          </span>
          {[
            { key: "ALL", label: "সকল রেকর্ড" },
            { key: "FUND", label: "🏛️ তহবিল (Fund)" },
            { key: "PAYMENT", label: "💳 চাঁদা (Payment)" },
            { key: "EXPENSE", label: "💸 ব্যয় (Expense)" },
            { key: "USER", label: "👤 সদস্য ও রোল (User)" },
            { key: "NOTICE", label: "📢 নোটিশ (Notice)" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setEntityFilter(item.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                entityFilter === item.key
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] font-semibold text-slate-400">
            প্রদর্শিত: {toBengaliNumber(filteredLogs.length)} টি
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-44">অ্যাকশন ও টাইপ</th>
                <th className="py-3 px-3 w-48">সম্পাদনকারী ব্যক্তি</th>
                <th className="py-3 px-3 w-40">সংশ্লিষ্ট তহবিল</th>
                <th className="py-3 px-4">পরিবর্তনের বিবরণ ও তুলনামূলক হিসাব (Diff)</th>
                <th className="py-3 px-4 text-right w-36">টাইমস্ট্যাম্প</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">কোনো অডিট রেকর্ড পাওয়া যায়নি।</p>
                    <p className="text-xs text-slate-400 mt-1">
                      অনুসন্ধান শব্দ পরিবর্তন করুন অথবা ফিল্টার রিসেট করুন।
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionMeta = ACTION_MAP[log.action] || {
                    label: log.action,
                    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
                    icon: History,
                  };
                  const ActionIcon = actionMeta.icon;
                  const parsed = parseLogDetails(log.details);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Action & Entity Type */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${actionMeta.badgeClass}`}
                          >
                            <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{actionMeta.label}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {log.entityType}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              {log.action}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Performed By */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                            {log.performedBy?.name ? log.performedBy.name.charAt(0) : "সি"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">
                              {log.performedBy?.name || "সিস্টেম স্বয়ংক্রিয়"}
                            </p>
                            {log.performedBy?.phone && (
                              <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                                {log.performedBy.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Related Fund */}
                      <td className="py-3.5 px-3 align-top">
                        {log.fund ? (
                          <span className="inline-flex items-center gap-1 text-slate-800 font-semibold bg-emerald-50/60 text-emerald-900 border border-emerald-100 px-2.5 py-1 rounded-lg text-[11px]">
                            <Landmark className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span className="line-clamp-2">{log.fund.title}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            সার্বজনীন / সিস্টেম
                          </span>
                        )}
                      </td>

                      {/* 4. Details / Diff / Summary */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-2 max-w-xl">
                          {/* Human readable headline */}
                          {parsed.summary && (
                            <p className="font-bold text-slate-900 text-xs sm:text-[12.5px] leading-relaxed flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                              <span>{parsed.summary}</span>
                            </p>
                          )}

                          {/* Visual Diff Box: Before vs After */}
                          {parsed.diffs.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 pb-1 border-b border-slate-200">
                                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                                <span>ফিল্ডভিত্তিক পরিবর্তনের তুলনামূলক নিরীক্ষা (Before vs After)</span>
                              </div>
                              <div className="space-y-1.5 pt-0.5">
                                {parsed.diffs.map((diff, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-2 text-xs"
                                  >
                                    <span className="font-bold text-slate-700 min-w-[100px] text-[11px]">
                                      {diff.label}:
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 line-through text-[11px] font-mono flex items-center gap-1">
                                        <span className="text-[9.5px] text-rose-500 font-sans no-underline font-semibold">
                                          পূর্বে:
                                        </span>
                                        {diff.before}
                                      </span>
                                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] font-mono flex items-center gap-1">
                                        <span className="text-[9.5px] text-emerald-600 font-sans font-semibold">
                                          বর্তমানে:
                                        </span>
                                        {diff.after}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata Attributes Pills */}
                          {parsed.metadata.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {parsed.metadata.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 text-[11px]"
                                >
                                  <span className="text-slate-500 font-medium">
                                    {item.label}:
                                  </span>
                                  <span className="font-bold text-slate-900">{item.value}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Fallback if no summary, diffs or metadata */}
                          {!parsed.summary &&
                            parsed.diffs.length === 0 &&
                            parsed.metadata.length === 0 && (
                              <p className="text-slate-500 italic text-xs">
                                {log.details || "কোনো অতিরিক্ত তথ্য সংরক্ষিত নেই"}
                              </p>
                            )}

                          {/* Inspect Raw Payload Trigger */}
                          {parsed.rawJson && (
                            <div className="pt-1 flex items-center justify-between text-[10.5px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedRawPayload({
                                    id: log.id,
                                    action: log.action,
                                    timestamp: log.timestamp,
                                    performedBy: log.performedBy?.name || "সিস্টেম",
                                    json: parsed.rawJson,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-700 font-mono font-medium hover:underline transition"
                              >
                                <Code2 className="w-3 h-3 text-emerald-600" />
                                <span>কাঁচা ডাটা (JSON Payload) দেখুন</span>
                              </button>

                              <span className="text-slate-400 font-mono">
                                আইডি: #{log.id.slice(-6)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Timestamp */}
                      <td className="py-3.5 px-4 text-right align-top whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 text-[11px]">
                            {formatBengaliDate(log.timestamp)}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString("bn-BD", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw JSON Payload Modal */}
      {selectedRawPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    অডিট ট্রেইল কাঁচা ডাটা (Audit Payload)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedRawPayload.action} • {selectedRawPayload.performedBy}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRawPayload(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>লগ আইডি: #{selectedRawPayload.id}</span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>JSON কপি করুন</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="text-xs bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono overflow-x-auto max-h-72 custom-scrollbar border border-slate-800 leading-relaxed">
                {JSON.stringify(selectedRawPayload.json, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRawPayload(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
