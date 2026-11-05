"use server";

import { deleteFromVercelBlob } from "@/lib/blob";
import { getSession } from "@/lib/auth";

/**
 * Server action to immediately delete an uploaded file from Vercel Blob storage.
 * Used when an image is removed from an upload preview or form before or after submission.
 */
export async function deleteBlobFileAction(urlOrUrls: string | string[]) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "অননুমোদিত অ্যাক্সেস।" };
    }

    const success = await deleteFromVercelBlob(urlOrUrls);
    return { success };
  } catch (err: unknown) {
    console.warn("Delete blob file action warning:", err);
    return { success: false, error: "ফাইল মুছতে সমস্যা হয়েছে।" };
  }
}
