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
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      bloodGroup: true,
      studentGroup: true,
      classRoll: true,
      classroom: true,
      occupation: true,
      workplace: true,
      presentAddress: true,
      permanentAddress: true,
      bio: true,
      createdAt: true,
      managedFunds: {
        include: { fund: { select: { title: true } } },
      },
      _count: {
        select: { commitments: true, contributions: true },
      },
    },
  });

  const activeFunds = await prisma.fund.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <MembersManagerClient
      members={members}
      activeFunds={activeFunds}
      currentUserId={user.id}
    />
  );
}
