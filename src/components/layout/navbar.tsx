"use client";

import Link from "next/link";
import { useState } from "react";
import { SessionPayload } from "@/lib/auth";
import { logoutAction } from "@/actions/auth-actions";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  Menu,
  X,
  HeartHandshake,
  Users,
  Bell,
  Image as ImageIcon,
  Shield,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  MessageSquare,
} from "lucide-react";

interface NavbarProps {
  session: SessionPayload | null;
}

export function Navbar({ session }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/";
  };

  const navLinks = [
    { label: "হোম", href: "/" },
    { label: "তহবিলসমূহ", href: "/funds", icon: HeartHandshake },
    { label: "সদস্য ডিরেক্টরি", href: "/members", icon: Users },
    { label: "ফোরাম ও আড্ডা", href: "/forum", icon: MessageSquare },
    { label: "নোটিশ ও বিজ্ঞপ্তি", href: "/notices", icon: Bell },
    { label: "স্মৃতি ও অ্যালবাম", href: "/gallery", icon: ImageIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-xs group-hover:bg-emerald-800 transition">
              ১২
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight block group-hover:text-emerald-800 transition">
                দাখিল ২০১২ ব্যাচ
              </span>
              <span className="text-[11px] font-medium text-emerald-700 tracking-wide block">
                খুলনা আলিয়া মাদ্রাসা
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg hover:text-emerald-800 hover:bg-emerald-50/70 transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Account / CTA */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-2">
                <NotificationBell />

                {session.role === "SUPER_ADMIN" || session.role === "FUND_MANAGER" ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg transition shadow-2xs"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    ম্যানেজমেন্ট প্যানেল
                  </Link>
                ) : null}

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-900 hover:bg-emerald-200 rounded-lg transition"
                >
                  {session.avatarUrl ? (
                    <img
                      src={session.avatarUrl}
                      alt={session.name}
                      className="w-4 h-4 rounded-full object-cover border border-emerald-300"
                    />
                  ) : (
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  )}
                  <span>{session.name.split(" ")[0] || "ড্যাশবোর্ড"}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  title="লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  লগইন
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  নিবন্ধন
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-1.5 md:hidden">
            {session && <NotificationBell />}
            {session && (
              <Link
                href="/dashboard"
                className="p-1.5 text-xs font-medium bg-emerald-100 text-emerald-900 rounded-lg"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-700 hover:text-emerald-800 rounded-lg focus:outline-hidden"
              aria-label="মেনু খুলুন"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {Icon && <Icon className="w-4 h-4 text-emerald-600" />}
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {session ? (
              <>
                {(session.role === "SUPER_ADMIN" || session.role === "FUND_MANAGER") && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-800 text-white"
                  >
                    <Shield className="w-4 h-4" />
                    ম্যানেজমেন্ট প্যানেল
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-100 text-emerald-900"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  সদস্য ড্যাশবোর্ড ({session.name})
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  লগআউট করুন
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700"
                >
                  লগইন
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg"
                >
                  নিবন্ধন
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
