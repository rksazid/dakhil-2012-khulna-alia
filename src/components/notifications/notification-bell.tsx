"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Check,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/actions/notification-actions";
import { toBengaliNumber } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  link: string | null;
  type: "PAYMENT_VERIFIED" | "PAYMENT_REJECTED" | "FORUM_REPLY" | "NOTICE" | "GENERAL";
  isRead: boolean;
  createdAt: string | Date;
}

export function NotificationBell({ initialUnreadCount = 0 }: { initialUnreadCount?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Initial fetch and 20s background poll
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      // Optimistic
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationAsReadAction(notif.id);
    }
    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await markAllNotificationsAsReadAction();
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "PAYMENT_VERIFIED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case "PAYMENT_REJECTED":
        return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case "FORUM_REPLY":
        return <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />;
    }
  };

  const formatRelativeTime = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "এইমাত্র";
    if (diffSeconds < 3600) return `${toBengaliNumber(Math.floor(diffSeconds / 60))} মিনিট আগে`;
    if (diffSeconds < 86400) return `${toBengaliNumber(Math.floor(diffSeconds / 3600))} ঘণ্টা আগে`;
    return `${toBengaliNumber(Math.floor(diffSeconds / 86400))} দিন আগে`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        aria-label="নোটিফিকেশন দেখুন"
        className="relative p-2 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75">
            {toBengaliNumber(unreadCount)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:-right-8 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold text-slate-900">নোটিফিকেশন ও আপডেট</h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {toBengaliNumber(unreadCount)}টি নতুন
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3 h-3" /> সব পঠিত করুন
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-500">
                  এখনো কোনো নতুন নোটিফিকেশন নেই।
                </p>
                <p className="text-[11px] text-slate-400">
                  আপনার অনুদান যাচাই বা বার্তায় উত্তর আসলে এখানে নোটিফিকেশন পাবেন।
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-slate-50 ${
                    !notif.isRead ? "bg-emerald-50/50" : ""
                  }`}
                >
                  <div className="mt-0.5">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h5
                        className={`text-xs font-bold truncate ${
                          !notif.isRead ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center shrink-0">
            <Link
              href="/dashboard?tab=notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 hover:underline"
            >
              সব অ্যাক্টিভিটি নোটিফিকেশন দেখুন <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

