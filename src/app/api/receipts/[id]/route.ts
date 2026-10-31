import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateReceiptPdfBuffer } from "@/lib/pdf-generator";
import { Role } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "রশিদ আইডি প্রদান করা হয়নি।" }, { status: 400 });
    }

    // Find contribution to verify permissions
    const contribution = await prisma.monthlyContribution.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        fundId: true,
      },
    });

    if (!contribution) {
      return NextResponse.json({ error: "অনুদানের তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    // Permission check: Member himself OR Super Admin OR Fund Manager of this fund
    const isOwner = session.userId === contribution.userId;
    const isSuperAdmin = session.role === Role.SUPER_ADMIN;

    let isManager = false;
    if (!isOwner && !isSuperAdmin) {
      const managerRecord = await prisma.fundManager.findUnique({
        where: {
          fundId_userId: {
            fundId: contribution.fundId,
            userId: session.userId,
          },
        },
      });
      isManager = !!managerRecord;
    }

    if (!isOwner && !isSuperAdmin && !isManager) {
      return NextResponse.json(
        { error: "এই রশিদটি দেখার বা ডাউনলোড করার অনুমতি আপনার নেই।" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const isInline = searchParams.get("view") === "true" || searchParams.get("inline") === "true";
    const wantsHtml = searchParams.get("format") === "html";

    const { buffer, filename, html } = await generateReceiptPdfBuffer(id);

    if (wantsHtml) {
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // ASCII safe fallback filename + UTF-8 encoded filename according to RFC 6266
    const asciiFilename = `MoneyReceipt-${contribution.id.slice(-8)}.pdf`;
    const encodedFilename = encodeURIComponent(filename);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: unknown) {
    console.error("Receipt generation route error:", error);
    const message = error instanceof Error ? error.message : "রশিদ তৈরি করতে সমস্যা হয়েছে।";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
