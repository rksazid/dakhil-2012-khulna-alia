import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ExpensesManagerClient } from "./expenses-manager-client";


export default async function AdminExpensesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const expenses = await prisma.fundExpense.findMany({
    orderBy: { spentDate: "desc" },
    include: {
      fund: { select: { id: true, title: true } },
      approvedBy: { select: { name: true } },
    },
  });

  const funds = await prisma.fund.findMany({
    where: { isActive: true },
    select: { id: true, title: true, currentBalance: true },
  });

  return (
    <ExpensesManagerClient
      expenses={expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      }))}
      funds={funds.map((f) => ({
        ...f,
        currentBalance: Number(f.currentBalance),
      }))}
    />
  );
}
