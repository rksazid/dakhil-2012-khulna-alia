import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "dakhil-2012-khulna-alia-secret-salt-2026"
);

const SESSION_COOKIE_NAME = "dakhil_session";

export interface SessionPayload {
  userId: string;
  name: string;
  phone: string;
  email: string | null;
  role: Role;
  avatarUrl: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;
  return verifySessionToken(sessionToken);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      avatarUrl: true,
      bio: true,
      bloodGroup: true,
      studentGroup: true,
      classRoll: true,
      classroom: true,
      occupation: true,
      workplace: true,
      presentAddress: true,
      permanentAddress: true,
      showPhoneInDirectory: true,
      showEmailInDirectory: true,
      isActive: true,
      managedFunds: {
        select: {
          fundId: true,
        },
      },
    },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export async function requireAuth(): Promise<NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("আপনার এই কাজটি করার অনুমতি নেই।");
  }
  return user;
}

export async function canManageFund(userId: string, fundId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      managedFunds: {
        where: { fundId },
        select: { id: true },
      },
    },
  });

  if (!user) return false;
  if (user.role === Role.SUPER_ADMIN) return true;
  if (user.role === Role.FUND_MANAGER && user.managedFunds.length > 0) return true;
  return false;
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
