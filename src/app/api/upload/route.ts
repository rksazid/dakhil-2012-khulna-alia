import { NextRequest, NextResponse } from "next/server";
import { uploadToVercelBlob } from "@/lib/blob";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const thumbnail = formData.get("thumbnail") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "কোনো ফাইল পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    // Allowed folder names
    const allowedFolders = ["avatars", "receipts", "banners", "gallery", "uploads"];
    const targetFolder = allowedFolders.includes(folder) ? folder : "uploads";

    // Authentication check:
    // Avatars can be uploaded during public registration or by authenticated users.
    // Receipts, banners, and general gallery uploads require an active session.
    const session = await getSession();
    if (!session && targetFolder !== "avatars") {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" },
        { status: 401 }
      );
    }

    // Limit file size to 4.5MB (Vercel serverless request body boundary)
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "ফাইলের সাইজ সর্বোচ্চ ৪.৫ মেগাবাইট হতে পারবে।" },
        { status: 413 }
      );
    }

    const result = await uploadToVercelBlob(file, file.name, targetFolder);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "আপলোড ব্যর্থ হয়েছে।" },
        { status: 500 }
      );
    }

    let thumbnailUrl = result.url;
    if (thumbnail) {
      const thumbResult = await uploadToVercelBlob(
        thumbnail,
        `thumb_${thumbnail.name}`,
        `${targetFolder}/thumbs`
      );
      if (thumbResult.success && thumbResult.url) {
        thumbnailUrl = thumbResult.url;
      }
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      thumbnailUrl,
    });
  } catch (error: unknown) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { success: false, error: "সার্ভারে ফাইল আপলোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
