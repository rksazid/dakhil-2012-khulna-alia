import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { MembersManagerClient } from "./members-manager-client";


export default async function AdminMembersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.SUPER_ADMIN) {
    redirect("/admin");
  }

  const members = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    include: {
      managedFunds: {
        include: { fund: { select: { title: true } } },
      },
      _count: {
        select: { commitments: true, contributions: true },
      },
    },
  });

  return (
    <MembersManagerClient
      members={members}
      currentUserId={user.id}
    />
  );
}
