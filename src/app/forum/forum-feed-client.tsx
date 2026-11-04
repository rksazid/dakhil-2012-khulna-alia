"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import {
  MessageSquare,
  Send,
  RefreshCw,
  Pin,
  Trash2,
  CornerDownRight,
  Sparkles,
  Search,
  ExternalLink,
  Share2,
  Check,
  User as UserIcon,
  Shield,
  Heart,
} from "lucide-react";
import {
  createForumPostAction,
  deleteForumPostAction,
  togglePinForumPostAction,
} from "@/actions/forum-actions";
import { MemberDetailModal, MemberDetailData } from "@/components/members/member-detail-modal";
import { toBengaliNumber } from "@/lib/utils";

export interface ForumPostItem {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string | Date;
  author: MemberDetailData;
  replies: Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    author: MemberDetailData;
  }>;
}

interface ForumFeedClientProps {
  initialPosts: ForumPostItem[];
  currentUser: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export function ForumFeedClient({ initialPosts, currentUser }: ForumFeedClientProps) {
  const [posts, setPosts] = useState<ForumPostItem[]>(initialPosts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PINNED" | "MY_POSTS">("ALL");
  const [selectedMember, setSelectedMember] = useState<MemberDetailData | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch latest posts
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

  // Background polling every 12 seconds as requested by the user
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
        // Optimistic append or re-fetch
        fetchPosts(false);
      }
    });
  };

  // Submit reply
  const handleReplySubmit = (parentId: string) => {
    if (!replyContent.trim()) return;

    const formData = new FormData();
    formData.append("content", replyContent.trim());
    formData.append("parentId", parentId);

    startTransition(async () => {
      const res = await createForumPostAction(formData);
      if (res.success) {
        setReplyContent("");
        setActiveReplyId(null);
        fetchPosts(false);
      }
    });
  };

  // Delete post
  const handleDeletePost = (postId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই বার্তাটি ডিলিট করতে চান?")) return;
    startTransition(async () => {
      await deleteForumPostAction(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    });
  };

  // Toggle pin
  const handleTogglePin = (postId: string) => {
    startTransition(async () => {
      await togglePinForumPostAction(postId);
      fetchPosts(false);
    });
  };

  // Copy direct post link
  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/forum#post-${postId}`;
    navigator.clipboard.writeText(url);
    setCopiedPostId(postId);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  // Quick Emoji helper
  const addEmoji = (emoji: string) => {
    setNewContent((prev) => prev + emoji);
  };

  // Relative time helper
  const formatTimeAgo = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "এইমাত্র";
    if (diffSec < 3600) return `${toBengaliNumber(Math.floor(diffSec / 60))} মিনিট আগে`;
    if (diffSec < 86400) return `${toBengaliNumber(Math.floor(diffSec / 3600))} ঘণ্টা আগে`;
    return `${toBengaliNumber(Math.floor(diffSec / 86400))} দিন আগে`;
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      post.content.toLowerCase().includes(query) ||
      post.author.name.toLowerCase().includes(query) ||
      post.replies.some(
        (r) =>
          r.content.toLowerCase().includes(query) ||
          r.author.name.toLowerCase().includes(query)
      );

    if (!matchesSearch) return false;

    if (activeFilter === "PINNED") return post.isPinned;
    if (activeFilter === "MY_POSTS") return post.author.id === currentUser.id;
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
            placeholder="ফোরাম বার্তায় খুঁজুন..."
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
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-2xs"
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
      <div className="space-y-5">
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
          filteredPosts.map((post) => (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                post.isPinned ? "border-amber-300 ring-1 ring-amber-200/60" : "border-slate-200/90"
              }`}
            >
              {/* Pinned Top Bar if pinned */}
              {post.isPinned && (
                <div className="bg-amber-50 px-5 py-1.5 border-b border-amber-200/60 flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                  <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />
                  <span>গুরুত্বপূর্ণ পিন করা বার্তা</span>
                </div>
              )}

              {/* Post Header */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Author Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => setSelectedMember(post.author)}
                      className="cursor-pointer group relative shrink-0"
                      title="প্রোফাইল দেখুন"
                    >
                      {post.author.avatarUrl ? (
                        <img
                          src={post.author.avatarUrl}
                          alt={post.author.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 group-hover:scale-105 transition"
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

                        {/* Badges */}
                        {post.author.role === "SUPER_ADMIN" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                            <Shield className="w-2.5 h-2.5 text-purple-700" /> সুপার অ্যাডমিন
                          </span>
                        ) : post.author.role === "FUND_MANAGER" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
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
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
                  <button
                    onClick={() => {
                      if (activeReplyId === post.id) {
                        setActiveReplyId(null);
                        setReplyContent("");
                      } else {
                        setActiveReplyId(post.id);
                        setReplyContent(`@${post.author.name} `);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-800 transition"
                  >
                    <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      উত্তর দিন {post.replies.length > 0 ? `(${toBengaliNumber(post.replies.length)})` : ""}
                    </span>
                  </button>

                  <button
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

                {/* Nested Replies Section */}
                {post.replies.length > 0 && (
                  <div className="space-y-3 pt-2 pl-4 sm:pl-8 border-l-2 border-emerald-100 ml-2">
                    {post.replies.map((reply) => (
                      <div
                        key={reply.id}
                        id={`post-${reply.id}`}
                        className="bg-slate-50/80 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-2 group/reply"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              onClick={() => setSelectedMember(reply.author)}
                              className="cursor-pointer group relative shrink-0"
                            >
                              {reply.author.avatarUrl ? (
                                <img
                                  src={reply.author.avatarUrl}
                                  alt={reply.author.name}
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                                  {reply.author.name.charAt(0)}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex items-center gap-1.5">
                              <span
                                onClick={() => setSelectedMember(reply.author)}
                                className="font-bold text-slate-900 text-xs cursor-pointer hover:text-emerald-700 transition truncate"
                              >
                                {reply.author.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                • {formatTimeAgo(reply.createdAt)}
                              </span>
                            </div>
                          </div>

                          {(currentUser.id === reply.author.id ||
                            currentUser.role === "SUPER_ADMIN") && (
                            <button
                              onClick={() => handleDeletePost(reply.id)}
                              disabled={isPending}
                              className="opacity-0 group-hover/reply:opacity-100 p-1 text-slate-400 hover:text-red-600 transition"
                              title="মন্তব্য মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="text-slate-800 text-xs whitespace-pre-wrap break-words pl-8 sm:pl-10">
                          {reply.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Reply Composer */}
                {activeReplyId === post.id && (
                  <div className="pt-3 pl-4 sm:pl-8 border-l-2 border-emerald-300 ml-2 space-y-2 animate-in fade-in duration-150">
                    <textarea
                      rows={2}
                      autoFocus
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="আপনার উত্তর লিখুন..."
                      className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyId(null);
                          setReplyContent("");
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReplySubmit(post.id)}
                        disabled={isPending || !replyContent.trim()}
                        className="px-4 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1 shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        {isPending ? "পাঠানো হচ্ছে..." : "উত্তর দিন"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
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
