"use client";

import { useState, useEffect, useTransition } from "react";
import {
  MessageSquare,
  Send,
  RefreshCw,
  Pin,
  Trash2,
  CornerDownRight,
  Search,
  Share2,
  Check,
  Shield,
  GraduationCap,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
  X,
  MessageCircleReply,
} from "lucide-react";
import {
  createForumPostAction,
  deleteForumPostAction,
  togglePinForumPostAction,
} from "@/actions/forum-actions";
import { MemberDetailModal, MemberDetailData } from "@/components/members/member-detail-modal";
import { toBengaliNumber } from "@/lib/utils";
import { ForumPostItem } from "@/lib/forum";

export type { ForumPostItem };

interface CurrentUser {
  id: string;
  name: string;
  role: string;
  userType?: string | null;
  avatarUrl?: string | null;
  thumbnailUrl?: string | null;
}

interface ForumFeedClientProps {
  initialPosts: ForumPostItem[];
  currentUser: CurrentUser;
}

// Relative time helper
function formatTimeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "এইমাত্র";
  if (diffSec < 3600) return `${toBengaliNumber(Math.floor(diffSec / 60))} মিনিট আগে`;
  if (diffSec < 86400) return `${toBengaliNumber(Math.floor(diffSec / 3600))} ঘণ্টা আগে`;
  return `${toBengaliNumber(Math.floor(diffSec / 86400))} দিন আগে`;
}

// Recursive reply count
function countAllReplies(item: ForumPostItem): number {
  if (!item.replies || item.replies.length === 0) return 0;
  return item.replies.reduce((sum, r) => sum + 1 + countAllReplies(r), 0);
}

// Recursive search match
function matchesSearchDeep(item: ForumPostItem, query: string): boolean {
  if (
    item.content.toLowerCase().includes(query) ||
    item.author.name.toLowerCase().includes(query)
  ) {
    return true;
  }
  if (item.replies && item.replies.length > 0) {
    return item.replies.some((child) => matchesSearchDeep(child, query));
  }
  return false;
}

// Recursive user post match
function matchesUserDeep(item: ForumPostItem, userId: string): boolean {
  if (item.author.id === userId) return true;
  if (item.replies && item.replies.length > 0) {
    return item.replies.some((child) => matchesUserDeep(child, userId));
  }
  return false;
}

interface ThreadItemProps {
  item: ForumPostItem;
  depth: number;
  rootPostId: string;
  currentUser: CurrentUser;
  activeReplyTarget: { id: string; authorName: string } | null;
  setActiveReplyTarget: (target: { id: string; authorName: string } | null) => void;
  replyContent: string;
  setReplyContent: React.Dispatch<React.SetStateAction<string>>;
  onReplySubmit: (parentId: string) => void;
  onDelete: (id: string) => void;
  onSelectMember: (m: MemberDetailData) => void;
  onCopyLink: (id: string) => void;
  copiedPostId: string | null;
  isPending: boolean;
  collapsedThreads: Set<string>;
  toggleCollapse: (id: string) => void;
}

/**
 * Recursive Threaded Comment Component
 * Handles arbitrary depths with visual thread indentation and depth capping for mobile.
 */
function ThreadItem({
  item,
  depth,
  rootPostId,
  currentUser,
  activeReplyTarget,
  setActiveReplyTarget,
  replyContent,
  setReplyContent,
  onReplySubmit,
  onDelete,
  onSelectMember,
  onCopyLink,
  copiedPostId,
  isPending,
  collapsedThreads,
  toggleCollapse,
}: ThreadItemProps) {
  const isDirectReplyActive = activeReplyTarget?.id === item.id;
  const isCollapsed = collapsedThreads.has(item.id);
  const totalSubReplies = countAllReplies(item);

  // Progressive depth indentation and responsive border styling
  const indentClass =
    depth === 1
      ? "pl-2.5 sm:pl-4 border-l-2 border-emerald-200/90 ml-1 sm:ml-2"
      : depth === 2
      ? "pl-2 sm:pl-3.5 border-l-2 border-teal-200/90 ml-1 sm:ml-2"
      : depth === 3
      ? "pl-2 sm:pl-3 border-l-2 border-amber-200/80 ml-0.5 sm:ml-1.5"
      : "pl-1.5 sm:pl-2.5 border-l-2 border-slate-300 ml-0.5 sm:ml-1"; // Capped indentation for deep threads to protect mobile screens

  return (
    <div className={`space-y-2 group/thread ${indentClass}`}>
      <div
        id={`post-${item.id}`}
        className={`rounded-2xl p-3 sm:p-4 border transition-all duration-150 ${
          depth === 1
            ? "bg-slate-50/90 border-slate-200/80 shadow-2xs"
            : depth % 2 === 0
            ? "bg-white border-emerald-100/90 shadow-2xs"
            : "bg-slate-50/80 border-slate-200/70"
        }`}
      >
        {/* Comment Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div
              onClick={() => onSelectMember(item.author)}
              className="cursor-pointer group relative shrink-0"
              title="প্রোফাইল দেখুন"
            >
              {item.author.thumbnailUrl || item.author.avatarUrl ? (
                <img
                  src={item.author.thumbnailUrl || item.author.avatarUrl!}
                  alt={item.author.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition [image-rendering:-webkit-optimize-contrast]"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs group-hover:scale-105 transition">
                  {item.author.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Author info & Badges */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  onClick={() => onSelectMember(item.author)}
                  className="font-bold text-slate-900 text-xs sm:text-sm cursor-pointer hover:text-emerald-700 transition truncate"
                >
                  {item.author.name}
                </span>

                {/* Respectful Badges */}
                {item.author.userType === "TEACHER" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <GraduationCap className="w-2.5 h-2.5 text-amber-700" /> শ্রদ্ধেয় শিক্ষক
                  </span>
                ) : item.author.userType === "WELL_WISHER" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                    <HeartHandshake className="w-2.5 h-2.5 text-teal-700" /> শুভাকাঙ্ক্ষী
                  </span>
                ) : item.author.role === "SUPER_ADMIN" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                    <Shield className="w-2.5 h-2.5 text-purple-700" /> সুপার অ্যাডমিন
                  </span>
                ) : item.author.role === "FUND_MANAGER" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                    <Shield className="w-2.5 h-2.5 text-emerald-700" /> তহবিল ব্যবস্থাপক
                  </span>
                ) : null}

                {/* Replying-to Mention Pill (shows who is being answered) */}
                {item.parent?.author && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                    <CornerDownRight className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span className="truncate">@{item.parent.author.name}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                <span>{formatTimeAgo(item.createdAt)}</span>
                {item.author.studentGroup && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">
                      {item.author.studentGroup === "SCIENCE" ? "বিজ্ঞান" : "মানবিক"}
                    </span>
                  </>
                )}
                {item.author.classRoll && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-emerald-700 font-medium">
                      রোল #{item.author.classRoll}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Delete Option */}
          {(currentUser.id === item.author.id || currentUser.role === "SUPER_ADMIN") && (
            <button
              onClick={() => onDelete(item.id)}
              disabled={isPending}
              className="opacity-60 hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
              title="মন্তব্য মুছুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Comment Content */}
        <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words pl-8 sm:pl-10 pt-1">
          {item.content}
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-200/60 pl-8 sm:pl-10 text-xs">
          <div className="flex items-center gap-2">
            {/* Reply Button */}
            <button
              type="button"
              onClick={() => {
                if (isDirectReplyActive) {
                  setActiveReplyTarget(null);
                  setReplyContent("");
                } else {
                  setActiveReplyTarget({ id: item.id, authorName: item.author.name });
                  setReplyContent(`@${item.author.name} `);
                }
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition text-xs ${
                isDirectReplyActive
                  ? "bg-emerald-100 text-emerald-900"
                  : "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
              }`}
            >
              <CornerDownRight className="w-3 h-3" />
              <span>উত্তর দিন</span>
            </button>

            {/* Collapse / Expand Sub-replies */}
            {totalSubReplies > 0 && (
              <button
                type="button"
                onClick={() => toggleCollapse(item.id)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded-lg transition"
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown className="w-3 h-3 text-emerald-600" />
                    <span>{toBengaliNumber(totalSubReplies)}টি উত্তর দেখুন</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3 h-3 text-slate-400" />
                    <span>ভাঁজ করুন</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Copy Direct Comment Link */}
          <button
            type="button"
            onClick={() => onCopyLink(item.id)}
            className="text-[11px] text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition"
            title="কমেন্টের সরাসরি লিংক কপি করুন"
          >
            {copiedPostId === item.id ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-bold">কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                <span className="hidden sm:inline">লিংক</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline Reply Composer right below this comment */}
      {isDirectReplyActive && (
        <div className="pl-3 sm:pl-6 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
              <span className="flex items-center gap-1.5">
                <MessageCircleReply className="w-3.5 h-3.5 text-emerald-700" />
                <span>@{item.author.name}-এর মন্তব্যের উত্তর দিন</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveReplyTarget(null);
                  setReplyContent("");
                }}
                className="p-1 hover:bg-emerald-200/60 rounded-full text-slate-600 hover:text-slate-900"
                title="বাতিল করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              rows={2}
              autoFocus
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`@${item.author.name}-কে উত্তর লিখুন...`}
              className="w-full p-2.5 text-xs sm:text-sm border border-emerald-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-sm">
                {["❤️", "👍", "🤲", "🤝"].map((emo) => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => setReplyContent((prev) => prev + emo)}
                    className="p-1 hover:bg-emerald-100 rounded-md transition hover:scale-110 active:scale-95"
                  >
                    {emo}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveReplyTarget(null);
                    setReplyContent("");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => onReplySubmit(item.id)}
                  disabled={isPending || !replyContent.trim()}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-xs disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  {isPending ? "পাঠানো হচ্ছে..." : "উত্তর দিন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recursive Child Replies (Depth + 1) */}
      {!isCollapsed && item.replies && item.replies.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {item.replies.map((childReply) => (
            <ThreadItem
              key={childReply.id}
              item={childReply}
              depth={depth + 1}
              rootPostId={rootPostId}
              currentUser={currentUser}
              activeReplyTarget={activeReplyTarget}
              setActiveReplyTarget={setActiveReplyTarget}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
              onSelectMember={onSelectMember}
              onCopyLink={onCopyLink}
              copiedPostId={copiedPostId}
              isPending={isPending}
              collapsedThreads={collapsedThreads}
              toggleCollapse={toggleCollapse}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ForumFeedClient({ initialPosts, currentUser }: ForumFeedClientProps) {
  const [posts, setPosts] = useState<ForumPostItem[]>(initialPosts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [activeReplyTarget, setActiveReplyTarget] = useState<{
    id: string;
    authorName: string;
  } | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PINNED" | "MY_POSTS">("ALL");
  const [selectedMember, setSelectedMember] = useState<MemberDetailData | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Toggle collapse state for a thread
  const toggleCollapse = (id: string) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fetch latest posts with complete threads
  const fetchPosts = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch("/api/forum");
      if (res.ok) {
        const data = await res.json();
        if (data.posts) {
          setPosts(data.posts);
        }
      }
    } catch (err) {
      console.error("Error fetching forum posts:", err);
    } finally {
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  // Background polling every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts(false);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Submit top-level post
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const formData = new FormData();
    formData.append("content", newContent.trim());

    startTransition(async () => {
      const res = await createForumPostAction(formData);
      if (res.success && res.post) {
        setNewContent("");
        fetchPosts(false);
      }
    });
  };

  // Submit reply (to root post or to any nested reply)
  const handleReplySubmit = (parentId: string) => {
    if (!replyContent.trim()) return;

    const formData = new FormData();
    formData.append("content", replyContent.trim());
    formData.append("parentId", parentId);

    startTransition(async () => {
      const res = await createForumPostAction(formData);
      if (res.success) {
        setReplyContent("");
        setActiveReplyTarget(null);
        // Make sure parent thread is uncollapsed so the new reply is visible
        setCollapsedThreads((prev) => {
          if (prev.has(parentId)) {
            const next = new Set(prev);
            next.delete(parentId);
            return next;
          }
          return prev;
        });
        fetchPosts(false);
      }
    });
  };

  // Delete post or reply
  const handleDeletePost = (postId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই বার্তা বা উত্তরটি ডিলিট করতে চান?")) return;
    startTransition(async () => {
      await deleteForumPostAction(postId);
      fetchPosts(false);
    });
  };

  // Toggle pin
  const handleTogglePin = (postId: string) => {
    startTransition(async () => {
      await togglePinForumPostAction(postId);
      fetchPosts(false);
    });
  };

  // Copy direct post/comment link
  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/forum#post-${postId}`;
    navigator.clipboard.writeText(url);
    setCopiedPostId(postId);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  // Quick Emoji helper for main composer
  const addEmoji = (emoji: string) => {
    setNewContent((prev) => prev + emoji);
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.toLowerCase().trim();
    if (query && !matchesSearchDeep(post, query)) {
      return false;
    }

    if (activeFilter === "PINNED") return post.isPinned;
    if (activeFilter === "MY_POSTS") return matchesUserDeep(post, currentUser.id);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feed Controls Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ফোরামের বার্তা, উত্তর বা বন্ধুদের নামে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters & Refresh Button */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === "ALL" ? "bg-white text-emerald-800 shadow-2xs font-bold" : ""
              }`}
            >
              সব আলোচনা
            </button>
            <button
              onClick={() => setActiveFilter("PINNED")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeFilter === "PINNED" ? "bg-white text-amber-800 shadow-2xs font-bold" : ""
              }`}
            >
              <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
              পিন
            </button>
            <button
              onClick={() => setActiveFilter("MY_POSTS")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === "MY_POSTS" ? "bg-white text-emerald-800 shadow-2xs font-bold" : ""
              }`}
            >
              আমার বার্তা
            </button>
          </div>

          <button
            onClick={() => fetchPosts(true)}
            disabled={isRefreshing}
            className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            title="নতুন বার্তা রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span className="hidden sm:inline">{isRefreshing ? "লোড হচ্ছে..." : "রিফ্রেশ"}</span>
          </button>
        </div>
      </div>

      {/* New Post Box */}
      <form
        onSubmit={handlePostSubmit}
        className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-md space-y-4"
      >
        <div className="flex items-start gap-3">
          {currentUser.thumbnailUrl || currentUser.avatarUrl ? (
            <img
              src={currentUser.thumbnailUrl || currentUser.avatarUrl!}
              alt={currentUser.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-2xs [image-rendering:-webkit-optimize-contrast]"
            />
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-700 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
              {currentUser.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <textarea
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="দাখিল ২০১২ এর বন্ধুদের সাথে শেয়ার করুন... (কোনো স্মৃতি, মতামত, প্রশ্ন বা শুভবার্তা)"
              className="w-full p-3 text-xs sm:text-sm border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 resize-y"
            />

            {/* Quick Emoji Bar & Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 text-base">
                {["❤️", "👍", "🤲", "🎉", "📢", "🤝"].map((emo) => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => addEmoji(emo)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition hover:scale-110 active:scale-95"
                  >
                    {emo}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  {toBengaliNumber(newContent.length)} / ৩০০০
                </span>
                <button
                  type="submit"
                  disabled={isPending || !newContent.trim()}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isPending ? "পাঠানো হচ্ছে..." : "বার্তা পাঠান"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Posts Stream */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">
              {searchQuery ? "কোনো বার্তা খুঁজে পাওয়া যায়নি।" : "এখনো কোনো আলোচনা শুরু হয়নি!"}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery
                ? "অন্য শব্দ দিয়ে অনুসন্ধান করুন অথবা ফিল্টার পরিবর্তন করুন।"
                : "উপরে প্রথম বার্তাটি লিখে আমাদের দাখিল ২০১২ ব্যাচের আড্ডা ও আলোচনা শুরু করুন!"}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isRootReplyActive = activeReplyTarget?.id === post.id;
            const isRootCollapsed = collapsedThreads.has(post.id);
            const totalThreadReplies = countAllReplies(post);

            return (
              <div
                key={post.id}
                id={`post-${post.id}`}
                className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                  post.isPinned ? "border-amber-300 ring-1 ring-amber-200/60" : "border-slate-200/90"
                }`}
              >
                {/* Pinned Top Bar */}
                {post.isPinned && (
                  <div className="bg-amber-50 px-5 py-1.5 border-b border-amber-200/60 flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                    <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />
                    <span>গুরুত্বপূর্ণ পিন করা বার্তা</span>
                  </div>
                )}

                {/* Post Header & Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Author Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        onClick={() => setSelectedMember(post.author)}
                        className="cursor-pointer group relative shrink-0"
                        title="প্রোফাইল দেখুন"
                      >
                        {post.author.thumbnailUrl || post.author.avatarUrl ? (
                          <img
                            src={post.author.thumbnailUrl || post.author.avatarUrl!}
                            alt={post.author.name}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 group-hover:scale-105 transition [image-rendering:-webkit-optimize-contrast]"
                          />
                        ) : (
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-white font-bold text-base flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-105 transition">
                            {post.author.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            onClick={() => setSelectedMember(post.author)}
                            className="font-black text-slate-900 text-sm sm:text-base cursor-pointer hover:text-emerald-700 transition truncate"
                          >
                            {post.author.name}
                          </h4>

                          {/* Role & Category Badges */}
                          {post.author.userType === "TEACHER" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              <GraduationCap className="w-2.5 h-2.5 text-amber-700" /> শ্রদ্ধেয় শিক্ষক
                            </span>
                          ) : post.author.userType === "WELL_WISHER" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                              <HeartHandshake className="w-2.5 h-2.5 text-teal-700" /> শুভাকাঙ্ক্ষী
                            </span>
                          ) : post.author.role === "SUPER_ADMIN" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                              <Shield className="w-2.5 h-2.5 text-purple-700" /> সুপার অ্যাডমিন
                            </span>
                          ) : post.author.role === "FUND_MANAGER" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <Shield className="w-2.5 h-2.5 text-emerald-700" /> তহবিল ব্যবস্থাপক
                            </span>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span>{formatTimeAgo(post.createdAt)}</span>
                          {post.author.studentGroup && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600">
                                {post.author.studentGroup === "SCIENCE" ? "বিজ্ঞান" : "মানবিক"}
                              </span>
                            </>
                          )}
                          {post.author.classRoll && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-emerald-700 font-semibold">
                                রোল: #{post.author.classRoll}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions (Pin, Delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {currentUser.role === "SUPER_ADMIN" && (
                        <button
                          onClick={() => handleTogglePin(post.id)}
                          disabled={isPending}
                          className={`p-1.5 rounded-lg transition ${
                            post.isPinned
                              ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                          title={post.isPinned ? "আনপিন করুন" : "বার্তা পিন করুন"}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                      )}

                      {(currentUser.id === post.author.id || currentUser.role === "SUPER_ADMIN") && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={isPending}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="বার্তা ডিলিট করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words pl-1">
                    {post.content}
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                      {/* Main Reply Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isRootReplyActive) {
                            setActiveReplyTarget(null);
                            setReplyContent("");
                          } else {
                            setActiveReplyTarget({ id: post.id, authorName: post.author.name });
                            setReplyContent(`@${post.author.name} `);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                          isRootReplyActive
                            ? "bg-emerald-100 text-emerald-900"
                            : "hover:bg-emerald-50 hover:text-emerald-800"
                        }`}
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          উত্তর দিন {totalThreadReplies > 0 ? `(${toBengaliNumber(totalThreadReplies)})` : ""}
                        </span>
                      </button>

                      {/* Collapse / Expand entire replies thread */}
                      {totalThreadReplies > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleCollapse(post.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl transition"
                        >
                          {isRootCollapsed ? (
                            <>
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{toBengaliNumber(totalThreadReplies)}টি উত্তর খুলুন</span>
                            </>
                          ) : (
                            <>
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              <span>উত্তরগুলো বন্ধ করুন</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(post.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition text-[11px]"
                    >
                      {copiedPostId === post.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">লিংক কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3" />
                          <span>লিংক কপি</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Inline Composer directly under the root post */}
                  {isRootReplyActive && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <MessageCircleReply className="w-4 h-4 text-emerald-700" />
                            <span>@{post.author.name}-এর পোস্টে উত্তর দিন</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyTarget(null);
                              setReplyContent("");
                            }}
                            className="p-1 hover:bg-emerald-200/60 rounded-full text-slate-600 hover:text-slate-900"
                            title="বাতিল করুন"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          autoFocus
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`@${post.author.name}-কে উত্তর লিখুন...`}
                          className="w-full p-2.5 text-xs sm:text-sm border border-emerald-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                        />

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-sm">
                            {["❤️", "👍", "🤲", "🎉", "🤝"].map((emo) => (
                              <button
                                key={emo}
                                type="button"
                                onClick={() => setReplyContent((prev) => prev + emo)}
                                className="p-1 hover:bg-emerald-100 rounded-md transition hover:scale-110 active:scale-95"
                              >
                                {emo}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReplyTarget(null);
                                setReplyContent("");
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition"
                            >
                              বাতিল
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReplySubmit(post.id)}
                              disabled={isPending || !replyContent.trim()}
                              className="px-4 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-xs disabled:opacity-50 flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              {isPending ? "পাঠানো হচ্ছে..." : "উত্তর দিন"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-Layer Threaded Replies Stream */}
                  {!isRootCollapsed && post.replies && post.replies.length > 0 && (
                    <div className="space-y-3 pt-3">
                      {post.replies.map((reply) => (
                        <ThreadItem
                          key={reply.id}
                          item={reply}
                          depth={1}
                          rootPostId={post.id}
                          currentUser={currentUser}
                          activeReplyTarget={activeReplyTarget}
                          setActiveReplyTarget={setActiveReplyTarget}
                          replyContent={replyContent}
                          setReplyContent={setReplyContent}
                          onReplySubmit={handleReplySubmit}
                          onDelete={handleDeletePost}
                          onSelectMember={setSelectedMember}
                          onCopyLink={handleCopyLink}
                          copiedPostId={copiedPostId}
                          isPending={isPending}
                          collapsedThreads={collapsedThreads}
                          toggleCollapse={toggleCollapse}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Member Profile Detail Modal on Click */}
      <MemberDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}
