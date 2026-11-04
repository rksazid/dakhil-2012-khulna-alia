"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createGalleryItemAction(formData: FormData) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN, Role.FUND_MANAGER]);

    const title = (formData.get("title") as string)?.trim();
    const imageUrl = (formData.get("imageUrl") as string)?.trim();
    const caption = (formData.get("caption") as string)?.trim() || null;
    const category = (formData.get("category") as string)?.trim() || "স্মৃতিচারণ";
    const eventDate = (formData.get("eventDate") as string)?.trim() || null;

    if (!title) {
      return { success: false, error: "ছবির শিরোনাম বা ইভেন্টের নাম আবশ্যক।" };
    }

    if (!imageUrl) {
      return { success: false, error: "অনুগ্রহ করে একটি ছবি আপলোড করুন।" };
    }

    const item = await prisma.galleryItem.create({
      data: {
        title,
        imageUrl,
        caption,
        category,
        eventDate,
      },
    });

    await logActivity({
      action: "CREATE_GALLERY_PHOTO",
      entityType: "GALLERY",
      entityId: item.id,
      performedByUserId: admin.id,
      details: {
        title,
        category,
        eventDate,
        imageUrl,
      },
    });

    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    revalidatePath("/");

    return { success: true, item };
  } catch (err: unknown) {
    console.error("Create gallery item error:", err);
    return { success: false, error: "ছবি সংরক্ষণ করতে ব্যর্থ হয়েছে।" };
  }
}

export async function updateGalleryItemAction(id: string, formData: FormData) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN, Role.FUND_MANAGER]);

    const title = (formData.get("title") as string)?.trim();
    const imageUrl = (formData.get("imageUrl") as string)?.trim();
    const caption = (formData.get("caption") as string)?.trim() || null;
    const category = (formData.get("category") as string)?.trim() || "স্মৃতিচারণ";
    const eventDate = (formData.get("eventDate") as string)?.trim() || null;

    if (!title || !imageUrl) {
      return { success: false, error: "শিরোনাম এবং ছবি উভয়ই আবশ্যক।" };
    }

    const item = await prisma.galleryItem.update({
      where: { id },
      data: {
        title,
        imageUrl,
        caption,
        category,
        eventDate,
      },
    });

    await logActivity({
      action: "UPDATE_GALLERY_PHOTO",
      entityType: "GALLERY",
      entityId: item.id,
      performedByUserId: admin.id,
      details: {
        title,
        category,
        eventDate,
      },
    });

    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    revalidatePath("/");

    return { success: true, item };
  } catch (err: unknown) {
    console.error("Update gallery item error:", err);
    return { success: false, error: "তথ্য আপডেট করতে ব্যর্থ হয়েছে।" };
  }
}

export async function deleteGalleryItemAction(id: string) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN, Role.FUND_MANAGER]);

    const item = await prisma.galleryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return { success: false, error: "ছবিটি খুঁজে পাওয়া যায়নি।" };
    }

    await prisma.galleryItem.delete({
      where: { id },
    });

    await logActivity({
      action: "DELETE_GALLERY_PHOTO",
      entityType: "GALLERY",
      entityId: id,
      performedByUserId: admin.id,
      details: {
        title: item.title,
      },
    });

    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    console.error("Delete gallery item error:", err);
    return { success: false, error: "ছবি মুছে ফেলতে ব্যর্থ হয়েছে।" };
  }
}
