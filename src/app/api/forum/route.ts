import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getForumFeed } from "@/lib/forum";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 });
    }

    const posts = await getForumFeed();

    return NextResponse.json({ posts });
  } catch (err: unknown) {
    console.error("Fetch forum posts error:", err);
    return NextResponse.json(
      { error: "ফোরাম লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
