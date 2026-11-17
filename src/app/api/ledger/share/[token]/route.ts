import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateLedgerPdfBuffer } from "@/lib/pdf-generator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "টোকেন প্রদান করা হয়নি।" }, { status: 400 });
    }

    const shareLink = await prisma.ledgerShareLink.findUnique({
      where: { token },
      include: { fund: { select: { title: true } } },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: "শেয়ার লিঙ্কটি পাওয়া যায়নি অথবা মুছে ফেলা হয়েছে।" },
        { status: 404 }
      );
    }

    if (!shareLink.isActive) {
      return NextResponse.json(
        { error: "এই শেয়ার লিঙ্কটি সাময়িকভাবে নিষ্ক্রিয় করা হয়েছে।" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get("format");
    const isInline = searchParams.get("inline") === "true";

    const { buffer, filename, html } = await generateLedgerPdfBuffer(token);

    if (format === "html") {
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    const asciiFilename = `Ledger-${token.slice(0, 8)}.pdf`;
    const encodedFilename = encodeURIComponent(filename);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: unknown) {
    console.error("Shared ledger download API error:", err);
    const message = err instanceof Error ? err.message : "PDF প্রস্তুত করতে সমস্যা হয়েছে।";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
