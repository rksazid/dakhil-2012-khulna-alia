import prisma from "@/lib/prisma";

export interface LogActivityParams {
  action: string;
  entityType: string;
  entityId?: string;
  fundId?: string;
  performedByUserId?: string;
  details?: Record<string, unknown> | string;
}

export async function logActivity({
  action,
  entityType,
  entityId,
  fundId,
  performedByUserId,
  details,
}: LogActivityParams) {
  try {
    const detailsStr =
      typeof details === "string" ? details : details ? JSON.stringify(details) : null;

    return await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        fundId,
        performedByUserId,
        details: detailsStr,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}
