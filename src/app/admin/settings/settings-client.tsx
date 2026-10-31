"use client";

import { useState, useTransition } from "react";
import { updateSiteSettingsAction } from "@/actions/settings-actions";
import { Settings, Save, Sparkles, AlertCircle, Layout, Phone, Mail } from "lucide-react";
import { FileUploader } from "@/components/ui/file-uploader";

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [heroBannerUrl, setHeroBannerUrl] = useState(initialSettings["hero_banner_image"] || "");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await updateSiteSettingsAction(formData);
      if (res.success) {
        setFeedback({
          type: "success",
          message: "হোমপেজ ও সাইট সেটিংস সফলভাবে হালনাগাদ করা হয়েছে! হোমপেজে পরিবর্তন কার্যকর হয়েছে।",
        });
      } else {
        setFeedback({ type: "error", message: res.error || "সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
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
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-black text-slate-900">
          হোমপেজ ও সাইট সেটিংস কাস্টমাইজেশন
        </h1>
        <p className="text-xs text-slate-500">
          হোমপেজের ব্যানার, শীর্ষ শিরোনাম, রানিং নোটিশ বার ও যোগাযোগের তথ্য সরাসরি পরিবর্তন করুন
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layout className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-800">
              হোমপেজ ব্যানার ও টেক্সট
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              হিরো সেকশন মূল শিরোনাম (Hero Title)
            </label>
            <input
              name="hero_title"
              defaultValue={initialSettings["hero_title"] || "দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া"}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              হিরো সেকশন সাব-টাইটেল ও স্লোগান (Hero Subtitle)
            </label>
            <textarea
              name="hero_subtitle"
              rows={2}
              defaultValue={
                initialSettings["hero_subtitle"] ||
                "একযুগের ভ্রাতৃত্ব, আত্মিক বন্ধন ও পারস্পরিক কল্যাণে অটুট ঐক্য। শতভাগ স্বচ্ছতা ও দায়িত্বশীলতায় পরিচালিত আমাদের কল্যাণ ফান্ড।"
              }
              required
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <FileUploader
              folder="banners"
              label="হিরো ব্যানার ব্যাকগ্রাউন্ড ছবি (Vercel Object Store)"
              onUploadComplete={setHeroBannerUrl}
              initialUrl={heroBannerUrl}
            />
            <input type="hidden" name="hero_banner_image" value={heroBannerUrl} />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800">
              জরুরি রানিং নোটিশ বার (Ticker / Marquee)
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              হোমপেজের শীর্ষে চলমান জরুরি বার্তা
            </label>
            <input
              name="marquee_notice"
              defaultValue={
                initialSettings["marquee_notice"] ||
                "📢 দাখিল ২০১২ ব্যাচের সকল বন্ধুদের প্রোফাইল হালনাগাদ এবং কল্যাণ ফান্ডের মাসিক চাঁদা নিয়মিত পরিশোধের আহ্বান জানানো হচ্ছে।"
              }
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Phone className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-800">
              যোগাযোগ ও মূল তথ্য
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                অফিসিয়াল ইমেইল
              </label>
              <input
                name="contact_email"
                type="email"
                defaultValue={initialSettings["contact_email"] || "support@dakhil2012khulna.org"}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                অফিসিয়াল ফোন / হটলাইন
              </label>
              <input
                name="contact_phone"
                defaultValue={initialSettings["contact_phone"] || "+880 1711-000001"}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ব্যাচের মূল স্লোগান / মূলমন্ত্র (Motto)
            </label>
            <input
              name="batch_motto"
              defaultValue={initialSettings["batch_motto"] || "বন্ধুত্বে প্রীতি, সেবায় ঐক্য — খুলনা আলিয়া ২০১২"}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isPending ? "সংরক্ষণ হচ্ছে..." : "সকল পরিবর্তন সংরক্ষণ করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}
