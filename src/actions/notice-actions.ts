"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { Role, NoticeCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createNoticeAction(formData: FormData) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN, Role.FUND_MANAGER]);

    const title = (formData.get("title") as string)?.trim();
    const slugRaw = (formData.get("slug") as string)?.trim() || title;
    const slug = slugRaw
      .toLowerCase()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const content = (formData.get("content") as string)?.trim();
    const category = (formData.get("category") as NoticeCategory) || NoticeCategory.GENERAL;
    const isPinned = formData.get("isPinned") === "true" || formData.get("isPinned") === "on";
    const isPublished = formData.has("isPublished")
      ? formData.get("isPublished") === "true" || formData.get("isPublished") === "on"
      : true;

    if (!title || !content) {
      return { success: false, error: "নোটিশের শিরোনাম ও বিস্তারিত বিবরণ আবশ্যক।" };
    }

    const uniqueSlug = `${slug}-${Date.now().toString().slice(-4)}`;

    const notice = await prisma.notice.create({
      data: {
        title,
        slug: uniqueSlug,
        content,
        category,
        isPinned,
        isPublished,
        authorId: admin.id,
      },
    });

    await logActivity({
      action: "CREATE_NOTICE",
      entityType: "NOTICE",
      entityId: notice.id,
      performedByUserId: admin.id,
      details: {
        title,
        category,
        summary: `নতুন নোটিশ "${title}" প্রকাশ করা হয়েছে।`,
      },
    });

    revalidatePath("/notices");
    revalidatePath("/admin/notices");
    revalidatePath("/");
    return { success: true, noticeId: notice.id };
  } catch (err: unknown) {
    console.error("Create notice error:", err);
    return { success: false, error: "নোটিশ প্রকাশ করতে ব্যর্থ হয়েছে।" };
  }
}

export async function updateNoticeAction(id: string, formData: FormData) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN, Role.FUND_MANAGER]);

    const title = (formData.get("title") as string)?.trim();
    const content = (formData.get("content") as string)?.trim();
    const category = (formData.get("category") as NoticeCategory) || NoticeCategory.GENERAL;
    const isPinned = formData.get("isPinned") === "true" || formData.get("isPinned") === "on";
    const isPublished = formData.has("isPublished")
      ? formData.get("isPublished") === "true" || formData.get("isPublished") === "on"
      : true;

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        title,
        content,
        category,
        isPinned,
        isPublished,
      },
    });

    await logActivity({
      action: "UPDATE_NOTICE",
      entityType: "NOTICE",
      entityId: notice.id,
      performedByUserId: admin.id,
      details: {
        title,
        category,
        summary: `নোটিশ "${title}" সম্পাদনা করা হয়েছে।`,
      },
    });

    revalidatePath("/notices");
    revalidatePath("/admin/notices");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    console.error("Update notice error:", err);
    return { success: false, error: "নোটিশ আপডেট ব্যর্থ হয়েছে।" };
  }
}

export async function deleteNoticeAction(id: string) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN, Role.FUND_MANAGER]);

    const notice = await prisma.notice.delete({
      where: { id },
    });

    await logActivity({
      action: "DELETE_NOTICE",
      entityType: "NOTICE",
      entityId: id,
      performedByUserId: admin.id,
      details: {
        title: notice.title,
        summary: `নোটিশ "${notice.title}" মুছে ফেলা হয়েছে।`,
      },
    });

    revalidatePath("/notices");
    revalidatePath("/admin/notices");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    console.error("Delete notice error:", err);
    return { success: false, error: "নোটিশ মুছতে ব্যর্থ হয়েছে।" };
  }
}

export async function togglePinNoticeAction(id: string, isPinned: boolean) {
  try {
    await requireRole([Role.SUPER_ADMIN, Role.FUND_MANAGER]);

    await prisma.notice.update({
      where: { id },
      data: { isPinned },
    });

    revalidatePath("/notices");
    revalidatePath("/admin/notices");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    console.error("Toggle pin notice error:", err);
    return { success: false, error: "পিন স্ট্যাটাস পরিবর্তন ব্যর্থ।" };
  }
}

export async function togglePublishNoticeAction(id: string, isPublished: boolean) {
  try {
    await requireRole([Role.SUPER_ADMIN, Role.FUND_MANAGER]);

    await prisma.notice.update({
      where: { id },
      data: { isPublished },
    });

    revalidatePath("/notices");
    revalidatePath("/admin/notices");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    console.error("Toggle publish notice error:", err);
    return { success: false, error: "পাবলিশ স্ট্যাটাস পরিবর্তন ব্যর্থ।" };
  }
}
