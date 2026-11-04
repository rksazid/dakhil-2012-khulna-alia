"use client";

import { useState, useTransition } from "react";
import { formatCurrency, formatBengaliDate, toBengaliNumber } from "@/lib/utils";
import { recordExpenseAction, deleteExpenseAction } from "@/actions/expense-actions";
import { Receipt, Plus, Trash2, Calendar, Tag, AlertTriangle } from "lucide-react";
import { FileUploader } from "@/components/ui/file-uploader";

interface ExpenseData {
  id: string;
  fundId: string;
  title: string;
  amount: number;
  category: string | null;
  spentDate: Date;
  receiptUrl: string | null;
  note: string | null;
  fund: { id: string; title: string };
  approvedBy?: { name: string } | null;
}

interface FundData {
  id: string;
  title: string;
  currentBalance: number;
}

export function ExpensesManagerClient({
  expenses,
  funds,
}: {
  expenses: ExpenseData[];
  funds: FundData[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await recordExpenseAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "খরচ সফলভাবে এন্ট্রি ও তহবিল স্থিতি সমন্বয় করা হয়েছে।" });
        setIsOpen(false);
      } else {
        setFeedback({ type: "error", message: res.error || "ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই খরচের ভাউচারটি মুছতে চান? তহবিলের স্থিতি ফেরত যোগ হবে।")) return;
    startTransition(async () => {
      const res = await deleteExpenseAction(id);
      if (res.success) {
        setFeedback({ type: "success", message: "খরচের রেকর্ড মুছে ফেলা হয়েছে এবং ব্যালেন্স পুনর্বহাল হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "মুছতে ব্যর্থ।" });
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
            তহবিল খরচ ও কল্যাণ সহায়তা হিসাব
          </h1>
          <p className="text-xs text-slate-500">
            বন্ধুদের চিকিৎসা, স্বাবলম্বীকরণ এবং মানবিক সহায়তায় ব্যয়িত অর্থের ডিজিটাল বিবরণী
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> নতুন খরচ রেকর্ড করুন
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium">সর্বমোট সহায়তা ও খরচ</span>
          <p className="text-2xl font-black text-red-600 mt-1">
            {formatCurrency(totalSpent)}
          </p>
          <span className="text-[11px] text-slate-400">
            মোট {toBengaliNumber(expenses.length)}টি ভাউচার এন্ট্রি
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
          <Receipt className="w-6 h-6" />
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            কোনো খরচের রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">খরচের শিরোনাম ও বিবরণ</th>
                  <th className="py-3 px-3">তহবিল</th>
                  <th className="py-3 px-3">ক্যাটাগরি</th>
                  <th className="py-3 px-3">পরিমাণ</th>
                  <th className="py-3 px-3">অনুমোদনকারী</th>
                  <th className="py-3 px-3">তারিখ</th>
                  <th className="py-3 px-4 text-right">মুছে ফেলুন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{e.title}</p>
                      {e.note && <p className="text-[11px] text-slate-500">{e.note}</p>}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{e.fund.title}</td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                        {e.category || "সাধারণ"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-red-600 text-sm">
                      -{formatCurrency(e.amount)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {e.approvedBy?.name || "কমিটি"}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {formatBengaliDate(e.spentDate)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        disabled={isPending}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Expense */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                সহায়তা বা খরচের ভাউচার এন্ট্রি
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  কোন তহবিল থেকে ব্যয় হবে? *
                </label>
                <select
                  name="fundId"
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} (স্থিতি: {formatCurrency(f.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  খরচের শিরোনাম ও কারণ *
                </label>
                <input
                  name="title"
                  required
                  placeholder="উদা: অসুস্থ বন্ধুর অপারেশন সহায়তা বা শীতবস্ত্র বিতরণ"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    খরচের পরিমাণ (৳) *
                  </label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min={1}
                    placeholder="উদা: 15000"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-bold text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ব্যয়ের খাত / ক্যাটাগরি
                  </label>
                  <input
                    name="category"
                    placeholder="জরুরি চিকিৎসা / খাদ্য উপহার"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ব্যয়ের তারিখ
                  </label>
                  <input
                    name="spentDate"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <FileUploader
                  folder="receipts"
                  label="রসিদ বা ভাউচার ছবি"
                  onUploadComplete={setUploadedReceiptUrl}
                  initialUrl={uploadedReceiptUrl}
                />
                <input type="hidden" name="receiptUrl" value={uploadedReceiptUrl} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  অতিরিক্ত মন্তব্য / নোট
                </label>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="কমিটির সিদ্ধান্ত বা বিতরণের বিস্তারিত স্থান..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "রেকর্ড হচ্ছে..." : "খরচ নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
