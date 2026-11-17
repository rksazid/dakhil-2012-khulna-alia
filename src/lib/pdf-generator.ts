import prisma from "@/lib/prisma";
import { formatBengaliDate, formatBengaliDateTime, formatCurrency, toBengaliNumber } from "@/lib/utils";
import { sortMonthYears } from "@/lib/months";
import { PaymentStatus } from "@prisma/client";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

interface ReceiptPdfResult {
  buffer: Buffer;
  filename: string;
  contribution: {
    id: string;
    monthYear: string;
    amountPaid: number;
    status: PaymentStatus;
    userName: string;
    fundTitle: string;
  };
  html: string;
}

export function generateReceiptHtml(data: {
  receiptNo: string;
  donorName: string;
  donorIdentityHeading?: string;
  donorIdentityLabel?: string;
  phone: string;
  email?: string | null;
  classRoll?: string | null;
  section?: string | null;
  fundTitle: string;
  monthYear: string;
  amountPaidFormatted: string;
  paymentMethod: string;
  transactionId?: string | null;
  status: PaymentStatus;
  submissionDate: string;
  approvalDate?: string | null;
  verifiedByName?: string | null;
  note?: string | null;
  contactAddress?: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  verificationUrl: string;
  qrCodeDataUrl?: string;
  logoBase64?: string;
}): string {
  const isApproved = data.status === PaymentStatus.VERIFIED;
  const isPending = data.status === PaymentStatus.PENDING;
  const isRejected = data.status === PaymentStatus.REJECTED;

  const sectionLabel =
    data.section === "SCIENCE"
      ? "বিজ্ঞান শাখা"
      : data.section === "ARTS"
      ? "সাধারণ / মানবিক শাখা"
      : data.section || "";

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>মানি রিসিপ্ট #${data.receiptNo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Hind Siliguri", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 30px 36px;
      line-height: 1.5;
      font-size: 13px;
    }
    .watermark-box {
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-size: 44px;
      font-weight: 800;
      color: ${
        isApproved
          ? "rgba(16, 185, 129, 0.06)"
          : isRejected
          ? "rgba(239, 68, 68, 0.06)"
          : "rgba(217, 119, 6, 0.08)"
      };
      text-transform: uppercase;
      letter-spacing: 3px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      border: 4px dashed ${
        isApproved
          ? "rgba(16, 185, 129, 0.12)"
          : isRejected
          ? "rgba(239, 68, 68, 0.12)"
          : "rgba(217, 119, 6, 0.16)"
      };
      padding: 10px 30px;
      border-radius: 12px;
      font-family: "Plus Jakarta Sans", sans-serif;
    }
    .container {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-bottom: 2.5px solid #047857;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .logo-badge {
      width: 48px;
      height: 48px;
      background: #047857;
      color: #ffffff;
      border-radius: 12px;
      text-align: center;
      line-height: 48px;
      font-size: 20px;
      font-weight: 800;
      display: inline-block;
      vertical-align: middle;
      margin-right: 12px;
    }
    .org-title {
      font-size: 22px;
      font-weight: 800;
      color: #064e3b;
      line-height: 1.2;
    }
    .org-sub {
      font-size: 12px;
      color: #047857;
      font-weight: 600;
      margin-top: 2px;
    }
    .org-contact {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .receipt-title-box {
      text-align: right;
    }
    .receipt-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .receipt-no {
      font-family: "Plus Jakarta Sans", monospace;
      font-size: 12px;
      font-weight: 700;
      color: #047857;
      background: #ecfdf5;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
      margin-top: 4px;
      border: 1px solid #a7f3d0;
    }
    .status-banner {
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 22px;
      display: table;
      width: 100%;
      background: ${
        isApproved
          ? "#f0fdf4"
          : isRejected
          ? "#fef2f2"
          : "#fffbeb"
      };
      border: 1.5px solid ${
        isApproved
          ? "#86efac"
          : isRejected
          ? "#fecaca"
          : "#fde68a"
      };
    }
    .status-banner-cell {
      display: table-cell;
      vertical-align: middle;
    }
    .status-badge {
      display: inline-block;
      font-weight: 800;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 6px;
      color: #ffffff;
      background: ${
        isApproved
          ? "#16a34a"
          : isRejected
          ? "#dc2626"
          : "#d97706"
      };
      letter-spacing: 0.3px;
    }
    .status-desc {
      font-size: 12px;
      color: ${
        isApproved
          ? "#166534"
          : isRejected
          ? "#991b1b"
          : "#92400e"
      };
      margin-top: 4px;
      font-weight: 500;
    }
    .status-meta {
      text-align: right;
      font-size: 11px;
      color: ${
        isApproved
          ? "#15803d"
          : isRejected
          ? "#991b1b"
          : "#b45309"
      };
      font-weight: 600;
    }
    .info-grid {
      width: 100%;
      margin-bottom: 22px;
      border-collapse: collapse;
    }
    .info-card {
      width: 50%;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      vertical-align: top;
    }
    .info-card-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }
    .info-row {
      margin-bottom: 4px;
      font-size: 12px;
    }
    .info-label {
      color: #64748b;
      width: 90px;
      display: inline-block;
      font-weight: 500;
    }
    .info-val {
      color: #0f172a;
      font-weight: 700;
    }
    .table-details {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .table-details th {
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 10px 14px;
      text-align: left;
    }
    .table-details td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      color: #1e293b;
    }
    .amount-cell {
      text-align: right;
      font-weight: 800;
      font-size: 14px;
      color: #047857;
    }
    .total-box {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 26px;
      display: table;
      width: 100%;
    }
    .total-cell {
      display: table-cell;
      vertical-align: middle;
    }
    .total-amount {
      text-align: right;
      font-size: 22px;
      font-weight: 800;
      color: #047857;
    }
    .footer-table {
      width: 100%;
      margin-top: 32px;
      padding-top: 14px;
      border-collapse: collapse;
    }
    .sig-block {
      width: 33%;
      text-align: center;
      vertical-align: bottom;
      padding: 0 10px;
    }
    .sig-line {
      border-top: 1px dashed #94a3b8;
      padding-top: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }
    .seal-box {
      display: inline-block;
      width: 90px;
      height: 90px;
      border: 2px dashed ${
        isApproved
          ? "#059669"
          : isRejected
          ? "#dc2626"
          : "#d97706"
      };
      border-radius: 50%;
      text-align: center;
      padding-top: 16px;
      color: ${
        isApproved
          ? "#047857"
          : isRejected
          ? "#991b1b"
          : "#b45309"
      };
      font-size: 9px;
      font-weight: 700;
      line-height: 1.25;
      transform: rotate(-8deg);
      background: ${
        isApproved
          ? "rgba(16, 185, 129, 0.04)"
          : isRejected
          ? "rgba(239, 68, 68, 0.04)"
          : "rgba(245, 158, 11, 0.04)"
      };
    }
    .disclaimer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="watermark-box">${
    isApproved
      ? "VERIFIED & APPROVED"
      : isRejected
      ? "PAYMENT REJECTED"
      : "NOT YET APPROVED"
  }</div>

  <div class="container">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: middle;">
          <table>
            <tr>
              <td>
                ${
                  data.logoBase64
                    ? `<img src="${data.logoBase64}" alt="লোগো" style="width: 52px; height: 52px; border-radius: 50%; vertical-align: middle; margin-right: 12px; display: inline-block;" />`
                    : `<div class="logo-badge">১২</div>`
                }
              </td>
              <td>
                <div class="org-title">দাখিল ২০১২ ব্যাচ • খুলনা আলিয়া মাদ্রাসা</div>
                <div class="org-sub">বন্ধু কল্যাণ তহবিল ও সেন্ট্রাল একাউন্টস ম্যানেজমেন্ট পোর্টাল</div>
                <div class="org-contact">
                  ${data.contactAddress || "খুলনা আলিয়া মাদ্রাসা চত্বর, খুলনা"}${data.contactPhone ? ` | হেল্পলাইন: ${data.contactPhone}` : ""}${data.contactEmail ? ` | ${data.contactEmail}` : ""}
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td class="receipt-title-box" style="vertical-align: middle;">
          <div class="receipt-title">ডিজিটাল অনুদান রশিদ</div>
          <div style="font-size: 11px; color: #64748b;">OFFICIAL MONEY RECEIPT</div>
          <div class="receipt-no">#${data.receiptNo}</div>
        </td>
      </tr>
    </table>

    <!-- Prominent Status Banner (User Requirement: Clearly state Not Yet Approved / Pending vs Approved with Date) -->
    <div class="status-banner">
      <div class="status-banner-cell">
        <span class="status-badge">${
          isApproved
            ? "অনুমোদিত ও যাচাইকৃত (APPROVED)"
            : isRejected
            ? "বাতিলকৃত অনুদান (REJECTED)"
            : "যাচাই অপেক্ষমান (NOT YET APPROVED / PENDING)"
        }</span>
        <div class="status-desc">
          ${
            isApproved
              ? "আলহামদুলিল্লাহ! এই অনুদানটি তহবিল কর্তৃপক্ষের মাধ্যমে সত্যতা যাচাইপূর্বক কেন্দ্রীয় লেজারে সফলভাবে গৃহীত হয়েছে।"
              : isRejected
              ? "প্রদত্ত লেনদেন তথ্যে অসঙ্গতির কারণে এই এন্ট্রিটি বাতিল করা হয়েছে। প্রয়োজনে পরিচালকদের সাথে যোগাযোগ করুন।"
              : "এই রশিদটি অনুদান জমাদানের প্রাথমিক স্বীকৃতি। তহবিল কমিটি কর্তৃক যাচাই সম্পন্ন হলে চূড়ান্ত অনুমোদন কার্যকর হবে।"
          }
        </div>
      </div>
      <div class="status-banner-cell status-meta">
        ${
          isApproved
            ? `
          <div>অনুমোদনের তারিখ:</div>
          <div style="font-size: 12px; color: #047857;">${data.approvalDate || data.submissionDate}</div>
          ${data.verifiedByName ? `<div style="margin-top: 2px;">যাচাইকারী: ${data.verifiedByName}</div>` : ""}
        `
            : isRejected
            ? `
          <div style="font-size: 12px; font-weight: 700; color: #dc2626;">স্ট্যাটাস: বাতিল (REJECTED)</div>
          <div style="font-size: 11px; margin-top: 2px;">তারিখ: ${data.submissionDate}</div>
        `
            : `
          <div style="font-size: 12px; font-weight: 700; color: #d97706;">স্ট্যাটাস: অপেক্ষমান (PENDING)</div>
          <div style="font-size: 11px; color: #b45309; margin-top: 2px;">জমার তারিখ: ${data.submissionDate}</div>
        `
        }
      </div>
    </div>

    <!-- Info Grid: Donor & Payment Metadata -->
    <table class="info-grid">
      <tr>
        <td class="info-card" style="padding-right: 12px;">
          <div class="info-card-title">অনুদানদাতার তথ্য (Donor Details)</div>
          <div class="info-row"><span class="info-label">সদস্যের নাম:</span> <span class="info-val">${data.donorName}</span></div>
          <div class="info-row"><span class="info-label">${data.donorIdentityHeading || "ব্যাচ ও প্রতিষ্ঠান:"}</span> <span class="info-val">${data.donorIdentityLabel || "দাখিল ২০১২, খুলনা আলিয়া মাদ্রাসা"}</span></div>
          ${data.classRoll ? `<div class="info-row"><span class="info-label">শ্রেণি রোল:</span> <span class="info-val">${data.classRoll}</span></div>` : ""}
          ${sectionLabel ? `<div class="info-row"><span class="info-label">শাখা / বিভাগ:</span> <span class="info-val">${sectionLabel}</span></div>` : ""}
          <div class="info-row"><span class="info-label">মোবাইল নম্বর:</span> <span class="info-val">${data.phone}</span></div>
          ${data.email ? `<div class="info-row"><span class="info-label">ইমেইল ঠিকানা:</span> <span class="info-val">${data.email}</span></div>` : ""}
        </td>
        <td style="width: 14px;"></td>
        <td class="info-card" style="padding-left: 12px;">
          <div class="info-card-title">ট্রানজেকশন সারসংক্ষেপ (Payment Summary)</div>
          <div class="info-row"><span class="info-label">রশিদ নম্বর:</span> <span class="info-val" style="font-family: monospace;">${data.receiptNo}</span></div>
          <div class="info-row"><span class="info-label">প্রদানের তারিখ:</span> <span class="info-val">${data.submissionDate}</span></div>
          <div class="info-row"><span class="info-label">অনুদানের মাস:</span> <span class="info-val" style="color: #047857;">${data.monthYear}</span></div>
          <div class="info-row"><span class="info-label">পেমেন্ট মাধ্যম:</span> <span class="info-val">${data.paymentMethod}</span></div>
          ${data.transactionId ? `<div class="info-row"><span class="info-label">TrxID / রেফারেন্স:</span> <span class="info-val" style="font-family: monospace;">${data.transactionId}</span></div>` : ""}
        </td>
      </tr>
    </table>

    <!-- Line items: Details Table -->
    <table class="table-details">
      <thead>
        <tr>
          <th style="width: 40%;">খাত / তহবিলের নাম</th>
          <th style="width: 20%;">অনুদানের মাস</th>
          <th style="width: 20%;">পেমেন্ট বিবরণ</th>
          <th style="width: 20%; text-align: right;">জমার পরিমাণ (টাকা)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${data.fundTitle}</strong>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">দাখিল ২০১২ ব্যাচ কল্যাণ অনুদান</div>
          </td>
          <td><span style="font-weight: 600; color: #0f172a;">${data.monthYear}</span></td>
          <td>
            <div>${data.paymentMethod}</div>
            ${data.transactionId ? `<div style="font-size: 10px; color: #64748b; font-family: monospace;">Trx: ${data.transactionId}</div>` : ""}
          </td>
          <td class="amount-cell">${data.amountPaidFormatted}</td>
        </tr>
      </tbody>
    </table>

    <!-- Total Amount Box -->
    <div class="total-box">
      <div class="total-cell">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">সর্বমোট জমার অংক</div>
        <div style="font-size: 12px; color: #047857; font-weight: 600; margin-top: 2px;">
          ${data.note ? `মন্তব্য: ${data.note}` : "ডিজিটাল অনুদান সফলভাবে নথিবদ্ধ করা হয়েছে।"}
        </div>
      </div>
      <div class="total-cell total-amount">
        ${data.amountPaidFormatted}/-
      </div>
    </div>

    <!-- Signatures and Digital Verification QR Code -->
    <table class="footer-table">
      <tr>
        <td class="sig-block">
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; min-height: 20px;">
            ${data.donorName}
          </div>
          <div class="sig-line">অনলাইন অনুদানকারী (ডিজিটাল সম্মতি)</div>
        </td>
        <td class="sig-block" style="text-align: center; vertical-align: middle;">
          ${
            data.qrCodeDataUrl
              ? `
            <div style="display: inline-block; padding: 4px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <img src="${data.qrCodeDataUrl}" alt="ভেরিফিকেশন কিউআর কোড" style="width: 80px; height: 80px; display: block;" />
            </div>
            <div style="font-size: 9.5px; font-weight: 700; color: #047857; margin-top: 3px; letter-spacing: 0.3px;">
              ক্যামেরায় স্ক্যান করে সত্যতা যাচাই করুন
            </div>
          `
              : `
            <div class="seal-box">
              দাখিল ২০১২<br>
              খুলনা আলিয়া<br>
              ★ ডিজিটাল সীল ★<br>
              ${isApproved ? "VERIFIED" : isRejected ? "REJECTED" : "PENDING"}
            </div>
          `
          }
        </td>
        <td class="sig-block">
          <div style="font-size: 12px; font-weight: 700; color: #047857; margin-bottom: 4px;">
            ${data.verifiedByName || "ফান্ড ম্যানেজমেন্ট কমিটি"}
          </div>
          <div class="sig-line">তহবিল হিসাব ও নিরীক্ষা বিভাগ</div>
        </td>
      </tr>
    </table>

    <!-- Disclaimer -->
    <div class="disclaimer">
      এটি একটি কম্পিউটার উৎপাদিত অফিসিয়াল ডিজিটাল মানি রিসিপ্ট। এই রশিদের যাবতীয় লেনদেন রেকর্ড কেন্দ্রীয় পোর্টালে স্থায়ীভাবে সংরক্ষিত রয়েছে।<br>
      অনলাইনে তাৎক্ষণিক সত্যতা যাচাই করতে ভিজিট করুন: <a href="${data.verificationUrl}" style="color: #047857; font-weight: 600; text-decoration: none;">${data.verificationUrl}</a> | ভেরিফিকেশন আইডি: <strong style="font-family: monospace;">${data.receiptNo}</strong>
    </div>
  </div>
</body>
</html>`;
}

export async function generateReceiptPdfBuffer(contributionId: string): Promise<ReceiptPdfResult> {
  const [contribution, settingsList] = await Promise.all([
    prisma.monthlyContribution.findUnique({
      where: { id: contributionId },
      include: {
        fund: true,
        user: true,
        verifiedBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.siteSetting.findMany({
      where: { key: { in: ["contact_email", "contact_phone"] } },
    }),
  ]);

  if (!contribution) {
    throw new Error("অনুদানের তথ্য পাওয়া যায়নি।");
  }

  const settingsMap = Object.fromEntries(settingsList.map((s) => [s.key, s.value]));
  const contactPhone = settingsMap["contact_phone"] || "+8801776333338";
  const contactEmail = settingsMap["contact_email"] || null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dakhil2012-alia.vercel.app";
  const verificationUrl = `${baseUrl.replace(/\/+$/, "")}/verify/receipt/${contribution.id}`;

  let qrCodeDataUrl: string | undefined = undefined;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 160,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
    });
  } catch (qrErr) {
    console.warn("Failed to generate receipt QR code:", qrErr);
  }

  let logoBase64: string | undefined = undefined;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${buf.toString("base64")}`;
    }
  } catch (logoErr) {
    console.warn("Failed to read logo for receipt:", logoErr);
  }

  const receiptNo = `RCPT-${contribution.monthYear.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, "")}-${contribution.id.slice(-6).toUpperCase()}`;
  const amountPaidNum = Number(contribution.amountPaid);
  const amountPaidFormatted = formatCurrency(amountPaidNum);
  const submissionDate = formatBengaliDate(contribution.createdAt);
  const approvalDate = contribution.verifiedAt ? formatBengaliDateTime(contribution.verifiedAt) : null;

  const isTeacher = contribution.user.userType === "TEACHER";
  const isWellWisher = contribution.user.userType === "WELL_WISHER";

  const donorIdentityHeading = isTeacher
    ? "পদবী ও প্রতিষ্ঠান:"
    : isWellWisher
    ? "পরিচয় ও সম্পর্ক:"
    : "ব্যাচ ও প্রতিষ্ঠান:";

  const donorIdentityLabel = isTeacher
    ? "সম্মানিত শিক্ষক, খুলনা আলিয়া মাদ্রাসা"
    : isWellWisher
    ? "শুভাকাঙ্ক্ষী ও সহযোগী"
    : "দাখিল ২০১২, খুলনা আলিয়া মাদ্রাসা";

  const html = generateReceiptHtml({
    receiptNo,
    donorName: contribution.user.name,
    donorIdentityHeading,
    donorIdentityLabel,
    phone: contribution.user.phone,
    email: contribution.user.email,
    classRoll: contribution.user.classRoll ? toBengaliNumber(contribution.user.classRoll) : null,
    section: contribution.user.studentGroup || contribution.user.classroom,
    fundTitle: contribution.fund.title,
    monthYear: contribution.monthYear,
    amountPaidFormatted,
    paymentMethod: contribution.paymentMethod,
    transactionId: contribution.transactionId,
    status: contribution.status,
    submissionDate,
    approvalDate,
    verifiedByName: contribution.verifiedBy?.name
      ? `${contribution.verifiedBy.name} (${
          contribution.verifiedBy.role === "SUPER_ADMIN" ? "সুপার এডমিন" : "ফান্ড ম্যানেজার"
        })`
      : null,
    note: contribution.note,
    contactAddress: "খুলনা আলিয়া মাদ্রাসা চত্বর, খুলনা",
    contactPhone,
    contactEmail,
    verificationUrl,
    qrCodeDataUrl,
    logoBase64,
  });

  // Call PDF service endpoints with primary (Vercel) and fallback (Render)
  const primaryUrl = process.env.PDF_SERVICE_URL || "https://pdf-lagbe.vercel.app";
  const endpoints = [
    `${primaryUrl.replace(/\/+$/, "")}/api/v1/html-to-pdf`,
    "https://pdf-lagbe.onrender.com/api/v1/html-to-pdf",
  ];

  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html,
          format: "A4",
          margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
          },
          printBackground: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`PDF generation error from ${endpoint} [${response.status}]:`, errorText);
        lastError = new Error(`PDF API responded with status ${response.status}`);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        buffer,
        filename: `MoneyReceipt-${contribution.monthYear}-${contribution.user.name.replace(/\s+/g, "_")}.pdf`,
        contribution: {
          id: contribution.id,
          monthYear: contribution.monthYear,
          amountPaid: amountPaidNum,
          status: contribution.status,
          userName: contribution.user.name,
          fundTitle: contribution.fund.title,
        },
        html,
      };
    } catch (err) {
      console.warn(`Connection error to ${endpoint}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("PDF রশিদ জেনারেট করতে ব্যর্থ হয়েছে।");
}

// ---------------------------------------------------------------------------
// Chunked Spreadsheet Ledger HTML & PDF Generator
// ---------------------------------------------------------------------------

export interface LedgerPdfMember {
  id: string;
  name: string;
  phone: string;
  classRoll?: string | null;
  studentGroup?: string | null;
  committedAmount?: number | null;
  contributions: Record<string, number>;
}

export interface LedgerPdfData {
  fundTitle: string;
  months: string[];
  members: LedgerPdfMember[];
  columnTotals: Record<string, number>;
  grandTotal: number;
  lastUpdatedAtFormatted: string;
  lastUpdatedByName: string;
  verificationUrl: string;
  qrCodeDataUrl?: string;
  logoBase64?: string;
}

export function generateLedgerHtml(data: LedgerPdfData): string {
  // Chunk months into groups of 3 or 4 months so each table fits comfortably on A4
  const chunkSize = 4;
  const chunks: string[][] = [];
  for (let i = 0; i < data.months.length; i += chunkSize) {
    chunks.push(data.months.slice(i, i + chunkSize));
  }

  // Pre-calculate member grand totals
  const memberGrandTotals: Record<string, number> = {};
  const memberLastPaidMonth: Record<string, string> = {};

  data.members.forEach((m) => {
    let sum = 0;
    let lastMonth = "-";
    data.months.forEach((month) => {
      const paid = m.contributions[month] || 0;
      if (paid > 0) {
        sum += paid;
        lastMonth = month;
      }
    });
    memberGrandTotals[m.id] = sum;
    memberLastPaidMonth[m.id] = lastMonth;
  });

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>${data.fundTitle} • অফিসিয়াল স্প্রেডশিট লেজার</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Hind Siliguri", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 16px 20px;
      line-height: 1.4;
      font-size: 11px;
    }
    .header-box {
      border-bottom: 2px solid #065f46;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    .brand-badge {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #065f46;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
    }
    .org-title {
      font-size: 17px;
      font-weight: 800;
      color: #065f46;
      line-height: 1.2;
    }
    .fund-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 10.5px;
      color: #475569;
      background: #f8fafc;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .meta-highlight {
      color: #065f46;
      font-weight: 700;
    }

    /* Section & Chunk Tables */
    .chunk-section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .chunk-heading {
      font-size: 12px;
      font-weight: 700;
      color: #065f46;
      background: #ecfdf5;
      padding: 6px 10px;
      border-left: 4px solid #059669;
      border-radius: 4px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table.ledger-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 10.5px;
      margin-bottom: 8px;
    }
    table.ledger-table th, table.ledger-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      vertical-align: middle;
      word-wrap: break-word;
      overflow: hidden;
    }
    table.ledger-table th {
      background: #064e3b;
      color: #ffffff;
      font-weight: 700;
      text-align: center;
      font-size: 10.5px;
    }
    table.ledger-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .td-sl {
      width: 4%;
      text-align: center;
      font-weight: 600;
      color: #64748b;
    }
    .td-name {
      width: 22%;
      font-weight: 700;
      color: #0f172a;
    }
    .td-commit {
      width: 11%;
      text-align: center;
      font-weight: 600;
      color: #334155;
    }
    .td-month {
      text-align: center;
    }
    .td-total {
      width: 13%;
      text-align: right;
      font-weight: 700;
      color: #065f46;
      background: #f0fdf4;
    }
    .paid-chip {
      display: inline-block;
      font-weight: 700;
      color: #047857;
    }
    .unpaid-chip {
      color: #94a3b8;
    }
    .tr-footer {
      background: #e2e8f0 !important;
      font-weight: 800;
      color: #0f172a;
    }
    .tr-footer td {
      font-weight: 800;
      border-top: 2px solid #0f172a;
    }

    /* Summary Table */
    .summary-section {
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .summary-heading {
      font-size: 12.5px;
      font-weight: 800;
      color: #0f172a;
      background: #f1f5f9;
      padding: 6px 10px;
      border-left: 4px solid #0f172a;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .grand-total-banner {
      background: #064e3b;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 13px;
      font-weight: 800;
    }

    /* Verification & Signatures */
    .footer-block {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      width: 180px;
    }
    .sig-line {
      border-top: 1px solid #475569;
      padding-top: 4px;
      font-size: 10.5px;
      font-weight: 700;
      color: #334155;
    }
    .qr-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qr-img {
      width: 58px;
      height: 58px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 2px;
    }
    .qr-text {
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header-box">
    <div class="brand-left">
      ${
        data.logoBase64
          ? `<img src="${data.logoBase64}" alt="লোগো" class="brand-logo" />`
          : `<div class="brand-badge">১২</div>`
      }
      <div>
        <div class="org-title">দাখিল ২০১২ ব্যাচ • খুলনা আলিয়া মাদ্রাসা</div>
        <div class="fund-title">${data.fundTitle} • অফিসিয়াল স্প্রেডশিট লেজার</div>
      </div>
    </div>
    <div class="meta-box">
      <div>🕒 সর্বশেষ আপডেট: <span class="meta-highlight">${data.lastUpdatedAtFormatted}</span></div>
      <div>👤 হালনাগাদ করেছেন: <span class="meta-highlight">${data.lastUpdatedByName}</span></div>
      <div>তালিকাভুক্ত সদস্য: <strong>${toBengaliNumber(data.members.length)} জন</strong></div>
    </div>
  </div>

  <!-- Chunked Tables (3-4 Months per Chunk for Zero Horizontal Clipping) -->
  ${chunks
    .map((chunk, chunkIdx) => {
      const chunkTitle = `খণ্ড ${toBengaliNumber(chunkIdx + 1)}: ${chunk[0]} হতে ${chunk[chunk.length - 1]}`;
      const colWidthPercent = Math.floor(50 / chunk.length);

      return `
      <div class="chunk-section">
        <div class="chunk-heading">
          <span>${chunkTitle}</span>
          <span style="font-size: 10px; font-weight: 600; color: #047857;">পৃষ্ঠা খণ্ড ${toBengaliNumber(chunkIdx + 1)}/${toBengaliNumber(chunks.length)}</span>
        </div>
        <table class="ledger-table">
          <thead>
            <tr>
              <th class="td-sl">নং</th>
              <th class="td-name">সদস্যের নাম ও পরিচয়</th>
              <th class="td-commit">মাসিক ওয়াদা</th>
              ${chunk
                .map(
                  (m) =>
                    `<th class="td-month" style="width: ${colWidthPercent}%;">${m}</th>`
                )
                .join("")}
              <th class="td-total">এই খণ্ডের মোট</th>
            </tr>
          </thead>
          <tbody>
            ${data.members
              .map((member, idx) => {
                let memberChunkTotal = 0;
                const monthTds = chunk.map((m) => {
                  const paid = member.contributions[m] || 0;
                  memberChunkTotal += paid;
                  return `<td class="td-month">${
                    paid > 0
                      ? `<span class="paid-chip">৳${toBengaliNumber(paid)}</span>`
                      : `<span class="unpaid-chip">-</span>`
                  }</td>`;
                });

                return `
                <tr>
                  <td class="td-sl">${toBengaliNumber(idx + 1)}</td>
                  <td class="td-name">
                    ${member.name}
                    ${
                      member.classRoll
                        ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-left: 4px;">(রোল: #${toBengaliNumber(
                            member.classRoll
                          )})</span>`
                        : ""
                    }
                  </td>
                  <td class="td-commit">
                    ${
                      member.committedAmount
                        ? `৳${toBengaliNumber(member.committedAmount)}`
                        : `<span style="color: #94a3b8;">-</span>`
                    }
                  </td>
                  ${monthTds.join("")}
                  <td class="td-total">
                    ${
                      memberChunkTotal > 0
                        ? `৳${toBengaliNumber(memberChunkTotal)}`
                        : `<span style="color: #94a3b8;">-</span>`
                    }
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr class="tr-footer">
              <td colspan="3" style="text-align: right; padding-right: 10px;">মোট আদায় (এই খণ্ড):</td>
              ${chunk
                .map((m) => {
                  const total = data.columnTotals[m] || 0;
                  return `<td class="td-month" style="font-weight: 800; color: #065f46;">৳${toBengaliNumber(
                    total
                  )}</td>`;
                })
                .join("")}
              <td class="td-total" style="font-weight: 800; font-size: 11.5px;">
                ৳${toBengaliNumber(
                  chunk.reduce((sum, m) => sum + (data.columnTotals[m] || 0), 0)
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    })
    .join("")}

  <!-- Grand Summary Table -->
  <div class="summary-section">
    <div class="summary-heading">
      সার্বিক সারসংক্ষেপ ও চূড়ান্ত পরিশোধ স্থিতি (সকল খণ্ড একত্রে)
    </div>
    <table class="ledger-table">
      <thead>
        <tr>
          <th style="width: 5%;">নং</th>
          <th style="width: 32%;">সদস্যের নাম</th>
          <th style="width: 20%;">মোবাইল নম্বর</th>
          <th style="width: 15%;">মাসিক ওয়াদা</th>
          <th style="width: 15%;">সর্বশেষ পেমেন্টের মাস</th>
          <th style="width: 13%;">সর্বমোট পরিশোধ</th>
        </tr>
      </thead>
      <tbody>
        ${data.members
          .map((member, idx) => {
            const totalPaid = memberGrandTotals[member.id] || 0;
            const lastMonth = memberLastPaidMonth[member.id] || "-";

            return `
            <tr>
              <td style="text-align: center; color: #64748b;">${toBengaliNumber(idx + 1)}</td>
              <td style="font-weight: 700;">${member.name}</td>
              <td style="font-family: monospace; font-size: 10px; color: #475569;">
                ${
                  member.phone.startsWith("offline_")
                    ? "সংরক্ষিত নেই"
                    : member.phone
                }
              </td>
              <td style="text-align: center; font-weight: 600;">
                ${
                  member.committedAmount
                    ? `৳${toBengaliNumber(member.committedAmount)}`
                    : "-"
                }
              </td>
              <td style="text-align: center; color: #475569; font-size: 10px;">${lastMonth}</td>
              <td style="text-align: right; font-weight: 800; color: #065f46; background: #f0fdf4;">
                ৳${toBengaliNumber(totalPaid)}
              </td>
            </tr>
          `;
          })
          .join("")}
      </tbody>
    </table>

    <div class="grand-total-banner">
      <span>তহবিলের সর্বমোট আদায়কৃত অর্থ (Grand Total Collection):</span>
      <span style="font-size: 16px; color: #fef08a;">৳${toBengaliNumber(data.grandTotal)}/-</span>
    </div>
  </div>

  <!-- Signatures & Live Verification -->
  <div class="footer-block">
    <div class="qr-box">
      ${
        data.qrCodeDataUrl
          ? `<img src="${data.qrCodeDataUrl}" alt="ভেরিফিকেশন কিউআর কোড" class="qr-img" />`
          : ""
      }
      <div class="qr-text">
        <strong>অনলাইন ভেরিফিকেশন ও লাইভ লেজার</strong><br>
        ক্যামেরায় স্ক্যান করে সর্বশেষ রিয়েলটাইম আপডেট দেখুন:<br>
        <span style="font-family: monospace; color: #065f46;">${data.verificationUrl}</span>
      </div>
    </div>

    <div style="display: flex; gap: 40px;">
      <div class="sig-box">
        <div style="min-height: 24px;"></div>
        <div class="sig-line">ফান্ড ম্যানেজার / হিসাব নিরীক্ষক</div>
      </div>
      <div class="sig-box">
        <div style="min-height: 24px;"></div>
        <div class="sig-line">সুপার এডমিন / আহ্বায়ক</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function generateLedgerPdfBuffer(token: string): Promise<{ buffer: Buffer; filename: string; html: string }> {
  const shareLink = await prisma.ledgerShareLink.findUnique({
    where: { token },
    include: { fund: true },
  });

  if (!shareLink || !shareLink.isActive || !shareLink.fund) {
    throw new Error("শেয়ার লিঙ্কটি সক্রিয় নেই অথবা মুছে ফেলা হয়েছে।");
  }

  const fund = shareLink.fund;

  // 1. Fetch contributions distinct months
  const dbContributions = await prisma.monthlyContribution.findMany({
    where: { fundId: fund.id, status: PaymentStatus.VERIFIED },
    select: { monthYear: true },
    distinct: ["monthYear"],
  });

  const baseMonths = ["অক্টোবর-২৬", "নভেম্বর-২৬", "ডিসেম্বর-২৬", "জানুয়ারি-২৭", "ফেব্রুয়ারি-২৭", "মার্চ-২৭"];
  const allMonthsSet = new Set<string>([...baseMonths]);
  dbContributions.forEach((c) => {
    if (c.monthYear) allMonthsSet.add(c.monthYear);
  });
  const months = sortMonthYears(Array.from(allMonthsSet));

  // 2. Fetch all active members and verified contributions
  const members = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      classRoll: true,
      studentGroup: true,
      commitments: {
        where: { fundId: fund.id },
        select: { committedAmount: true },
      },
      contributions: {
        where: { fundId: fund.id, status: PaymentStatus.VERIFIED },
        select: { monthYear: true, amountPaid: true },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  // Calculate column totals
  const columnTotals: Record<string, number> = {};
  months.forEach((m: string) => {
    columnTotals[m] = 0;
  });

  const ledgerPdfMembers: LedgerPdfMember[] = members.map((m) => {
    const contributionMap: Record<string, number> = {};
    m.contributions.forEach((c) => {
      const amt = Number(c.amountPaid);
      contributionMap[c.monthYear] = amt;
      columnTotals[c.monthYear] = (columnTotals[c.monthYear] || 0) + amt;
    });

    return {
      id: m.id,
      name: m.name,
      phone: m.phone,
      classRoll: m.classRoll,
      studentGroup: m.studentGroup,
      committedAmount: m.commitments[0]?.committedAmount
        ? Number(m.commitments[0].committedAmount)
        : null,
      contributions: contributionMap,
    };
  });

  const grandTotal = Object.values(columnTotals).reduce((a, b) => a + b, 0);

  // 3. Find latest update time and who updated it
  const latestActivity = await prisma.activityLog.findFirst({
    where: {
      fundId: fund.id,
      entityType: { in: ["CONTRIBUTION", "MONTHLY_CONTRIBUTION", "PAYMENT", "COMMITMENT", "LEDGER"] },
    },
    orderBy: { timestamp: "desc" },
    include: { performedBy: { select: { name: true, role: true } } },
  });

  const latestContribution = await prisma.monthlyContribution.findFirst({
    where: { fundId: fund.id },
    orderBy: { updatedAt: "desc" },
    include: { verifiedBy: { select: { name: true, role: true } } },
  });

  let lastUpdatedAt = shareLink.updatedAt;
  let lastUpdatedByName = "ফান্ড ম্যানেজমেন্ট টিম";

  if (latestActivity?.timestamp && latestActivity.timestamp > lastUpdatedAt) {
    lastUpdatedAt = latestActivity.timestamp;
    if (latestActivity.performedBy?.name) {
      lastUpdatedByName = latestActivity.performedBy.name;
    }
  } else if (latestContribution?.updatedAt && latestContribution.updatedAt > lastUpdatedAt) {
    lastUpdatedAt = latestContribution.updatedAt;
    if (latestContribution.verifiedBy?.name) {
      lastUpdatedByName = latestContribution.verifiedBy.name;
    }
  }

  const lastUpdatedAtFormatted = formatBengaliDateTime(lastUpdatedAt);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dakhil2012-alia.vercel.app";
  const verificationUrl = `${baseUrl.replace(/\/+$/, "")}/ledger/share/${token}`;

  let qrCodeDataUrl: string | undefined = undefined;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 140,
      color: { dark: "#064e3b", light: "#ffffff" },
    });
  } catch (qrErr) {
    console.warn("Failed to generate ledger share QR code:", qrErr);
  }

  let logoBase64: string | undefined = undefined;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${buf.toString("base64")}`;
    }
  } catch (logoErr) {
    console.warn("Failed to read logo for ledger:", logoErr);
  }

  const html = generateLedgerHtml({
    fundTitle: fund.title,
    months,
    members: ledgerPdfMembers,
    columnTotals,
    grandTotal,
    lastUpdatedAtFormatted,
    lastUpdatedByName,
    verificationUrl,
    qrCodeDataUrl,
    logoBase64,
  });

  const endpoints = [
    `${(process.env.PDF_SERVICE_URL || "https://pdf-lagbe.vercel.app").replace(/\/+$/, "")}/api/v1/html-to-pdf`,
    "https://pdf-lagbe.onrender.com/api/v1/html-to-pdf",
  ];

  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          format: "A4",
          landscape: true,
          margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
          printBackground: true,
        }),
      });

      if (!response.ok) {
        lastError = new Error(`PDF API responded with status ${response.status}`);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        buffer,
        filename: `Ledger-${fund.title.replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`,
        html,
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("PDF জেনারেট করতে সমস্যা হয়েছে।");
}
