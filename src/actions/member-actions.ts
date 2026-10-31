"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateMemberRoleAction(userId: string, newRole: Role) {
  try {
    const admin = await requireRole([Role.SUPER_ADMIN]);

    const oldUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!oldUser) return { success: false, error: "সদস্য পাওয়া যায়নি।" };

    // Prevent removing last super admin if applicable
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
