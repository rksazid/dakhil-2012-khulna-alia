"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role, NotificationType } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import { revalidatePath } from "next/cache";
import { createNotificationHelper } from "./notification-actions";

export async function createForumPostAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "বার্তা পাঠাতে অনুগ্রহ করে লগইন করুন।" };
    }

    const content = (formData.get("content") as string)?.trim();
    const parentId = (formData.get("parentId") as string)?.trim() || null;

    if (!content || content.length < 2) {
      return { success: false, error: "বার্তায় অন্তত দুটি অক্ষর লিখুন।" };
    }

    if (content.length > 3000) {
      return { success: false, error: "বার্তা সর্বোচ্চ ৩,০০০ অক্ষরের মধ্যে হতে হবে।" };
    }

    let parentPost = null;
    if (parentId) {
      parentPost = await prisma.forumPost.findUnique({
        where: { id: parentId },
        select: { id: true, authorId: true, content: true },
      });
      if (!parentPost) {
        return { success: false, error: "মূল বার্তাটি পাওয়া যায়নি।" };
      }
    }

    const newPost = await prisma.forumPost.create({
      data: {
        content,
        authorId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            thumbnailUrl: true,
            role: true,
            studentGroup: true,
            classRoll: true,
            occupation: true,
          },
        },
      },
    });

    // Notify parent author if someone replied to their post
    if (parentPost && parentPost.authorId !== user.id) {
      const snippet = content.slice(0, 75) + (content.length > 75 ? "..." : "");
      await createNotificationHelper({
        userId: parentPost.authorId,
        title: "আপনার বার্তায় নতুন উত্তর এসেছে",
        message: `${user.name} আপনার ফোরাম বার্তায় উত্তর দিয়েছেন: "${snippet}"`,
        link: `/forum#post-${newPost.id}`,
        type: NotificationType.FORUM_REPLY,
      });
    }

    await logActivity({
      action: parentId ? "FORUM_REPLY" : "FORUM_POST",
      entityType: "FORUM",
      entityId: newPost.id,
      performedByUserId: user.id,
      details: {
        summary: `${user.name} ফোরামে নতুন ${parentId ? "উত্তর" : "বার্তা"} দিয়েছেন।`,
        preview: content.slice(0, 100),
      },
    });

    revalidatePath("/forum");
    return { success: true, post: newPost };
  } catch (err: unknown) {
    console.error("Create forum post error:", err);
    return { success: false, error: "বার্তা পোস্ট করতে ব্যর্থ হয়েছে।" };
  }
}

export async function deleteForumPostAction(postId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "অনুমতি নেই।" };
    }

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return { success: false, error: "পোস্ট পাওয়া যায়নি।" };
    }

    // Only post author or Super Admin can delete
    if (post.authorId !== user.id && user.role !== Role.SUPER_ADMIN) {
      return { success: false, error: "বার্তা ডিলিট করার অনুমতি নেই।" };
    }

    await prisma.forumPost.delete({
      where: { id: postId },
    });

    revalidatePath("/forum");
    return { success: true };
  } catch (err: unknown) {
    console.error("Delete forum post error:", err);
    return { success: false, error: "পোস্ট মুছতে ব্যর্থ হয়েছে।" };
  }
}

export async function togglePinForumPostAction(postId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== Role.SUPER_ADMIN) {
      return { success: false, error: "কেবল সুপার অ্যাডমিন পিন করতে পারেন।" };
    }

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { isPinned: true },
    });

    if (!post) return { success: false, error: "পোস্ট পাওয়া যায়নি।" };

    await prisma.forumPost.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    });

    revalidatePath("/forum");
    return { success: true };
  } catch (err: unknown) {
    console.error("Toggle pin error:", err);
    return { success: false, error: "পিন স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" };
  }
}

