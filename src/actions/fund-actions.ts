"use server";

import prisma from "@/lib/prisma";
import { requireAuth, requireRole, canManageFund } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { deleteFromVercelBlob } from "@/lib/blob";
import { Role, CommitmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createFundAction(formData: FormData) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    const title = (formData.get("title") as string)?.trim();
    const slugRaw = (formData.get("slug") as string)?.trim() || title;
    const slug = slugRaw
      .toLowerCase()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const description = (formData.get("description") as string)?.trim() || null;
    const bannerImageUrl = (formData.get("bannerImageUrl") as string)?.trim() || null;
    const rules = (formData.get("rules") as string)?.trim() || null;
    const targetAmount = parseFloat(formData.get("targetAmount") as string) || null;
    const contactPerson = (formData.get("contactPerson") as string)?.trim() || null;
    const contactPhone = (formData.get("contactPhone") as string)?.trim() || null;
    const bankDetails = (formData.get("bankDetails") as string)?.trim() || null;

    if (!title || !slug) {
      return { success: false, error: "তহবিলের শিরোনাম ও স্লাগ আবশ্যক।" };
    }

    const existing = await prisma.fund.findUnique({ where: { slug } });
    if (existing) {
      return { success: false, error: "এই স্লাগ দিয়ে ইতিমধ্যে একটি তহবিল রয়েছে।" };
    }

    const fund = await prisma.fund.create({
      data: {
        title,
        slug,
        description,
        bannerImageUrl,
        rules,
        targetAmount,
        contactPerson,
        contactPhone,
        bankDetails,
        createdById: admin.id,
      },
    });

    await logActivity({
      action: "CREATE_FUND",
      entityType: "FUND",
      entityId: fund.id,
      fundId: fund.id,
      performedByUserId: admin.id,
      details: {
        title,
        slug,
        targetAmount,
        summary: `নতুন তহবিল "${title}" তৈরি করা হয়েছে।`,
      },
    });

    revalidatePath("/funds");
    revalidatePath("/admin/funds");
    return { success: true, fundId: fund.id, slug: fund.slug };
  } catch (err: unknown) {
    console.error("Create fund error:", err);
    return { success: false, error: "তহবিল তৈরি করতে ব্যর্থ হয়েছে।" };
  }
}

export async function updateFundAction(fundId: string, formData: FormData) {
  try {
    const user = await requireAuth();
    const allowed = await canManageFund(user.id, fundId);
    if (!allowed) {
      return { success: false, error: "এই তহবিল সম্পাদনা করার অনুমতি আপনার নেই।" };
    }

    const oldFund = await prisma.fund.findUnique({ where: { id: fundId } });
    if (!oldFund) {
      return { success: false, error: "তহবিলটি পাওয়া যায়নি।" };
    }

    const title = (formData.get("title") as string)?.trim() || oldFund.title;
    const description = (formData.get("description") as string)?.trim();
    const bannerImageUrl = (formData.get("bannerImageUrl") as string)?.trim();
    const rules = (formData.get("rules") as string)?.trim();
    const targetAmount = formData.get("targetAmount")
      ? parseFloat(formData.get("targetAmount") as string)
      : oldFund.targetAmount;
    const contactPerson = (formData.get("contactPerson") as string)?.trim();
    const contactPhone = (formData.get("contactPhone") as string)?.trim();
    const bankDetails = (formData.get("bankDetails") as string)?.trim();

    const updated = await prisma.fund.update({
      where: { id: fundId },
      data: {
        title,
        description,
        bannerImageUrl,
        rules,
        targetAmount,
        contactPerson,
        contactPhone,
        bankDetails,
      },
    });

    if (oldFund.bannerImageUrl && bannerImageUrl && oldFund.bannerImageUrl !== bannerImageUrl) {
      await deleteFromVercelBlob(oldFund.bannerImageUrl);
    }

    await logActivity({
      action: "EDIT_FUND",
      entityType: "FUND",
      entityId: fundId,
      fundId: fundId,
      performedByUserId: user.id,
      details: {
        before: { title: oldFund.title, targetAmount: oldFund.targetAmount },
        after: { title: updated.title, targetAmount: updated.targetAmount },
        summary: `"${title}" তহবিলের তথ্য হালনাগাদ করা হয়েছে।`,
      },
    });

    revalidatePath(`/funds/${updated.slug}`);
    revalidatePath("/admin/funds");
    return { success: true };
  } catch (err: unknown) {
    console.error("Update fund error:", err);
    return { success: false, error: "তহবিল আপডেট ব্যর্থ হয়েছে।" };
  }
}

export async function toggleFundStatusAction(fundId: string, isActive: boolean) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    const updated = await prisma.fund.update({
      where: { id: fundId },
      data: { isActive },
    });

    await logActivity({
      action: "TOGGLE_FUND_STATUS",
      entityType: "FUND",
      entityId: fundId,
      fundId: fundId,
      performedByUserId: admin.id,
      details: {
        status: isActive ? "ACTIVE" : "INACTIVE",
        summary: `তহবিল "${updated.title}" ${isActive ? "সক্রিয়" : "স্থগিত"} করা হয়েছে।`,
      },
    });

    revalidatePath("/funds");
    revalidatePath("/admin/funds");
    return { success: true };
  } catch (err: unknown) {
    console.error("Toggle fund error:", err);
    return { success: false, error: "তহবিলের স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" };
  }
}

export async function assignFundManagerAction(fundId: string, userId: string) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { success: false, error: "সদস্য পাওয়া যায়নি।" };

    // Update user role to FUND_MANAGER if MEMBER
    if (targetUser.role === Role.MEMBER) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: Role.FUND_MANAGER },
      });
    }

    await prisma.fundManager.upsert({
      where: {
        fundId_userId: { fundId, userId },
      },
      create: { fundId, userId },
      update: {},
    });

    await logActivity({
      action: "ASSIGN_MANAGER",
      entityType: "FUND",
      entityId: fundId,
      fundId,
      performedByUserId: admin.id,
      details: {
        userId,
        userName: targetUser.name,
        summary: `${targetUser.name}-কে তহবিল ব্যবস্থাপক নিযুক্ত করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/funds");
    return { success: true };
  } catch (err: unknown) {
    console.error("Assign manager error:", err);
    return { success: false, error: "ম্যানেজার নিয়োগ ব্যর্থ হয়েছে।" };
  }
}

export async function removeFundManagerAction(fundId: string, userId: string) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    await prisma.fundManager.deleteMany({
      where: { fundId, userId },
    });

    // Check if user has other funds
    const remaining = await prisma.fundManager.count({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (remaining === 0 && user?.role === Role.FUND_MANAGER) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: Role.MEMBER },
      });
    }

    await logActivity({
      action: "REMOVE_MANAGER",
      entityType: "FUND",
      entityId: fundId,
      fundId,
      performedByUserId: admin.id,
      details: {
        userId,
        summary: `তহবিল ব্যবস্থাপক অব্যাহতি প্রদান করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/funds");
    return { success: true };
  } catch (err: unknown) {
    console.error("Remove manager error:", err);
    return { success: false, error: "ম্যানেজার অপসারণ ব্যর্থ হয়েছে।" };
  }
}

export async function createOrUpdateCommitmentAction(
  fundId: string,
  committedAmount: number,
  startMonth: string,
  status: CommitmentStatus = CommitmentStatus.ACTIVE
) {
  try {
    const user = await requireAuth();

    const commitment = await prisma.fundCommitment.upsert({
      where: {
        fundId_userId: { fundId, userId: user.id },
      },
      create: {
        fundId,
        userId: user.id,
        committedAmount,
        startMonth,
        status,
      },
      update: {
        committedAmount,
        startMonth,
        status,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/funds`);
    revalidatePath("/funds", "layout");
    return {
      success: true,
      commitment: {
        id: commitment.id,
        fundId: commitment.fundId,
        committedAmount: Number(commitment.committedAmount),
        startMonth: commitment.startMonth,
        status: commitment.status,
      },
    };
  } catch (err: unknown) {
    console.error("Commitment error:", err);
    return { success: false, error: "অঙ্গীকার সংরক্ষণ ব্যর্থ হয়েছে।" };
  }
}

export async function deleteCommitmentAction(fundId: string) {
  try {
    const user = await requireAuth();

    await prisma.fundCommitment.deleteMany({
      where: {
        fundId,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/funds");
    revalidatePath("/funds", "layout");
    return { success: true };
  } catch (err: unknown) {
    console.error("Delete commitment error:", err);
    return { success: false, error: "প্রতিশ্রুতি বাতিল করতে সমস্যা হয়েছে।" };
  }
}
