import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    user: session,
    status: session ? "authenticated" : "unauthenticated",
  });
}

export async function POST() {
  return NextResponse.json({ success: true });
}
