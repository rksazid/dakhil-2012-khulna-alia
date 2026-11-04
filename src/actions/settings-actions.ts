"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateSiteSettingsAction(formData: FormData) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    const entries = Array.from(formData.entries());
    for (const [key, rawValue] of entries) {
      if (typeof rawValue === "string") {
        await prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: rawValue },
          update: { value: rawValue },
        });
      }
    }

    await logActivity({
      action: "UPDATE_SETTINGS",
      entityType: "SETTINGS",
      performedByUserId: admin.id,
      details: {
        summary: "হোমপেজ ও সাইটের মূল সেটিংস হালনাগাদ করা হয়েছে।",
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err: unknown) {
    console.error("Update site settings error:", err);
    return { success: false, error: "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।" };
  }
}
