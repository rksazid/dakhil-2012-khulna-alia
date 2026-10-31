import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PaymentsManagerClient } from "./payments-manager-client";


export default async function AdminPaymentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const contributions = await prisma.monthlyContribution.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      fund: { select: { id: true, title: true } },
      verifiedBy: { select: { id: true, name: true } },
    },
  });

  const funds = await prisma.fund.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
  });

  const members = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });

  return (
    <PaymentsManagerClient
      contributions={contributions.map((c) => ({
        ...c,
        amountPaid: Number(c.amountPaid),
      }))}
      funds={funds}
      members={members}
    />
  );
}
