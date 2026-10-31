"use server";

import prisma from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getCurrentUser,
  requireAuth,
} from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  try {
    const identifier = (formData.get("identifier") as string)?.trim();
    const password = (formData.get("password") as string)?.trim();

    if (!identifier || !password) {
      return { success: false, error: "মোবাইল নম্বর অথবা ইমেইল এবং পাসওয়ার্ড আবশ্যক।" };
    }

    // Find by phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      return { success: false, error: "মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।" };
    }

    if (!user.isActive) {
      return { success: false, error: "আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত আছে। প্রশাসকের সাথে যোগাযোগ করুন।" };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।" };
    }

    await setSessionCookie({
      userId: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    });

    return { success: true, role: user.role };
  } catch (err: unknown) {
    console.error("Login error:", err);
    return { success: false, error: "লগইন করার সময় একটি ত্রুটি ঘটেছে।" };
  }
}

export async function registerAction(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const password = (formData.get("password") as string)?.trim();
    const bloodGroup = (formData.get("bloodGroup") as string)?.trim() || null;
    const studentGroup = (formData.get("studentGroup") as string)?.trim() || null;
    const classRoll = (formData.get("classRoll") as string)?.trim() || null;
    const classroom = (formData.get("classroom") as string)?.trim() || null;
    const occupation = (formData.get("occupation") as string)?.trim() || null;
    const workplace = (formData.get("workplace") as string)?.trim() || null;
    const presentAddress = (formData.get("presentAddress") as string)?.trim() || null;
    const bio = (formData.get("bio") as string)?.trim() || null;

    if (!name || !phone || !password) {
      return { success: false, error: "নাম, মোবাইল নম্বর এবং পাসওয়ার্ড আবশ্যক।" };
    }

    if (password.length < 6) {
      return { success: false, error: "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।" };
    }

    // Check existing phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return { success: false, error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে।" };
    }

    // Check existing email if provided
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return { success: false, error: "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে।" };
      }
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        passwordHash,
        bloodGroup,
        studentGroup,
        classRoll,
        classroom,
        occupation,
        workplace,
        presentAddress,
        bio,
        role: Role.MEMBER,
        isActive: true,
      },
    });

    await setSessionCookie({
      userId: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Register error:", err);
    return { success: false, error: "নিবন্ধন করার সময় ত্রুটি ঘটেছে।" };
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  return { success: true };
}

export async function updateProfileAction(formData: FormData) {
  try {
    const user = await requireAuth();

    const name = (formData.get("name") as string)?.trim() || user.name;
    const email = (formData.get("email") as string)?.trim() || null;
    const bloodGroup = (formData.get("bloodGroup") as string)?.trim() || null;
    const studentGroup = (formData.get("studentGroup") as string)?.trim() || null;
    const classRoll = (formData.get("classRoll") as string)?.trim() || null;
    const classroom = (formData.get("classroom") as string)?.trim() || null;
    const occupation = (formData.get("occupation") as string)?.trim() || null;
    const workplace = (formData.get("workplace") as string)?.trim() || null;
    const presentAddress = (formData.get("presentAddress") as string)?.trim() || null;
    const permanentAddress = (formData.get("permanentAddress") as string)?.trim() || null;
    const bio = (formData.get("bio") as string)?.trim() || null;
    const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || user.avatarUrl;
    const showPhoneInDirectory = formData.get("showPhoneInDirectory") === "true";
    const showEmailInDirectory = formData.get("showEmailInDirectory") === "true";

    // If email is changing, check uniqueness
    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== user.id) {
        return { success: false, error: "এই ইমেইলটি অন্য একজন ব্যবহার করছেন।" };
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        bloodGroup,
        studentGroup,
        classRoll,
        classroom,
        occupation,
        workplace,
        presentAddress,
        permanentAddress,
        bio,
        avatarUrl,
        showPhoneInDirectory,
        showEmailInDirectory,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/members");
    return { success: true };
  } catch (err: unknown) {
    console.error("Update profile error:", err);
    return { success: false, error: "প্রোফাইল আপডেট ব্যর্থ হয়েছে।" };
  }
}
