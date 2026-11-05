"use server";

import prisma from "@/lib/prisma";
import { requireAuth, canManageFund } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { deleteFromVercelBlob } from "@/lib/blob";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function recordExpenseAction(formData: FormData) {
  try {
    const user = await requireAuth();

    const fundId = formData.get("fundId") as string;
    const title = (formData.get("title") as string)?.trim();
    const amount = parseFloat(formData.get("amount") as string);
    const category = (formData.get("category") as string)?.trim() || "সাধারণ কল্যাণ";
    const spentDateStr = formData.get("spentDate") as string;
    const spentDate = spentDateStr ? new Date(spentDateStr) : new Date();
    const note = (formData.get("note") as string)?.trim() || null;
    const receiptUrl = (formData.get("receiptUrl") as string)?.trim() || null;

    if (!fundId || !title || !amount || amount <= 0) {
      return { success: false, error: "তহবিল, খরচের বিবরণ এবং সঠিক পরিমাণ আবশ্যক।" };
    }

    const isAllowed = await canManageFund(user.id, fundId);
    if (!isAllowed) {
      return { success: false, error: "আপনার এই তহবিলের খরচ অন্তর্ভুক্ত করার অনুমতি নেই।" };
    }

    const amountDecimal = new Prisma.Decimal(amount);

    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.fundExpense.create({
        data: {
          fundId,
          title,
          amount: amountDecimal,
          category,
          spentDate,
          receiptUrl,
          approvedByUserId: user.id,
          note,
        },
      });

      // Deduct from current balance
      await tx.fund.update({
        where: { id: fundId },
        data: {
          currentBalance: { decrement: amountDecimal },
        },
      });

      return exp;
    });

    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
      select: { title: true },
    });

    await logActivity({
      action: "RECORD_EXPENSE",
      entityType: "EXPENSE",
      entityId: expense.id,
      fundId,
      performedByUserId: user.id,
      details: {
        fundTitle: fund?.title,
        title,
        amount,
        category,
        summary: `"${fund?.title}" থেকে "${title}" বাবদ ৳${amount} খরচ রেকর্ড করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/overview");
    revalidatePath(`/funds/${fundId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Record expense error:", err);
    return { success: false, error: "খরচ এন্ট্রি করতে ব্যর্থ হয়েছে।" };
  }
}

export async function deleteExpenseAction(expenseId: string) {
  try {
    const user = await requireAuth();

    const expense = await prisma.fundExpense.findUnique({
      where: { id: expenseId },
      include: { fund: { select: { title: true } } },
    });

    if (!expense) return { success: false, error: "খরচ পাওয়া যায়নি।" };

    const isAllowed = await canManageFund(user.id, expense.fundId);
    if (!isAllowed) return { success: false, error: "মুছে ফেলার অনুমতি নেই।" };

    await prisma.$transaction(async (tx) => {
      // Refund balance
      await tx.fund.update({
        where: { id: expense.fundId },
        data: { currentBalance: { increment: expense.amount } },
      });

      await tx.fundExpense.delete({
        where: { id: expenseId },
      });
    });

    if (expense.receiptUrl) {
      await deleteFromVercelBlob(expense.receiptUrl);
    }

    await logActivity({
      action: "DELETE_EXPENSE",
      entityType: "EXPENSE",
      entityId: expenseId,
      fundId: expense.fundId,
      performedByUserId: user.id,
      details: {
        title: expense.title,
        amount: expense.amount,
        summary: `"${expense.title}" খরচের রেকর্ড মুছে ফেলা হয়েছে এবং তহবিল স্থিতি পুনর্বহাল করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/expenses");
    return { success: true };
  } catch (err: unknown) {
    console.error("Delete expense error:", err);
    return { success: false, error: "খরচ মুছে ফেলতে ব্যর্থ হয়েছে।" };
  }
}
