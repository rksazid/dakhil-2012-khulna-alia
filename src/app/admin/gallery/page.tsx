import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GalleryManagerClient } from "./gallery-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "FUND_MANAGER")) {
    redirect("/admin");
  }

  const galleryItems = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <GalleryManagerClient galleryItems={galleryItems} />;
}
