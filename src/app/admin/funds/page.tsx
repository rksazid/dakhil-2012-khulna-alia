import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { FundsManagerClient } from "./funds-manager-client";


export default async function AdminFundsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const isSuperAdmin = user.role === Role.SUPER_ADMIN;

  const funds = await prisma.fund.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      managers: {
        include: { user: { select: { id: true, name: true, phone: true } } },
      },
      _count: {
        select: { commitments: true, contributions: true, expenses: true },
      },
    },
  });

  const allMembers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, phone: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <FundsManagerClient
      funds={funds.map((f) => ({
        ...f,
        currentBalance: Number(f.currentBalance),
        targetAmount: f.targetAmount ? Number(f.targetAmount) : null,
      }))}
      allMembers={allMembers}
      isSuperAdmin={isSuperAdmin}
      currentUserId={user.id}
    />
  );
}
