"use server";

import prisma from "@/lib/prisma";
import { requireAuth, canManageFund } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { PaymentMethod, PaymentStatus, Role, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface RecordContributionInput {
  fundId: string;
  userId: string;
  monthYear: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  receiptUrl?: string;
  status?: PaymentStatus;
  note?: string;
}

// Record a new contribution or update existing cell (Admin/Manager or Member self-submission)
export async function recordMonthlyContributionAction(data: RecordContributionInput) {
  try {
    const user = await requireAuth();

    // Check permissions
    const isSelf = user.id === data.userId;
    const isManager = await canManageFund(user.id, data.fundId);

    if (!isSelf && !isManager) {
      return { success: false, error: "আপনার এই চাঁদা এন্ট্রি করার অনুমতি নেই।" };
    }

    // Members submitting themselves default to PENDING; Managers can set VERIFIED
    let targetStatus = data.status || PaymentStatus.PENDING;
    if (!isManager && isSelf) {
      targetStatus = PaymentStatus.PENDING;
    }

    const verifiedByUserId = targetStatus === PaymentStatus.VERIFIED ? user.id : null;
    const verifiedAt = targetStatus === PaymentStatus.VERIFIED ? new Date() : null;

    // Check if an entry already exists for this user, fund, and month
    const existing = await prisma.monthlyContribution.findFirst({
      where: {
        fundId: data.fundId,
        userId: data.userId,
        monthYear: data.monthYear,
      },
      include: {
        fund: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      let contribution;
      const amountDecimal = new Prisma.Decimal(data.amountPaid);

      if (existing) {
        // Adjust fund balance
        let balanceDiff = new Prisma.Decimal(0);
        if (existing.status === PaymentStatus.VERIFIED && targetStatus === PaymentStatus.VERIFIED) {
          // Both verified: difference between new and old
          balanceDiff = amountDecimal.minus(existing.amountPaid);
        } else if (existing.status !== PaymentStatus.VERIFIED && targetStatus === PaymentStatus.VERIFIED) {
          // Was pending/rejected, now verified: add full new amount
          balanceDiff = amountDecimal;
        } else if (existing.status === PaymentStatus.VERIFIED && targetStatus !== PaymentStatus.VERIFIED) {
          // Was verified, now unverified: subtract old amount
          balanceDiff = existing.amountPaid.negated();
        }

        contribution = await tx.monthlyContribution.update({
          where: { id: existing.id },
          data: {
            amountPaid: amountDecimal,
            paymentMethod: data.paymentMethod,
            transactionId: data.transactionId ?? existing.transactionId,
            receiptUrl: data.receiptUrl ?? existing.receiptUrl,
            status: targetStatus,
            verifiedByUserId: verifiedByUserId ?? existing.verifiedByUserId,
            verifiedAt: verifiedAt ?? existing.verifiedAt,
            note: data.note ?? existing.note,
          },
        });

        if (!balanceDiff.isZero()) {
          await tx.fund.update({
            where: { id: data.fundId },
            data: { currentBalance: { increment: balanceDiff } },
          });
        }
      } else {
        // Create brand new entry
        contribution = await tx.monthlyContribution.create({
          data: {
            fundId: data.fundId,
            userId: data.userId,
            monthYear: data.monthYear,
            amountPaid: amountDecimal,
            paymentMethod: data.paymentMethod,
            transactionId: data.transactionId || null,
            receiptUrl: data.receiptUrl || null,
            status: targetStatus,
            verifiedByUserId,
            verifiedAt,
            note: data.note || null,
          },
        });

        if (targetStatus === PaymentStatus.VERIFIED) {
          await tx.fund.update({
            where: { id: data.fundId },
            data: { currentBalance: { increment: amountDecimal } },
          });
        }
      }

      return contribution;
    });

    // Log activity
    const contributor = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { name: true },
    });
    const fund = await prisma.fund.findUnique({
      where: { id: data.fundId },
      select: { title: true },
    });

    await logActivity({
      action: existing ? "UPDATE_PAYMENT" : "CREATE_PAYMENT",
      entityType: "PAYMENT",
      entityId: result.id,
      fundId: data.fundId,
      performedByUserId: user.id,
      details: {
        contributorName: contributor?.name,
        fundTitle: fund?.title,
        monthYear: data.monthYear,
        amount: data.amountPaid,
        status: targetStatus,
        paymentMethod: data.paymentMethod,
        summary: `${contributor?.name}-এর ${data.monthYear} মাসের ৳${data.amountPaid} চাঁদা (${data.paymentMethod}) ${targetStatus === PaymentStatus.VERIFIED ? "যাচাইকৃত" : "পেন্ডিং"} হিসেবে সংরক্ষিত হয়েছে।`,
      },
    });

    revalidatePath("/admin/ledger");
    revalidatePath("/admin/payments");
    revalidatePath("/dashboard");
    revalidatePath(`/funds/${data.fundId}`);
    return { success: true, contribution: result };
  } catch (err: unknown) {
    console.error("Record contribution error:", err);
    return { success: false, error: "চাঁদা এন্ট্রি করতে ব্যর্থ হয়েছে।" };
  }
}

// Quick Inline cell update for Spreadsheet Ledger
export async function updateLedgerCellAction(
  fundId: string,
  userId: string,
  monthYear: string,
  amountPaid: number,
  status: PaymentStatus = PaymentStatus.VERIFIED,
  paymentMethod: PaymentMethod = PaymentMethod.BKASH
) {
  return recordMonthlyContributionAction({
    fundId,
    userId,
    monthYear,
    amountPaid,
    paymentMethod,
    status,
  });
}

// 1-Click Verification of pending payments by Fund Managers
export async function verifyContributionAction(
  contributionId: string,
  status: PaymentStatus,
  note?: string
) {
  try {
    const user = await requireAuth();

    const contribution = await prisma.monthlyContribution.findUnique({
      where: { id: contributionId },
      include: {
        user: { select: { name: true } },
        fund: { select: { id: true, title: true } },
      },
    });

    if (!contribution) {
      return { success: false, error: "পেমেন্ট এন্ট্রি পাওয়া যায়নি।" };
    }

    const isAllowed = await canManageFund(user.id, contribution.fundId);
    if (!isAllowed) {
      return { success: false, error: "এই পেমেন্ট যাচাই করার অনুমতি নেই।" };
    }

    const oldStatus = contribution.status;
    const amount = contribution.amountPaid;

    await prisma.$transaction(async (tx) => {
      await tx.monthlyContribution.update({
        where: { id: contributionId },
        data: {
          status,
          verifiedByUserId: status === PaymentStatus.VERIFIED ? user.id : null,
          verifiedAt: status === PaymentStatus.VERIFIED ? new Date() : null,
          note: note !== undefined ? note : contribution.note,
        },
      });

      // Adjust fund balance
      if (oldStatus !== PaymentStatus.VERIFIED && status === PaymentStatus.VERIFIED) {
        await tx.fund.update({
          where: { id: contribution.fundId },
          data: { currentBalance: { increment: amount } },
        });
      } else if (oldStatus === PaymentStatus.VERIFIED && status !== PaymentStatus.VERIFIED) {
        await tx.fund.update({
          where: { id: contribution.fundId },
          data: { currentBalance: { decrement: amount } },
        });
      }
    });

    await logActivity({
      action: "VERIFY_PAYMENT",
      entityType: "PAYMENT",
      entityId: contributionId,
      fundId: contribution.fundId,
      performedByUserId: user.id,
      details: {
        contributorName: contribution.user.name,
        monthYear: contribution.monthYear,
        amount: Number(contribution.amountPaid),
        before: { "অনুমোদন স্ট্যাটাস": oldStatus },
        after: { "অনুমোদন স্ট্যাটাস": status },
        oldStatus,
        newStatus: status,
        summary: `${contribution.user.name}-এর ${contribution.monthYear} মাসের চাঁদা (${status}) অনুমোদন করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/ledger");
    revalidatePath("/admin/payments");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    console.error("Verify contribution error:", err);
    return { success: false, error: "পেমেন্ট যাচাই ব্যর্থ হয়েছে।" };
  }
}

// Delete a contribution entry (Rolls back fund balance atomically if it was verified)
export async function deleteContributionAction(contributionId: string) {
  try {
    const user = await requireAuth();

    const contribution = await prisma.monthlyContribution.findUnique({
      where: { id: contributionId },
      include: {
        user: { select: { name: true } },
        fund: { select: { id: true, title: true } },
      },
    });

    if (!contribution) {
      return { success: false, error: "পেমেন্ট রেকর্ড পাওয়া যায়নি।" };
    }

    const isAllowed = await canManageFund(user.id, contribution.fundId);
    if (!isAllowed) {
      return { success: false, error: "আপনার মুছে ফেলার অনুমতি নেই।" };
    }

    await prisma.$transaction(async (tx) => {
      if (contribution.status === PaymentStatus.VERIFIED) {
        await tx.fund.update({
          where: { id: contribution.fundId },
          data: { currentBalance: { decrement: contribution.amountPaid } },
        });
      }
      await tx.monthlyContribution.delete({
        where: { id: contributionId },
      });
    });

    await logActivity({
      action: "DELETE_PAYMENT",
      entityType: "PAYMENT",
      entityId: contributionId,
      fundId: contribution.fundId,
      performedByUserId: user.id,
      details: {
        contributorName: contribution.user.name,
        monthYear: contribution.monthYear,
        amount: contribution.amountPaid,
        summary: `${contribution.user.name}-এর ${contribution.monthYear} মাসের চাঁদা রেকর্ড মুছে ফেলা হয়েছে।`,
      },
    });

    revalidatePath("/admin/ledger");
    revalidatePath("/admin/payments");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    console.error("Delete contribution error:", err);
    return { success: false, error: "মুছে ফেলতে ব্যর্থ হয়েছে।" };
  }
}
