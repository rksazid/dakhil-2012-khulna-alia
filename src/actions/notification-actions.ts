"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getMyNotificationsAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false, notifications: [], unreadCount: 0 };

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return { success: true, notifications, unreadCount };
}

export async function markNotificationAsReadAction(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsAsReadAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createNotificationHelper({
  userId,
  title,
  message,
  link,
  type = NotificationType.GENERAL,
}: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?: NotificationType;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        type,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

