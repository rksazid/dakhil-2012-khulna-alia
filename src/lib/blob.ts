import { put } from "@vercel/blob";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads a file to Vercel Public Object Storage (Vercel Blob)
 * @param file File or Buffer to upload
 * @param filename File name (e.g. receipt-123.jpg)
 * @param folder Subfolder name (e.g. receipts, avatars, banners)
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

    // If Vercel Blob token is configured, use official Vercel Blob store
    if (token) {
      const blob = await put(path, file, {
        access: "public",
        token,
      });
      return { success: true, url: blob.url };
    }

    // If running in development without a BLOB_READ_WRITE_TOKEN,
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
