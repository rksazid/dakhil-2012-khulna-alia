import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { LogsManagerClient } from "./logs-manager-client";

export default async function AdminLogsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.SUPER_ADMIN) {
    redirect("/admin");
  }

  const logs = await prisma.activityLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
    include: {
      performedBy: { select: { name: true, phone: true } },
      fund: { select: { title: true } },
    },
  });

  return <LogsManagerClient logs={logs} />;
}
