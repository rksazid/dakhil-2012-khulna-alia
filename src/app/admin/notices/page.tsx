import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NoticesManagerClient } from "./notices-manager-client";


export default async function AdminNoticesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const notices = await prisma.notice.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true } },
    },
  });

  return <NoticesManagerClient notices={notices} />;
}
