"use client";

import { useState, useTransition } from "react";
import { toBengaliNumber, formatBengaliDate } from "@/lib/utils";
import { Role } from "@prisma/client";
import {
  createMemberAction,
  createOfflineMemberAction,
  updateMemberDetailsAction,
  updateMemberRoleAction,
  toggleMemberActiveAction,
  mergeMembersAction,
} from "@/actions/member-actions";
import { FileUploader } from "@/components/ui/file-uploader";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Droplet,
  Briefcase,
  Edit2,
  Lock,
  MapPin,
  HeartHandshake,
  GraduationCap,
  Hash,
  School,
  ArrowRightLeft,
  UserCheck,
} from "lucide-react";

export interface MemberData {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  avatarUrl: string | null;
  thumbnailUrl?: string | null;
  role: Role;
  userType?: string;
  isActive: boolean;
  isClaimed?: boolean;
  bloodGroup: string | null;
  studentGroup?: string | null;
  classRoll?: string | null;
  classroom?: string | null;
  occupation: string | null;
  workplace: string | null;
  presentAddress: string | null;
  permanentAddress: string | null;
  bio: string | null;
  createdAt: Date;
  managedFunds: { fund: { title: string } }[];
  _count: { commitments: number; contributions: number };
}

interface FundOption {
  id: string;
  title: string;
}

export function MembersManagerClient({
  members,
  activeFunds,
  currentUserId,
}: {
  members: MemberData[];
  activeFunds: FundOption[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterUserType, setFilterUserType] = useState<string>("ALL");
  const [filterSection, setFilterSection] = useState<string>("ALL");
  const [filterAccountType, setFilterAccountType] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddOfflineModalOpen, setIsAddOfflineModalOpen] = useState(false);
  const [mergingSource, setMergingSource] = useState<MemberData | null>(null);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>("");
  const [editingMember, setEditingMember] = useState<MemberData | null>(null);
  const [addAvatarUrl, setAddAvatarUrl] = useState("");
  const [addThumbnailUrl, setAddThumbnailUrl] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filtered = members.filter((m) => {
    const query = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(query) ||
      m.phone.includes(query) ||
      (m.email && m.email.toLowerCase().includes(query)) ||
      (m.occupation && m.occupation.toLowerCase().includes(query)) ||
      (m.presentAddress && m.presentAddress.toLowerCase().includes(query)) ||
      (m.classRoll && m.classRoll.toLowerCase().includes(query)) ||
      (m.studentGroup && m.studentGroup.toLowerCase().includes(query)) ||
      (m.classroom && m.classroom.toLowerCase().includes(query));

    const matchesRole = filterRole === "ALL" || m.role === filterRole;
    const matchesUserType =
      filterUserType === "ALL" || (m.userType || "BATCH_MEMBER") === filterUserType;
    const matchesSection = filterSection === "ALL" || m.studentGroup === filterSection;

    const isOffline = m.phone.startsWith("offline_") || m.isClaimed === false;
    const matchesAccountType =
      filterAccountType === "ALL" ||
      (filterAccountType === "OFFLINE" && isOffline) ||
      (filterAccountType === "REGISTERED" && !isOffline);

    return matchesSearch && matchesRole && matchesUserType && matchesSection && matchesAccountType;
  });

  const handleRoleChange = (userId: string, newRole: Role) => {
    startTransition(async () => {
      const res = await updateMemberRoleAction(userId, newRole);
      if (res.success) {
        setFeedback({ type: "success", message: "সদস্যের ভূমিকা (Role) সফলভাবে পরিবর্তন করা হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "ভূমিকা পরিবর্তন ব্যর্থ।" });
      }
    });
  };

  const handleToggleActive = (userId: string, currentActive: boolean) => {
    if (!confirm(`আপনি কি এই অ্যাকাউন্টটি ${currentActive ? "স্থগিত" : "সক্রিয়"} করতে চান?`)) return;
    startTransition(async () => {
      const res = await toggleMemberActiveAction(userId, !currentActive);
      if (res.success) {
        setFeedback({ type: "success", message: "সদস্য স্ট্যাটাস পরিবর্তিত হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await createMemberAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "নতুন সদস্য সফলভাবে সিস্টেমে যুক্ত করা হয়েছে!" });
        setIsAddModalOpen(false);
      } else {
        setFeedback({ type: "error", message: res.error || "সদস্য তৈরিতে ত্রুটি ঘটেছে।" });
      }
    });
  };

  const handleCreateOfflineSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await createOfflineMemberAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "নতুন অফলাইন সদস্য সফলভাবে তালিকায় যুক্ত হয়েছে!" });
        setIsAddOfflineModalOpen(false);
        window.location.reload();
      } else {
        setFeedback({ type: "error", message: res.error || "যুক্ত করতে ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleMergeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergingSource || !selectedTargetUserId) return;
    const targetMember = members.find((m) => m.id === selectedTargetUserId);
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${mergingSource.name}"-এর সকল চাঁদা ও ওয়াদা "${targetMember?.name}"-এর অ্যাকাউন্টে মার্জ করতে চান? এই প্রক্রিয়াটি অপরিবর্তনীয়।`)) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await mergeMembersAction(mergingSource.id, selectedTargetUserId);
      if (res.success) {
        setFeedback({ type: "success", message: "অ্যাকাউন্ট সফলভাবে মার্জ সম্পন্ন হয়েছে!" });
        setMergingSource(null);
        setSelectedTargetUserId("");
        window.location.reload();
      } else {
        setFeedback({ type: "error", message: res.error || "মার্জ ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await updateMemberDetailsAction(editingMember.id, formData);
      if (res.success) {
        setFeedback({ type: "success", message: "সদস্যের তথ্য সফলভাবে হালনাগাদ করা হয়েছে!" });
        setEditingMember(null);
      } else {
        setFeedback({ type: "error", message: res.error || "তথ্য হালনাগাদ ব্যর্থ হয়েছে।" });
      }
    });
  };

  return (
    <div className="space-y-6">
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

      {/* Header & Add User Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            সদস্য ডিরেক্টরি ও ভূমিকা নির্ধারণ (RBAC)
          </h1>
          <p className="text-xs text-slate-500">
            সুপার অ্যাডমিন কর্তৃক সদস্য যোগ, বিস্তারিত তথ্য সম্পাদনা, রোল এবং অ্যাকাউন্ট নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddOfflineModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" /> + অফলাইন সদস্য এন্ট্রি
          </button>
          <button
            onClick={() => {
              setAddAvatarUrl("");
              setAddThumbnailUrl("");
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" /> নতুন নিবন্ধিত সদস্য
          </button>
          <div className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            মোট সদস্য: {toBengaliNumber(members.length)} জন
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম, রোল, মোবাইল, ইমেইল বা পেশা দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterAccountType}
            onChange={(e) => setFilterAccountType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-amber-50 text-amber-900 font-bold border border-amber-300 rounded-lg"
          >
            <option value="ALL">সকল অ্যাকাউন্ট ({members.length})</option>
            <option value="REGISTERED">শুধুমাত্র নিবন্ধিত একাউন্ট</option>
            <option value="OFFLINE">শুধুমাত্র অফলাইন সদস্য</option>
          </select>

          <select
            value={filterUserType}
            onChange={(e) => setFilterUserType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
          >
            <option value="ALL">সকল ক্যাটাগরি (পরিচয়)</option>
            <option value="BATCH_MEMBER">দাখিল ২০১২ ব্যাচমেট</option>
            <option value="TEACHER">সম্মানিত শিক্ষকবৃন্দ</option>
            <option value="WELL_WISHER">শুভাকাঙ্ক্ষী ও সহযোগী</option>
          </select>

          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
          >
            <option value="ALL">সকল বিভাগ (বিজ্ঞান/মানবিক)</option>
            <option value="SCIENCE">বিজ্ঞান (Science)</option>
            <option value="ARTS">মানবিক (Arts)</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
          >
            <option value="ALL">সকল রোল / ভূমিকা</option>
            <option value="SUPER_ADMIN">সুপার অ্যাডমিন</option>
            <option value="FUND_MANAGER">তহবিল ব্যবস্থাপক</option>
            <option value="MEMBER">সাধারণ ব্যাচমেট</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">সদস্যের নাম ও রক্ত</th>
                <th className="py-3 px-3">যোগাযোগ (মোবাইল ও ইমেইল)</th>
                <th className="py-3 px-3">পেশা ও কর্মস্থল</th>
                <th className="py-3 px-3">বর্তমান অবস্থান</th>
                <th className="py-3 px-3">ভূমিকা / রোল</th>
                <th className="py-3 px-4 text-right">অ্যাকশন ও সম্পাদনা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {m.thumbnailUrl || m.avatarUrl ? (
                        <img
                          src={m.thumbnailUrl || m.avatarUrl!}
                          alt={m.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs [image-rendering:-webkit-optimize-contrast]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{m.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {m.phone.startsWith("offline_") && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              অফলাইন সদস্য
                            </span>
                          )}
                          {m.userType === "TEACHER" ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              সম্মানিত শিক্ষক
                            </span>
                          ) : m.userType === "WELL_WISHER" ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                              শুভাকাঙ্ক্ষী
                            </span>
                          ) : null}
                          {m.bloodGroup && (
                            <span className="text-[10px] text-red-600 font-bold inline-flex items-center gap-0.5">
                              <Droplet className="w-2.5 h-2.5 fill-red-600" /> {m.bloodGroup}
                            </span>
                          )}
                          {m.studentGroup && (
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              m.studentGroup === "SCIENCE"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {m.studentGroup === "SCIENCE" ? "বিজ্ঞান" : "মানবিক"}
                            </span>
                          )}
                          {m.classRoll && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-mono border border-slate-200">
                              রোল: {m.classRoll}
                            </span>
                          )}
                          {m.classroom && (
                            <span className="text-[10px] text-slate-500">
                              ({m.classroom})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {m.phone.startsWith("offline_") ? (
                      <span className="text-[11px] font-sans font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block">
                        নম্বর যুক্ত নেই
                      </span>
                    ) : (
                      <p className="font-mono text-slate-800 font-semibold">{m.phone}</p>
                    )}
                    {m.email ? (
                      <a
                        href={`mailto:${m.email}`}
                        className="font-mono text-emerald-700 hover:underline text-[11px] block truncate max-w-[170px]"
                        title={m.email}
                      >
                        {m.email}
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">ইমেইল নেই</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-slate-700">
                    <p className="font-medium">{m.occupation || "—"}</p>
                    {m.workplace && <p className="text-[11px] text-slate-400">{m.workplace}</p>}
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    <p>{m.presentAddress || "—"}</p>
                  </td>

                  <td className="py-3 px-3">
                    <select
                      value={m.role}
                      disabled={isPending || m.id === currentUserId}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded-md font-semibold bg-white disabled:opacity-50"
                    >
                      <option value="MEMBER">MEMBER (সাধারণ সদস্য)</option>
                      <option value="FUND_MANAGER">FUND_MANAGER (তহবিল ব্যবস্থাপক)</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN (সুপার অ্যাডমিন)</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {m.phone.startsWith("offline_") && (
                        <button
                          onClick={() => {
                            setMergingSource(m);
                            setSelectedTargetUserId("");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition border border-amber-300 shadow-2xs"
                          title="নিবন্ধিত অ্যাকাউন্টের সাথে মার্জ করুন"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-amber-700" /> মার্জ
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingMember(m);
                          setEditAvatarUrl(m.avatarUrl || "");
                          setEditThumbnailUrl(m.thumbnailUrl || "");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                        title="সদস্য তথ্য সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-700" /> সম্পাদনা
                      </button>

                      <button
                        onClick={() => handleToggleActive(m.id, m.isActive)}
                        disabled={isPending || m.id === currentUserId}
                        className={`px-2 py-1 text-[11px] font-bold rounded-lg transition disabled:opacity-50 ${
                          m.isActive
                            ? "bg-emerald-50 text-emerald-800 hover:bg-amber-100 hover:text-amber-900 border border-emerald-200"
                            : "bg-red-50 text-red-800 hover:bg-emerald-100 hover:text-emerald-900 border border-red-200"
                        }`}
                      >
                        {m.isActive ? "সক্রিয়" : "স্থগিত"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New Member / User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    নতুন সদস্য যুক্ত করুন
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    দাখিল ২০১২ ব্যাচে নতুন সহপাঠী সরাসরি অন্তর্ভুক্তি
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পুরো নাম *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="উদা: মাওলানা হাফিজুর রহমান"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর * (লগইন ইউজারনেম)
                  </label>
                  <input
                    name="phone"
                    required
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্যাটাগরি / পরিচয় *
                  </label>
                  <select
                    name="userType"
                    defaultValue="BATCH_MEMBER"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="BATCH_MEMBER">দাখিল ২০১২ ব্যাচমেট</option>
                    <option value="TEACHER">সম্মানিত শিক্ষক / উস্তাদ</option>
                    <option value="WELL_WISHER">শুভাকাঙ্ক্ষী ও সহযোগী</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ইমেইল ঠিকানা (ঐচ্ছিক)
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ভূমিকা / রোল
                  </label>
                  <select
                    name="role"
                    defaultValue="MEMBER"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="MEMBER">MEMBER (সাধারণ সদস্য)</option>
                    <option value="FUND_MANAGER">FUND_MANAGER (তহবিল ব্যবস্থাপক)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (সুপার অ্যাডমিন)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    লগইন পাসওয়ার্ড
                  </label>
                  <input
                    name="password"
                    type="text"
                    defaultValue="Password123!"
                    placeholder="Password123!"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">ডিফল্ট: Password123!</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রক্তের গ্রুপ
                  </label>
                  <select
                    name="bloodGroup"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
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

              {/* মাদ্রাসার তথ্য (ঐচ্ছিক) */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  মাদ্রাসার তথ্য — দাখিল ২০১২ (ঐচ্ছিক)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      বিভাগ / গ্রুপ
                    </label>
                    <select
                      name="studentGroup"
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">নির্বাচন করুন (ঐচ্ছিক)</option>
                      <option value="SCIENCE">বিজ্ঞান (Science)</option>
                      <option value="ARTS">মানবিক (Arts)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      ক্লাস রোল
                    </label>
                    <input
                      name="classRoll"
                      type="text"
                      placeholder="উদা: ১৫ বা 15"
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      শাখা / রুম
                    </label>
                    <input
                      name="classroom"
                      type="text"
                      placeholder="উদা: ক শাখা"
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বর্তমান পেশা
                  </label>
                  <input
                    name="occupation"
                    placeholder="উদা: সফটওয়্যার ইঞ্জিনিয়ার, শিক্ষক, ব্যাংকার"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    কর্মস্থল / প্রতিষ্ঠান
                  </label>
                  <input
                    name="workplace"
                    placeholder="উদা: খুলনা মেডিকেল কলেজ, ঢাকা ব্যাংক"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বর্তমান ঠিকানা
                  </label>
                  <input
                    name="presentAddress"
                    placeholder="উদা: সোনাডাঙ্গা, খুলনা"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    স্থায়ী ঠিকানা
                  </label>
                  <input
                    name="permanentAddress"
                    placeholder="উদা: রূপসা, খুলনা"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Optional Initial Commitment */}
              {activeFunds.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" /> প্রাথমিক মাসিক অঙ্গীকার (ঐচ্ছিক)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      name="initialFundId"
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">তহবিল নির্বাচন (ঐচ্ছিক)</option>
                      {activeFunds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title}
                        </option>
                      ))}
                    </select>

                    <input
                      name="initialCommitment"
                      type="number"
                      placeholder="টাকার পরিমাণ (উদা: 500)"
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold text-emerald-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সংক্ষিপ্ত বায়ো / স্মৃতি
                </label>
                <textarea
                  name="bio"
                  rows={2}
                  placeholder="সদস্যের সংক্ষিপ্ত বিবরণ..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <FileUploader
                  folder="avatars"
                  label="সদস্যের প্রোফাইল ছবি (ঐচ্ছিক)"
                  onUploadComplete={(url, thumb) => {
                    setAddAvatarUrl(url);
                    setAddThumbnailUrl(thumb || url);
                  }}
                  initialUrl={addAvatarUrl}
                  accept="image/*"
                />
                <input type="hidden" name="avatarUrl" value={addAvatarUrl} />
                <input type="hidden" name="thumbnailUrl" value={addThumbnailUrl} />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "যুক্ত হচ্ছে..." : "সদস্য যুক্ত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Member */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    সদস্য তথ্য সম্পাদনা
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingMember.name} • {editingMember.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পুরো নাম *
                  </label>
                  <input
                    name="name"
                    defaultValue={editingMember.name}
                    required
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    name="phone"
                    defaultValue={editingMember.phone}
                    required
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্যাটাগরি / পরিচয় *
                  </label>
                  <select
                    name="userType"
                    defaultValue={editingMember.userType || "BATCH_MEMBER"}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="BATCH_MEMBER">দাখিল ২০১২ ব্যাচমেট</option>
                    <option value="TEACHER">সম্মানিত শিক্ষক / উস্তাদ</option>
                    <option value="WELL_WISHER">শুভাকাঙ্ক্ষী ও সহযোগী</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ইমেইল ঠিকানা
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingMember.email || ""}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ভূমিকা / রোল
                  </label>
                  <select
                    name="role"
                    defaultValue={editingMember.role}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="MEMBER">MEMBER (সাধারণ সদস্য)</option>
                    <option value="FUND_MANAGER">FUND_MANAGER (তহবিল ব্যবস্থাপক)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (সুপার অ্যাডমিন)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    নতুন পাসওয়ার্ড (পরিবর্তন করতে চাইলে লিখুন)
                  </label>
                  <input
                    name="newPassword"
                    type="text"
                    placeholder="খালি রাখলে পাসওয়ার্ড অপরিবর্তিত থাকবে"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রক্তের গ্রুপ
                  </label>
                  <select
                    name="bloodGroup"
                    defaultValue={editingMember.bloodGroup || ""}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
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

              {/* মাদ্রাসার তথ্য (ঐচ্ছিক) */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  মাদ্রাসার তথ্য — দাখিল ২০১২ (ঐচ্ছিক)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      বিভাগ / গ্রুপ
                    </label>
                    <select
                      name="studentGroup"
                      defaultValue={editingMember.studentGroup || ""}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">নির্বাচন করুন (ঐচ্ছিক)</option>
                      <option value="SCIENCE">বিজ্ঞান (Science)</option>
                      <option value="ARTS">মানবিক (Arts)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      ক্লাস রোল
                    </label>
                    <input
                      name="classRoll"
                      defaultValue={editingMember.classRoll || ""}
                      type="text"
                      placeholder="উদা: ১৫ বা 15"
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      শাখা / রুম
                    </label>
                    <input
                      name="classroom"
                      defaultValue={editingMember.classroom || ""}
                      type="text"
                      placeholder="উদা: ক শাখা"
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেশা
                  </label>
                  <input
                    name="occupation"
                    defaultValue={editingMember.occupation || ""}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    কর্মস্থল
                  </label>
                  <input
                    name="workplace"
                    defaultValue={editingMember.workplace || ""}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বর্তমান অবস্থান
                  </label>
                  <input
                    name="presentAddress"
                    defaultValue={editingMember.presentAddress || ""}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    স্থায়ী ঠিকানা
                  </label>
                  <input
                    name="permanentAddress"
                    defaultValue={editingMember.permanentAddress || ""}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সংক্ষিপ্ত বায়ো
                </label>
                <textarea
                  name="bio"
                  rows={2}
                  defaultValue={editingMember.bio || ""}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <FileUploader
                  folder="avatars"
                  label="প্রোফাইল ছবি পরিবর্তন / আপলোড"
                  onUploadComplete={(url, thumb) => {
                    setEditAvatarUrl(url);
                    setEditThumbnailUrl(thumb || url);
                  }}
                  initialUrl={editAvatarUrl}
                  accept="image/*"
                />
                <input type="hidden" name="avatarUrl" value={editAvatarUrl} />
                <input type="hidden" name="thumbnailUrl" value={editThumbnailUrl} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_isActive"
                  name="isActive"
                  value="true"
                  defaultChecked={editingMember.isActive}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
                <label htmlFor="edit_isActive" className="text-xs font-semibold text-slate-800">
                  অ্যাকাউন্ট সক্রিয় রাখুন (Active)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "সংরক্ষণ হচ্ছে..." : "হালনাগাদ সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD OFFLINE MEMBER MODAL */}
      {isAddOfflineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    অফলাইন সদস্য এন্ট্রি করুন
                  </h3>
                  <p className="text-xs text-slate-500">
                    মোবাইল নম্বর ছাড়াই নাম ও প্রাথমিক ওয়াদা দিয়ে সদস্য তালিকায় যুক্ত করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOfflineModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOfflineSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সদস্যের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="যেমন: মুহাম্মাদ খালিদ বিন সিদ্দিক"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাটাগরি / পরিচয়
                  </label>
                  <select
                    name="userType"
                    defaultValue="BATCH_MEMBER"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="BATCH_MEMBER">দাখিল ২০১২ ব্যাচমেট</option>
                    <option value="TEACHER">সম্মানিত শিক্ষক</option>
                    <option value="WELL_WISHER">শুভাকাঙ্ক্ষী / শুভানুধ্যায়ী</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    প্রাথমিক ওয়াদা (টাকা)
                  </label>
                  <input
                    type="number"
                    name="initialCommitment"
                    placeholder="যেমন: ১০০ বা ২০০"
                    min="0"
                    step="50"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {activeFunds.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    তহবিল নির্বাচন
                  </label>
                  <select
                    name="initialFundId"
                    defaultValue={activeFunds[0]?.id}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {activeFunds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নোট বা অতিরিক্ত তথ্য (ঐচ্ছিক)
                </label>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="যেমন: পরিচিত বন্ধু, ভবিষ্যতে অ্যাকাউন্ট খুললে মার্জ করা হবে"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                💡 এই সদস্যের জন্য একটি অফলাইন প্লেসহোল্ডার তৈরি হবে। স্প্রেডশিট লেজার থেকে সরাসরি তার প্রতি মাসের চাঁদা ইনপুট দেওয়া যাবে। পরবর্তীতে তিনি রেজিস্টার করলে এক ক্লিকে মার্জ করতে পারবেন।
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOfflineModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isPending ? "যোগ হচ্ছে..." : "অফলাইন সদস্য যোগ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERGE MEMBER MODAL */}
      {mergingSource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    অ্যাকাউন্ট মার্জ / স্থানান্তর
                  </h3>
                  <p className="text-xs text-slate-500">
                    অফলাইন সদস্যের সকল জমা ও রেকর্ড নিবন্ধিত অ্যাকাউন্টে যুক্ত করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMergingSource(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMergeSubmit} className="space-y-4">
              {/* Source Info */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  উৎস (অফলাইন সদস্য):
                </span>
                <p className="text-sm font-black text-slate-900">{mergingSource.name}</p>
                <p className="text-xs text-slate-500">
                  জমাকৃত চাঁদা এন্ট্রি: {toBengaliNumber(mergingSource._count.contributions)}টি •
                  ওয়াদা: {toBengaliNumber(mergingSource._count.commitments)}টি
                </p>
              </div>

              {/* Target Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  গন্তব্য অ্যাকাউন্ট (কার সাথে মার্জ করবেন?) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedTargetUserId}
                  onChange={(e) => setSelectedTargetUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">নিবন্ধিত সদস্য নির্বাচন করুন...</option>
                  {members
                    .filter((m) => !m.phone.startsWith("offline_") && m.id !== mergingSource.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.phone}) {m.classRoll ? `- রোল #${m.classRoll}` : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  মার্জ করার পর কী ঘটবে:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                  <li>এই অফলাইন সদস্যের সকল মাসের জমাকৃত চাঁদা নির্বাচিত মূল অ্যাকাউন্টে চলে যাবে।</li>
                  <li>সদস্যের মাসিক ওয়াদা/প্রতিশ্রুতিটি নির্বাচিত অ্যাকাউন্টে স্থানান্তর হবে।</li>
                  <li>অফলাইন প্লেসহোল্ডার প্রোফাইলটি মুছে যাবে।</li>
                  <li>ঐ সদস্য তার অ্যাকাউন্টে লগইন করলেই সকল পূর্বের ডিজিটাল রিসিট ও জমা দেখতে পাবেন।</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMergingSource(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedTargetUserId}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {isPending ? "মার্জ হচ্ছে..." : "মার্জ নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
