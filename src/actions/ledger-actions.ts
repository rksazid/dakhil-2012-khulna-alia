"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { requireAuth, canManageFund } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { deleteFromVercelBlob } from "@/lib/blob";
import { PaymentMethod, PaymentStatus, Role, Prisma, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createNotificationHelper } from "./notification-actions";
import { formatCurrency } from "@/lib/utils";

export interface RecordContributionInput {
  fundId: string;
  userId?: string;
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
    const targetUserId = data.userId || user.id;

    // Check permissions
    const isSelf = user.id === targetUserId;
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
        userId: targetUserId,
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

        // Clean up replaced receipt from Vercel Object Storage
        if (existing.receiptUrl && data.receiptUrl && data.receiptUrl !== existing.receiptUrl) {
          await deleteFromVercelBlob(existing.receiptUrl);
        }
      } else {
        // Create brand new entry
        contribution = await tx.monthlyContribution.create({
          data: {
            fundId: data.fundId,
            userId: targetUserId,
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
    const obsoleteReceiptUrls: string[] = [];

    await prisma.$transaction(async (tx) => {
      let mergedNote = note !== undefined ? note : contribution.note;
      let mergedTrxId = contribution.transactionId;
      let mergedReceiptUrl = contribution.receiptUrl;

      // Prevent duplicate verified records for the same (fundId, userId, monthYear)
      if (status === PaymentStatus.VERIFIED) {
        const duplicates = await tx.monthlyContribution.findMany({
          where: {
            fundId: contribution.fundId,
            userId: contribution.userId,
            monthYear: contribution.monthYear,
            id: { not: contributionId },
          },
        });

        if (duplicates.length > 0) {
          for (const dup of duplicates) {
            if (!mergedNote && dup.note) mergedNote = dup.note;
            if (!mergedTrxId && dup.transactionId) mergedTrxId = dup.transactionId;
            if (!mergedReceiptUrl && dup.receiptUrl) mergedReceiptUrl = dup.receiptUrl;
          }
          for (const dup of duplicates) {
            if (dup.receiptUrl && dup.receiptUrl !== mergedReceiptUrl) {
              obsoleteReceiptUrls.push(dup.receiptUrl);
            }
          }
          await tx.monthlyContribution.deleteMany({
            where: { id: { in: duplicates.map((d) => d.id) } },
          });
        }
      }

      await tx.monthlyContribution.update({
        where: { id: contributionId },
        data: {
          status,
          verifiedByUserId: status === PaymentStatus.VERIFIED ? user.id : null,
          verifiedAt: status === PaymentStatus.VERIFIED ? new Date() : null,
          note: mergedNote,
          transactionId: mergedTrxId,
          receiptUrl: mergedReceiptUrl,
        },
      });

      // Recalculate and set fund balance directly from verified contributions minus expenses
      const [verifiedAgg, expenseAgg] = await Promise.all([
        tx.monthlyContribution.aggregate({
          where: { fundId: contribution.fundId, status: PaymentStatus.VERIFIED },
          _sum: { amountPaid: true },
        }),
        tx.fundExpense.aggregate({
          where: { fundId: contribution.fundId },
          _sum: { amount: true },
        }),
      ]);

      const verifiedSum = Number(verifiedAgg._sum.amountPaid || 0);
      const expenseSum = Number(expenseAgg._sum.amount || 0);

      await tx.fund.update({
        where: { id: contribution.fundId },
        data: { currentBalance: verifiedSum - expenseSum },
      });
    });

    if (obsoleteReceiptUrls.length > 0) {
      await deleteFromVercelBlob(obsoleteReceiptUrls);
    }

    if (oldStatus !== PaymentStatus.VERIFIED && status === PaymentStatus.VERIFIED) {
      await createNotificationHelper({
        userId: contribution.userId,
        title: "অনুদানের চাঁদা যাচাই ও অনুমোদিত",
        message: `${contribution.fund.title} তহবিলে আপনার ${contribution.monthYear} মাসের ${formatCurrency(Number(contribution.amountPaid))} অনুদান সফলভাবে যাচাই ও ভেরিফাই করা হয়েছে। ডিজিটাল মানি রিসিপ্ট প্রস্তুত।`,
        link: "/dashboard",
        type: NotificationType.PAYMENT_VERIFIED,
      });
    } else if (status === PaymentStatus.REJECTED) {
      await createNotificationHelper({
        userId: contribution.userId,
        title: "অনুদানের চাঁদা যাচাই বাতিল",
        message: `${contribution.fund.title} তহবিলের জন্য প্রেরিত আপনার ${contribution.monthYear} মাসের অনুদানটি তথ্য অমিলের কারণে বাতিল করা হয়েছে। প্রয়োজনে পরিচালকদের সাথে যোগাযোগ করুন।`,
        link: "/dashboard",
        type: NotificationType.PAYMENT_REJECTED,
      });
    }

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

    if (contribution.receiptUrl) {
      await deleteFromVercelBlob(contribution.receiptUrl);
    }

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

// ---------------------------------------------------------------------------
// Shareable Spreadsheet Link Management Actions
// ---------------------------------------------------------------------------

export async function getFundShareLinkAction(fundId: string) {
  try {
    const user = await requireAuth();
    const isAllowed = await canManageFund(user.id, fundId);
    if (!isAllowed) {
      return { success: false, error: "আপনার এই তহবিলের তথ্য দেখার অনুমতি নেই।" };
    }

    const shareLink = await prisma.ledgerShareLink.findFirst({
      where: { fundId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, shareLink };
  } catch (err: unknown) {
    console.error("Get share link error:", err);
    return { success: false, error: "শেয়ার লিঙ্ক লোড করতে ব্যর্থ হয়েছে।" };
  }
}

export async function createOrRegenerateShareLinkAction(fundId: string) {
  try {
    const user = await requireAuth();
    const isAllowed = await canManageFund(user.id, fundId);
    if (!isAllowed) {
      return { success: false, error: "আপনার শেয়ার লিঙ্ক তৈরি করার অনুমতি নেই।" };
    }

    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
      select: { title: true },
    });
    if (!fund) {
      return { success: false, error: "তহবিল পাওয়া যায়নি।" };
    }

    // Generate a secure 32-character random hex token
    const token = crypto.randomBytes(16).toString("hex");

    // Check if a link already exists for this fund
    const existing = await prisma.ledgerShareLink.findFirst({
      where: { fundId },
    });

    let shareLink;
    if (existing) {
      shareLink = await prisma.ledgerShareLink.update({
        where: { id: existing.id },
        data: {
          token,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      shareLink = await prisma.ledgerShareLink.create({
        data: {
          token,
          fundId,
          title: `${fund.title} • অফিসিয়াল লেজার`,
          isActive: true,
          createdById: user.id,
        },
      });
    }

    await logActivity({
      action: "GENERATE_LEDGER_SHARE_LINK",
      entityType: "LEDGER_SHARE_LINK",
      entityId: shareLink.id,
      fundId,
      performedByUserId: user.id,
      details: {
        fundTitle: fund.title,
        token: shareLink.token,
        summary: `${fund.title}-এর জন্য নতুন পাবলিক শেয়ার লিঙ্ক জেনারেট করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/ledger");
    revalidatePath(`/ledger/share/${shareLink.token}`);
    return { success: true, shareLink };
  } catch (err: unknown) {
    console.error("Create or regenerate share link error:", err);
    return { success: false, error: "শেয়ার লিঙ্ক তৈরি করতে সমস্যা হয়েছে।" };
  }
}

export async function toggleShareLinkStatusAction(shareLinkId: string, isActive: boolean) {
  try {
    const user = await requireAuth();
    const link = await prisma.ledgerShareLink.findUnique({
      where: { id: shareLinkId },
      include: { fund: { select: { title: true } } },
    });
    if (!link || !link.fundId) {
      return { success: false, error: "শেয়ার লিঙ্ক পাওয়া যায়নি।" };
    }

    const isAllowed = await canManageFund(user.id, link.fundId);
    if (!isAllowed) {
      return { success: false, error: "আপনার এই লিঙ্ক পরিবর্তনের অনুমতি নেই।" };
    }

    const updated = await prisma.ledgerShareLink.update({
      where: { id: shareLinkId },
      data: { isActive },
    });

    await logActivity({
      action: isActive ? "ACTIVATE_LEDGER_SHARE_LINK" : "DEACTIVATE_LEDGER_SHARE_LINK",
      entityType: "LEDGER_SHARE_LINK",
      entityId: shareLinkId,
      fundId: link.fundId,
      performedByUserId: user.id,
      details: {
        fundTitle: link.fund?.title,
        isActive,
        summary: `লেজার শেয়ার লিঙ্কটি ${isActive ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে।`,
      },
    });

    revalidatePath("/admin/ledger");
    revalidatePath(`/ledger/share/${link.token}`);
    return { success: true, shareLink: updated };
  } catch (err: unknown) {
    console.error("Toggle share link status error:", err);
    return { success: false, error: "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" };
  }
}

export async function deleteShareLinkAction(shareLinkId: string) {
  try {
    const user = await requireAuth();
    const link = await prisma.ledgerShareLink.findUnique({
      where: { id: shareLinkId },
      include: { fund: { select: { title: true } } },
    });
    if (!link || !link.fundId) {
      return { success: false, error: "শেয়ার লিঙ্ক পাওয়া যায়নি।" };
    }

    const isAllowed = await canManageFund(user.id, link.fundId);
    if (!isAllowed) {
      return { success: false, error: "আপনার এই লিঙ্ক মুছে ফেলার অনুমতি নেই।" };
    }

    await prisma.ledgerShareLink.delete({
      where: { id: shareLinkId },
    });

    await logActivity({
      action: "DELETE_LEDGER_SHARE_LINK",
      entityType: "LEDGER_SHARE_LINK",
      entityId: shareLinkId,
      fundId: link.fundId,
      performedByUserId: user.id,
      details: {
        fundTitle: link.fund?.title,
        summary: "পাবলিক লেজার শেয়ার লিঙ্কটি সম্পূর্ণ মুছে ফেলা হয়েছে।",
      },
    });

    revalidatePath("/admin/ledger");
    return { success: true };
  } catch (err: unknown) {
    console.error("Delete share link error:", err);
    return { success: false, error: "লিঙ্ক মুছে ফেলতে ব্যর্থ হয়েছে।" };
  }
}
