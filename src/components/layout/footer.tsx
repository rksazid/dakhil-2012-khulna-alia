import Link from "next/link";
import { Heart, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
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
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>+৮৮০ ১৭১১-০০০০০১ (সমন্বয়ক)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>contact@dakhil2012khulna.org</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} দাখিল ২০১২ ব্যাচ, খুলনা আলিয়া মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="flex items-center justify-center gap-1">
            ভ্রাতৃত্বের বন্ধনে নির্মিত <Heart className="w-3.5 h-3.5 text-red-500 inline fill-red-500" /> খুলনা আলিয়া ২০১২ পরিবার
          </p>
        </div>
      </div>
    </footer>
  );
}
