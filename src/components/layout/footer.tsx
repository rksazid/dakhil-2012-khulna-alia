import Link from "next/link";
import { Heart, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";
import prisma from "@/lib/prisma";

export interface FooterProps {
  contactEmail?: string;
  contactPhone?: string;
  batchMotto?: string;
}

export async function Footer(props?: FooterProps) {
  let { contactEmail, contactPhone, batchMotto } = props || {};

  // If any settings are not passed as props, fetch dynamically from DB
  if (!contactEmail || !contactPhone || !batchMotto) {
    try {
      const settings = await prisma.siteSetting.findMany({
        where: {
          key: { in: ["contact_email", "contact_phone", "batch_motto"] },
        },
      });
      const map = settings.reduce<Record<string, string>>((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {});

      contactEmail = contactEmail || map["contact_email"] || "support@dakhil2012khulna.org";
      contactPhone = contactPhone || map["contact_phone"] || "+880 1711-000001";
      batchMotto = batchMotto || map["batch_motto"] || "বন্ধুত্বে প্রীতি, সেবায় ঐক্য — খুলনা আলিয়া ২০১২";
    } catch {
      contactEmail = contactEmail || "support@dakhil2012khulna.org";
      contactPhone = contactPhone || "+880 1711-000001";
      batchMotto = batchMotto || "বন্ধুত্বে প্রীতি, সেবায় ঐক্য — খুলনা আলিয়া ২০১২";
    }
  }

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                ১২
              </div>
              <span className="font-bold text-white text-base">
                দাখিল ২০১২ ব্যাচ
              </span>
            </div>

            {batchMotto && (
              <p className="text-xs font-semibold text-emerald-400 italic">
                “{batchMotto}”
              </p>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              খুলনা আলিয়া মাদ্রাসা দাখিল ২০১২ ব্যাচের সকল বন্ধুদের ভ্রাতৃত্ব, পারস্পরিক কল্যাণ ও স্থায়ী সদকায়ে যারিয়াহর ডিজিটাল স্বচ্ছ প্ল্যাটফর্ম।
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>১০০% ডিজিটাল স্বচ্ছতা ও অডিট ট্রেইল</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              গুরুত্বপূর্ণ পাতা
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/funds" className="hover:text-emerald-400 transition">
                  তহবিল তালিকা ও উদ্দেশ্য
                </Link>
              </li>
              <li>
                <Link href="/members" className="hover:text-emerald-400 transition">
                  ব্যাচমেট ডিরেক্টরি
                </Link>
              </li>
              <li>
                <Link href="/forum" className="hover:text-emerald-400 transition">
                  কমিউনিটি ফোরাম ও আড্ডা
                </Link>
              </li>
              <li>
                <Link href="/notices" className="hover:text-emerald-400 transition">
                  অফিসিয়াল নোটিশ বোর্ড
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-emerald-400 transition">
                  স্মৃতি ও ছবি অ্যালবাম
                </Link>
              </li>
            </ul>
          </div>

          {/* Fund Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              তহবিল ও সেবা
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• সদকায়ে যারিয়াহ ও বন্ধু কল্যাণ ফান্ড</li>
              <li>• জরুরি চিকিৎসা ও দুর্বিপাক সহায়তা</li>
              <li>• বার্ষিক ইফতার ও পুনর্মিলনী ফান্ড</li>
              <li>• করজে হাসানা ও স্বাবলম্বীকরণ</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              যোগাযোগ ও সহায়তা
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>খুলনা আলিয়া মাদ্রাসা চত্বর, খুলনা</span>
              </div>
              {contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <a
                    href={`tel:${contactPhone.replace(/[\s-]/g, "")}`}
                    className="hover:text-emerald-400 transition font-mono"
                  >
                    {contactPhone}
                  </a>
                </div>
              )}
              {contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-emerald-400 transition font-mono truncate block"
                  >
                    {contactEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} দাখিল ২০১২ ব্যাচ, খুলনা আলিয়া মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।</p>

          {/* Developer Credit & Authentic Social Links */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
            <span>Made with <Heart className="w-3 h-3 text-red-500 inline fill-red-500" /> by</span>
            <a
              href="https://rksazid.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition"
            >
              rksazid
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="https://github.com/rksazid"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition flex items-center gap-1"
              title="GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="https://www.linkedin.com/in/rksazid/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition flex items-center gap-1"
              title="LinkedIn"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span>LinkedIn</span>
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="https://www.facebook.com/rksazid"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition flex items-center gap-1"
              title="Facebook"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
