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
    let imageUrl = (formData.get("imageUrl") as string)?.trim() || "";
    const imagesRaw = (formData.get("images") as string)?.trim();
    const caption = (formData.get("caption") as string)?.trim() || null;
    const category = (formData.get("category") as string)?.trim() || "স্মৃতিচারণ";
    const eventDate = (formData.get("eventDate") as string)?.trim() || null;
    const googlePhotosUrl = (formData.get("googlePhotosUrl") as string)?.trim() || null;

    let images: string[] = [];
    if (imagesRaw) {
      try {
        const parsed = JSON.parse(imagesRaw);
        if (Array.isArray(parsed)) {
          images = parsed.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
        }
      } catch (e) {
        console.warn("Failed to parse images JSON:", e);
      }
    }

    // If images array is provided but imageUrl is not set, use the first image as cover
    if (!imageUrl && images.length > 0) {
      imageUrl = images[0];
    }

    // Ensure cover image is included in images array if not already present
    if (imageUrl && !images.includes(imageUrl)) {
      images.unshift(imageUrl);
    }

    if (!title) {
      return { success: false, error: "ছবির শিরোনাম বা অ্যালবামের নাম আবশ্যক।" };
    }

    if (!imageUrl && !googlePhotosUrl) {
      return { success: false, error: "অন্তত একটি ছবি আপলোড করুন অথবা গুগল ফটোজে শেয়ারেবল লিংক দিন।" };
    }

    // If only googlePhotosUrl is given without a cover image, provide a pleasant fallback cover
    if (!imageUrl && googlePhotosUrl) {
      imageUrl = "/logo.png";
    }

    const item = await prisma.galleryItem.create({
      data: {
        title,
        imageUrl,
        images,
        caption,
        category,
        eventDate,
        googlePhotosUrl,
      },
    });

    await logActivity({
      action: "CREATE_GALLERY_ALBUM",
      entityType: "GALLERY",
      entityId: item.id,
      performedByUserId: admin.id,
      details: {
        title,
        category,
        eventDate,
        totalImages: images.length,
        hasGooglePhotosUrl: !!googlePhotosUrl,
      },
    });

    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    revalidatePath("/");

    return { success: true, item };
  } catch (err: unknown) {
    console.error("Create gallery item error:", err);
    return { success: false, error: "অ্যালবাম বা ছবি সংরক্ষণ করতে ব্যর্থ হয়েছে।" };
  }
}

export async function updateGalleryItemAction(id: string, formData: FormData) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN, Role.FUND_MANAGER]);

    const title = (formData.get("title") as string)?.trim();
    let imageUrl = (formData.get("imageUrl") as string)?.trim() || "";
    const imagesRaw = (formData.get("images") as string)?.trim();
    const caption = (formData.get("caption") as string)?.trim() || null;
    const category = (formData.get("category") as string)?.trim() || "স্মৃতিচারণ";
    const eventDate = (formData.get("eventDate") as string)?.trim() || null;
    const googlePhotosUrl = (formData.get("googlePhotosUrl") as string)?.trim() || null;

    let images: string[] = [];
    if (imagesRaw) {
      try {
        const parsed = JSON.parse(imagesRaw);
        if (Array.isArray(parsed)) {
          images = parsed.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
        }
      } catch (e) {
        console.warn("Failed to parse images JSON in update:", e);
      }
    }

    if (!imageUrl && images.length > 0) {
      imageUrl = images[0];
    }

    if (imageUrl && !images.includes(imageUrl)) {
      images.unshift(imageUrl);
    }

    if (!title) {
      return { success: false, error: "শিরোনাম আবশ্যক।" };
    }

    if (!imageUrl && !googlePhotosUrl) {
      return { success: false, error: "অন্তত একটি ছবি বা গুগল ফটোজে লিংক থাকতে হবে।" };
    }

    if (!imageUrl && googlePhotosUrl) {
      imageUrl = "/logo.png";
    }

    const item = await prisma.galleryItem.update({
      where: { id },
      data: {
        title,
        imageUrl,
        images,
        caption,
        category,
        eventDate,
        googlePhotosUrl,
      },
    });

    await logActivity({
      action: "UPDATE_GALLERY_ALBUM",
      entityType: "GALLERY",
      entityId: item.id,
      performedByUserId: admin.id,
      details: {
        title,
        category,
        eventDate,
        totalImages: images.length,
        hasGooglePhotosUrl: !!googlePhotosUrl,
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
      return { success: false, error: "অ্যালবামটি খুঁজে পাওয়া যায়নি।" };
    }

    await prisma.galleryItem.delete({
      where: { id },
    });

    await logActivity({
      action: "DELETE_GALLERY_ALBUM",
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
    return { success: false, error: "অ্যালবামটি মুছে ফেলতে ব্যর্থ হয়েছে।" };
  }
}
