"use server";

import prisma from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { Role, CommitmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createMemberAction(formData: FormData) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const rawPassword = (formData.get("password") as string)?.trim();
    const password = rawPassword && rawPassword.length >= 6 ? rawPassword : "Password123!";
    const role = (formData.get("role") as Role) || Role.MEMBER;
    const userType = (formData.get("userType") as string)?.trim() || "BATCH_MEMBER";
    const bloodGroup = (formData.get("bloodGroup") as string)?.trim() || null;
    const studentGroup = (formData.get("studentGroup") as string)?.trim() || null;
    const classRoll = (formData.get("classRoll") as string)?.trim() || null;
    const classroom = (formData.get("classroom") as string)?.trim() || null;
    const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;
    const thumbnailUrl = (formData.get("thumbnailUrl") as string)?.trim() || null;
    const bannerUrl = (formData.get("bannerUrl") as string)?.trim() || null;
    const occupation = (formData.get("occupation") as string)?.trim() || null;
    const workplace = (formData.get("workplace") as string)?.trim() || null;
    const presentAddress = (formData.get("presentAddress") as string)?.trim() || null;
    const permanentAddress = (formData.get("permanentAddress") as string)?.trim() || null;
    const bio = (formData.get("bio") as string)?.trim() || null;
    const initialFundId = (formData.get("initialFundId") as string)?.trim() || null;
    const initialCommitment = parseFloat(formData.get("initialCommitment") as string) || 0;

    if (!name || !phone) {
      return { success: false, error: "সদস্যের নাম এবং মোবাইল নম্বর আবশ্যক।" };
    }

    // Check unique phone
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return { success: false, error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একজন সদস্য নিবন্ধিত আছেন।" };
    }

    // Check unique email
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return { success: false, error: "এই ইমেইল ঠিকানাটি ইতিমধ্যে ব্যবহৃত হচ্ছে।" };
      }
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        passwordHash,
        role,
        userType,
        avatarUrl,
        thumbnailUrl,
        bannerUrl,
        bloodGroup,
        studentGroup,
        classRoll,
        classroom,
        occupation,
        workplace,
        presentAddress,
        permanentAddress,
        bio,
        isActive: true,
      },
    });

    // If initial commitment selected
    if (initialFundId && initialCommitment > 0) {
      await prisma.fundCommitment.create({
        data: {
          fundId: initialFundId,
          userId: newUser.id,
          committedAmount: initialCommitment,
          startMonth: "অক্টোবর-২৬",
          status: CommitmentStatus.ACTIVE,
        },
      });
    }

    await logActivity({
      action: "CREATE_USER",
      entityType: "USER",
      entityId: newUser.id,
      performedByUserId: admin.id,
      details: {
        memberName: name,
        phone,
        role,
        summary: `অ্যাডমিন কর্তৃক নতুন সদস্য "${name}" (${phone}) তৈরি করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/members");
    revalidatePath("/admin/ledger");
    revalidatePath("/members");
    return { success: true, userId: newUser.id };
  } catch (err: unknown) {
    console.error("Create member error:", err);
    return { success: false, error: "সদস্য তৈরি করতে ব্যর্থ হয়েছে।" };
  }
}

export async function updateMemberDetailsAction(userId: string, formData: FormData) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    const oldUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!oldUser) {
      return { success: false, error: "সদস্য খুঁজে পাওয়া যায়নি।" };
    }

    const name = (formData.get("name") as string)?.trim() || oldUser.name;
    const phone = (formData.get("phone") as string)?.trim() || oldUser.phone;
    const email = (formData.get("email") as string)?.trim() || null;
    const role = (formData.get("role") as Role) || oldUser.role;
    const userType = (formData.get("userType") as string)?.trim() || oldUser.userType;
    const bloodGroup = (formData.get("bloodGroup") as string)?.trim() || null;
    const studentGroup = (formData.get("studentGroup") as string)?.trim() || null;
    const classRoll = (formData.get("classRoll") as string)?.trim() || null;
    const classroom = (formData.get("classroom") as string)?.trim() || null;
    const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;
    const thumbnailUrl = (formData.get("thumbnailUrl") as string)?.trim() || null;
    const bannerUrl = (formData.get("bannerUrl") as string)?.trim() || null;
    const occupation = (formData.get("occupation") as string)?.trim() || null;
    const workplace = (formData.get("workplace") as string)?.trim() || null;
    const presentAddress = (formData.get("presentAddress") as string)?.trim() || null;
    const permanentAddress = (formData.get("permanentAddress") as string)?.trim() || null;
    const bio = (formData.get("bio") as string)?.trim() || null;
    const newPassword = (formData.get("newPassword") as string)?.trim();
    const isActive = formData.get("isActive") === "true";

    // Validate phone uniqueness if changed
    if (phone !== oldUser.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone && existingPhone.id !== userId) {
        return { success: false, error: "এই মোবাইল নম্বরটি অন্য একজন সদস্যের অ্যাকাউন্টে রয়েছে।" };
      }
    }

    // Validate email uniqueness if changed
    if (email && email !== oldUser.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail && existingEmail.id !== userId) {
        return { success: false, error: "এই ইমেইলটি অন্য একজন সদস্যের অ্যাকাউন্টে রয়েছে।" };
      }
    }

    // Prepare update data
    const updateData: {
      name: string;
      phone: string;
      email: string | null;
      role: Role;
      userType: string;
      bloodGroup: string | null;
      studentGroup: string | null;
      classRoll: string | null;
      classroom: string | null;
      avatarUrl: string | null;
      thumbnailUrl: string | null;
      bannerUrl: string | null;
      occupation: string | null;
      workplace: string | null;
      presentAddress: string | null;
      permanentAddress: string | null;
      bio: string | null;
      isActive: boolean;
      passwordHash?: string;
    } = {
      name,
      phone,
      email,
      role,
      userType,
      bloodGroup,
      studentGroup,
      classRoll,
      classroom,
      avatarUrl,
      thumbnailUrl,
      bannerUrl,
      occupation,
      workplace,
      presentAddress,
      permanentAddress,
      bio,
      isActive,
    };

    if (newPassword && newPassword.length >= 6) {
      updateData.passwordHash = await hashPassword(newPassword);
    }

    // Prevent removing own super admin status if this admin is editing themselves
    if (oldUser.id === admin.id && role !== Role.SUPER_ADMIN) {
      return { success: false, error: "নিজের সুপার অ্যাডমিন পদবি পরিবর্তন করা যাবে না।" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const beforeDiff: Record<string, unknown> = {};
    const afterDiff: Record<string, unknown> = {};
    if (oldUser.name !== name) { beforeDiff["নাম"] = oldUser.name; afterDiff["নাম"] = name; }
    if (oldUser.phone !== phone) { beforeDiff["মোবাইল"] = oldUser.phone; afterDiff["মোবাইল"] = phone; }
    if (oldUser.email !== email) { beforeDiff["ইমেইল"] = oldUser.email || "—"; afterDiff["ইমেইল"] = email || "—"; }
    if (oldUser.role !== role) { beforeDiff["রোল"] = oldUser.role; afterDiff["রোল"] = role; }
    if (oldUser.bloodGroup !== bloodGroup) { beforeDiff["রক্তের গ্রুপ"] = oldUser.bloodGroup || "—"; afterDiff["রক্তের গ্রুপ"] = bloodGroup || "—"; }
    if (oldUser.studentGroup !== studentGroup) { beforeDiff["বিভাগ"] = oldUser.studentGroup || "—"; afterDiff["বিভাগ"] = studentGroup || "—"; }
    if (oldUser.classRoll !== classRoll) { beforeDiff["ক্লাস রোল"] = oldUser.classRoll || "—"; afterDiff["ক্লাস রোল"] = classRoll || "—"; }
    if (oldUser.classroom !== classroom) { beforeDiff["শাখা"] = oldUser.classroom || "—"; afterDiff["শাখা"] = classroom || "—"; }
    if (oldUser.avatarUrl !== avatarUrl) {
      beforeDiff["প্রোফাইল ছবি"] = oldUser.avatarUrl ? "সংযুক্ত ছিল" : "ছিল না";
      afterDiff["প্রোফাইল ছবি"] = avatarUrl ? "নতুন ছবি আপলোড" : "ছবি সরানো হয়েছে";
    }
    if (oldUser.occupation !== occupation) { beforeDiff["পেশা"] = oldUser.occupation || "—"; afterDiff["পেশা"] = occupation || "—"; }
    if (oldUser.workplace !== workplace) { beforeDiff["কর্মস্থল"] = oldUser.workplace || "—"; afterDiff["কর্মস্থল"] = workplace || "—"; }
    if (oldUser.presentAddress !== presentAddress) { beforeDiff["বর্তমান ঠিকানা"] = oldUser.presentAddress || "—"; afterDiff["বর্তমান ঠিকানা"] = presentAddress || "—"; }

    await logActivity({
      action: "UPDATE_USER_DETAILS",
      entityType: "USER",
      entityId: userId,
      performedByUserId: admin.id,
      details: {
        memberName: name,
        phone,
        role,
        before: Object.keys(beforeDiff).length > 0 ? beforeDiff : undefined,
        after: Object.keys(afterDiff).length > 0 ? afterDiff : undefined,
        summary: `সদস্য "${name}"-এর তথ্য অ্যাডমিন প্যানেল থেকে সফলভাবে হালনাগাদ করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/members");
    revalidatePath("/admin/ledger");
    revalidatePath("/members");
    return { success: true };
  } catch (err: unknown) {
    console.error("Update member details error:", err);
    return { success: false, error: "সদস্য তথ্য আপডেট করতে ব্যর্থ হয়েছে।" };
  }
}

export async function updateMemberRoleAction(userId: string, newRole: Role) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    const oldUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!oldUser) return { success: false, error: "সদস্য পাওয়া যায়নি।" };

    if (oldUser.id === admin.id && newRole !== Role.SUPER_ADMIN) {
      return { success: false, error: "নিজের সুপার অ্যাডমিন পদ পরিবর্তন করা যাবে না।" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    await logActivity({
      action: "UPDATE_USER_ROLE",
      entityType: "USER",
      entityId: userId,
      performedByUserId: admin.id,
      details: {
        memberName: oldUser.name,
        oldRole: oldUser.role,
        newRole,
        before: { "ভূমিকা / পদবি": oldUser.role },
        after: { "ভূমিকা / পদবি": newRole },
        summary: `${oldUser.name}-এর ভূমিকা ${oldUser.role} থেকে ${newRole}-এ পরিবর্তন করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/members");
    revalidatePath("/members");
    return { success: true };
  } catch (err: unknown) {
    console.error("Update member role error:", err);
    return { success: false, error: "ভূমিকা পরিবর্তন ব্যর্থ হয়েছে।" };
  }
}

export async function toggleMemberActiveAction(userId: string, isActive: boolean) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    if (userId === admin.id) {
      return { success: false, error: "নিজের অ্যাকাউন্ট স্থগিত করা যাবে না।" };
    }

    const member = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await logActivity({
      action: "TOGGLE_USER_ACTIVE",
      entityType: "USER",
      entityId: userId,
      performedByUserId: admin.id,
      details: {
        memberName: member.name,
        isActive,
        before: { "অ্যাকাউন্ট স্ট্যাটাস": !isActive ? "সক্রিয়" : "স্থগিত" },
        after: { "অ্যাকাউন্ট স্ট্যাটাস": isActive ? "সক্রিয়" : "স্থগিত" },
        summary: `${member.name}-এর অ্যাকাউন্ট ${isActive ? "সক্রিয়" : "স্থগিত"} করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/members");
    return { success: true };
  } catch (err: unknown) {
    console.error("Toggle member active error:", err);
    return { success: false, error: "সদস্য স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" };
  }
}
