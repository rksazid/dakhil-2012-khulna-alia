"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth-actions";
import { FileUploader } from "@/components/ui/file-uploader";
import { UserPlus, Lock, Phone, User, Mail, Briefcase, MapPin, Droplet, GraduationCap, Hash, School } from "lucide-react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("BATCH_MEMBER");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("পাসওয়ার্ড দুটি মিলছে না।");
      return;
    }

    startTransition(async () => {
      const res = await registerAction(formData);
      if (!res.success) {
        setError(res.error || "নিবন্ধন ব্যর্থ হয়েছে।");
      } else {
        if (res.role === "SUPER_ADMIN") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2">
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
          সদস্য ও শুভাকাঙ্ক্ষী নিবন্ধন
        </h2>
        <p className="text-xs text-slate-500">
          দাখিল ২০১২ ব্যাচ ও কল্যাণ ফান্ড — খুলনা আলিয়া মাদ্রাসা
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-md rounded-2xl border border-slate-200 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Type Selection */}
            <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
              <label className="block text-xs font-bold text-emerald-950">
                আপনার পরিচয় / ক্যাটাগরি *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { key: "BATCH_MEMBER", label: "দাখিল ২০১২ ব্যাচমেট", sub: "সহপাঠী বন্ধু" },
                  { key: "TEACHER", label: "সম্মানিত শিক্ষক", sub: "উস্তাদ / শিক্ষকবৃন্দ" },
                  { key: "WELL_WISHER", label: "শুভাকাঙ্ক্ষী ও দাতা", sub: "পৃষ্ঠপোষক / সহযোগী" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setUserType(item.key)}
                    className={`py-2 px-3 rounded-xl border text-left transition ${
                      userType === item.key
                        ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span
                      className={`block text-[10px] ${
                        userType === item.key ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
              <input type="hidden" name="userType" value={userType} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পুরো নাম *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="উদা: আব্দুল্লাহ আল মামুন"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর * (লগইনের জন্য)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="phone"
                    type="text"
                    required
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ইমেইল ঠিকানা (ডিরেক্টরিতে প্রদর্শনের জন্য)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="email"
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  রক্তের গ্রুপ (জরুরি সেবার জন্য)
                </label>
                <div className="relative">
                  <Droplet className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    name="bloodGroup"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বর্তমান পেশা
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="occupation"
                    type="text"
                    placeholder="উদা: সফটওয়্যার ইঞ্জিনিয়ার, শিক্ষক, ব্যাংকার"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বর্তমান অবস্থান / কর্মস্থল
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="presentAddress"
                    type="text"
                    placeholder="উদা: সোনাডাঙ্গা, খুলনা অথবা ঢাকা"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Identity-specific Info */}
            {userType === "BATCH_MEMBER" && (
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <p className="text-xs font-bold text-emerald-800">
                  মাদ্রাসার তথ্য — দাখিল ২০১২ (ঐচ্ছিক)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      বিভাগ / গ্রুপ
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        name="studentGroup"
                        className="w-full pl-9 pr-2 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">নির্বাচন করুন</option>
                        <option value="SCIENCE">বিজ্ঞান (Science)</option>
                        <option value="ARTS">মানবিক (Arts)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ক্লাস রোল
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        name="classRoll"
                        type="text"
                        placeholder="উদা: ১৫ বা 15"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      শাখা / রুম
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        name="classroom"
                        type="text"
                        placeholder="উদা: ক শাখা"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {userType === "TEACHER" && (
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
                <p className="text-xs font-bold text-amber-900">
                  শিক্ষক পদবী ও মাদ্রাসার পরিচিতি
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    পদবী / বিভাগ (ঐচ্ছিক)
                  </label>
                  <input
                    name="classroom"
                    type="text"
                    placeholder="উদা: সিনিয়র শিক্ষক / সহকারী মৌলভী / আরবি প্রভাষক, খুলনা আলিয়া মাদ্রাসা"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}

            {userType === "WELL_WISHER" && (
              <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200/80 space-y-2">
                <p className="text-xs font-bold text-teal-900">
                  পরিচিতি ও সম্পর্ক
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    পরিচয় / সম্পর্ক (ঐচ্ছিক)
                  </label>
                  <input
                    name="classroom"
                    type="text"
                    placeholder="উদা: শুভানুধ্যায়ী / অভিভাবক / কল্যাণকামী শুভাকাঙ্ক্ষী"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পাসওয়ার্ড * (ন্যূনতম ৬ অক্ষর)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পাসওয়ার্ড নিশ্চিত করুন *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সংক্ষিপ্ত পরিচিতি / বায়ো
              </label>
              <textarea
                name="bio"
                rows={2}
                placeholder="নিজের বা খুলনা আলিয়ায় অধ্যয়নের স্মৃতি নিয়ে কিছু কথা লিখুন..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <FileUploader
                folder="avatars"
                label="প্রোফাইল ছবি (ঐচ্ছিক — ব্যাচমেট ডিরেক্টরিতে প্রদর্শনের জন্য)"
                onUploadComplete={(url, thumb) => {
                  setAvatarUrl(url);
                  setThumbnailUrl(thumb || url);
                }}
                initialUrl={avatarUrl}
                accept="image/*"
              />
              <input type="hidden" name="avatarUrl" value={avatarUrl} />
              <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isPending ? "নিবন্ধন সম্পন্ন হচ্ছে..." : "নিবন্ধন সম্পন্ন করুন"}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-700 hover:text-emerald-800"
            >
              সরাসরি লগইন করুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
