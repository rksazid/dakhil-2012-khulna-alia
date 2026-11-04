import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const authorSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  avatarUrl: true,
  thumbnailUrl: true,
  bannerUrl: true,
  bio: true,
  bloodGroup: true,
  studentGroup: true,
  classRoll: true,
  classroom: true,
  occupation: true,
  workplace: true,
  presentAddress: true,
  permanentAddress: true,
  role: true,
  showPhoneInDirectory: true,
  showEmailInDirectory: true,
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 });
    }

    const posts = await prisma.forumPost.findMany({
      where: { parentId: null },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 60,
      include: {
        author: { select: authorSelect },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: authorSelect },
          },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (err: unknown) {
    console.error("Fetch forum posts error:", err);
    return NextResponse.json(
      { error: "ফোরাম লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
