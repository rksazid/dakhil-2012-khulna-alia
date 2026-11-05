import { put, del } from "@vercel/blob";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads a file to Vercel Public Object Storage (Vercel Blob)
 * @param file File, Buffer, or Blob to upload
 * @param filename File name (e.g. receipt-123.jpg)
 * @param folder Subfolder name (e.g. receipts, avatars, banners, gallery)
 */
export async function uploadToVercelBlob(
  file: File | Buffer | Blob,
  filename: string,
  folder = "uploads"
): Promise<UploadResult> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `${folder}/${Date.now()}-${cleanFilename}`;

    // If Vercel Blob token is configured or running on Vercel
    if (token || process.env.VERCEL) {
      const blob = await put(path, file, {
        access: "public",
        ...(token ? { token } : {}),
      });
      return { success: true, url: blob.url };
    }

    // In local development without BLOB_READ_WRITE_TOKEN,
    // convert to base64 Data URL so local testing works seamlessly
    if (file instanceof File || file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = (file as File).type || "image/jpeg";
      const base64Url = `data:${mimeType};base64,${buffer.toString("base64")}`;
      return { success: true, url: base64Url };
    } else if (Buffer.isBuffer(file)) {
      const base64Url = `data:image/jpeg;base64,${file.toString("base64")}`;
      return { success: true, url: base64Url };
    }

    return { success: false, error: "ফাইলের ফরম্যাট সঠিক নয়।" };
  } catch (error: unknown) {
    console.error("Vercel Blob upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ফাইল আপলোড ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Permanently deletes files from Vercel Blob Object Storage to release space and bandwidth.
 * Safely ignores base64 data URLs, local static files, and external links.
 * @param urlOrUrls A single URL string or an array of URL strings to delete
 */
export async function deleteFromVercelBlob(
  urlOrUrls: string | string[] | null | undefined
): Promise<boolean> {
  if (!urlOrUrls) return true;

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const urls = (Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls])
      .filter(
        (u): u is string =>
          typeof u === "string" &&
          u.trim().length > 0 &&
          u.includes("blob.vercel-storage.com")
      );

    if (urls.length === 0) {
      return true;
    }

    await del(urls, {
      ...(token ? { token } : {}),
    });

    return true;
  } catch (error: unknown) {
    console.warn("Vercel Blob delete warning:", error);
    // Return false but do not crash the caller
    return false;
  }
}
