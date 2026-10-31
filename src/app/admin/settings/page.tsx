import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";


export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.SUPER_ADMIN) {
    redirect("/admin");
  }

  const settingsRows = await prisma.siteSetting.findMany();
  const settingsMap = settingsRows.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  return <SettingsClient initialSettings={settingsMap} />;
}
