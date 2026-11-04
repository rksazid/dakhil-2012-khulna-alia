import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { toBengaliNumber } from "@/lib/utils";
import {
  Users,
  Search,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Droplet,
  UserCheck,
} from "lucide-react";
import { MemberDirectoryClient } from "./member-directory-client";


export default async function MembersPage() {
  const session = await getSession();

  const members = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      bloodGroup: true,
      studentGroup: true,
      classRoll: true,
      classroom: true,
      occupation: true,
      workplace: true,
      presentAddress: true,
      permanentAddress: true,
      role: true,
      showPhoneInDirectory: true,
      showEmailInDirectory: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar session={session} />

      {/* Header Banner */}
      <div className="bg-emerald-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-xs text-amber-300 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>দাখিল ২০১২ ব্যাচমেট ডিরেক্টরি</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            খুলনা আলিয়া ২০১২ ব্যাচ সদস্য পরিচিতি
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            একসাথে অধ্যয়ন করা প্রিয় সহপাঠীদের বর্তমান পেশা, যোগাযোগের ইমেইল, মোবাইল নম্বর এবং জরুরি রক্তের গ্রুপ ডিরেক্টরি।
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <MemberDirectoryClient members={members} />
      </main>

      <Footer />
    </div>
  );
}
