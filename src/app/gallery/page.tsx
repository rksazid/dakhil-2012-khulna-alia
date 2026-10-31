import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Image as ImageIcon, Calendar, Sparkles } from "lucide-react";


export default async function GalleryPage() {
  const session = await getSession();

  const galleryItems = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar session={session} />

      <div className="bg-emerald-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-xs text-amber-300 font-medium">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>স্মৃতি ও ছবির অ্যালবাম</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            খুলনা আলিয়া ২০১২ ব্যাচের স্মৃতিকথা
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            ক্যাম্পাসের সোনালী দিন, বার্ষিক ইফতার মাহফিল, পুনর্মিলনী ও বন্ধুদের আনন্দঘন মুহূর্তসমূহের ছবির সংগ্রহশালা।
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {galleryItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-sm text-slate-500">বর্তমানে কোনো ছবি যুক্ত করা হয়নি।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition group flex flex-col"
              >
                <div className="h-56 bg-slate-100 overflow-hidden relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {item.category && (
                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>{item.eventDate || "স্মৃতি মুহূর্ত"}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition">
                      {item.title}
                    </h3>
                  </div>

                  {item.caption && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1 border-t border-slate-100">
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
