"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth-actions";
import { LogIn, ArrowRight, ShieldCheck, Lock, Phone } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await loginAction(formData);
      if (!res.success) {
        setError(res.error || "লগইন ব্যর্থ হয়েছে।");
      } else {
        if (res.role === "SUPER_ADMIN" || res.role === "FUND_MANAGER") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      }
    });
  };

  const handleDemoFill = (identifier: string) => {
    const idInput = document.getElementById("identifier") as HTMLInputElement;
    const passInput = document.getElementById("password") as HTMLInputElement;
    if (idInput && passInput) {
      idInput.value = identifier;
      passInput.value = "Password123!";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
            <img
              src="/logo.png"
              alt="দাখিল ২০১২ ব্যাচ লোগো"
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          সদস্য পোর্টালে লগইন
        </h2>
        <p className="text-xs text-slate-500">
          দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া মাদ্রাসা
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                মোবাইল নম্বর অথবা ইমেইল
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  placeholder="01711000001 অথবা admin@dakhil2012.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isPending ? "লগইন হচ্ছে..." : "লগইন করুন"}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              ডেমো টেস্ট অ্যাকাউন্টসমূহ:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill("01711000001")}
                className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-1.5 px-2 rounded-lg font-medium border border-emerald-200"
              >
                সুপার অ্যাডমিন
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("01711000002")}
                className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-1.5 px-2 rounded-lg font-medium border border-emerald-200"
              >
                ফান্ড ম্যানেজার
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("01711000004")}
                className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-1.5 px-2 rounded-lg font-medium border border-emerald-200"
              >
                সাধারণ সদস্য
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              পাসওয়ার্ড: <span className="font-mono">Password123!</span>
            </p>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500">
            অ্যাকাউন্ট নেই?{" "}
            <Link
              href="/register"
              className="font-bold text-emerald-700 hover:text-emerald-800"
            >
              নতুন অ্যাকাউন্ট নিবন্ধন করুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
