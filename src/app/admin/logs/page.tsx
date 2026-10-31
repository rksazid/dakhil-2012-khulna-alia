import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { formatBengaliDate, toBengaliNumber } from "@/lib/utils";
import { History, Shield, Clock, User, Filter, AlertCircle } from "lucide-react";


export default async function AdminLogsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.SUPER_ADMIN) {
    redirect("/admin");
  }

  const logs = await prisma.activityLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 50,
    include: {
      performedBy: { select: { name: true, phone: true } },
      fund: { select: { title: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            পূর্ণাঙ্গ অডিট ট্রেইল ও কার্যক্রম লগ
          </h1>
          <p className="text-xs text-slate-500">
            কে, কখন, কী তথ্য পরিবর্তন করেছেন তার ডিজিটাল ক্রমানুক্রমিক অডিট রেকর্ড
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
          সর্বশেষ {toBengaliNumber(logs.length)}টি কার্যক্রম সংরক্ষিত
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">অ্যাকশন ও টাইপ</th>
                <th className="py-3 px-3">সম্পাদনকারী ব্যক্তি</th>
                <th className="py-3 px-3">সংশ্লিষ্ট তহবিল</th>
                <th className="py-3 px-4">পরিবর্তনের বিবরণ (Before/After Diff)</th>
                <th className="py-3 px-4 text-right">টাইমস্ট্যাম্প</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                let detailsObj: Record<string, unknown> = {};
                let isJson = false;
                try {
                  if (log.details) {
                    detailsObj = JSON.parse(log.details);
                    isJson = true;
                  }
                } catch {
                  // string
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] block w-fit">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        {log.entityType}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">
                        {log.performedBy?.name || "সিস্টেম স্বয়ংক্রিয়"}
                      </p>
                      {log.performedBy?.phone && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          {log.performedBy.phone}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {log.fund?.title || "সার্বজনীন"}
                    </td>

                    <td className="py-3 px-4 max-w-md">
                      {isJson ? (
                        <div className="space-y-1">
                          {typeof detailsObj.summary === "string" && (
                            <p className="font-semibold text-slate-800 text-xs">
                              {detailsObj.summary}
                            </p>
                          )}
                          <pre className="text-[10px] bg-slate-900 text-emerald-300 p-2 rounded-lg font-mono overflow-x-auto max-h-28 custom-scrollbar">
                            {JSON.stringify(detailsObj, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-slate-600">{log.details || "কোনো ডিটেইল নেই"}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatBengaliDate(log.timestamp)}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString("bn-BD")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
