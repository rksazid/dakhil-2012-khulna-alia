import prisma from "@/lib/prisma";
import { formatBengaliDate, formatBengaliDateTime, formatCurrency, toBengaliNumber } from "@/lib/utils";
import { PaymentStatus } from "@prisma/client";

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
              <td><div class="logo-badge">১২</div></td>
              <td>
                <div class="org-title">দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া মাদ্রাসা</div>
                <div class="org-sub">বন্ধু কল্যাণ তহবিল ও সেন্ট্রাল একাউন্টস ম্যানেজমেন্ট পোর্টাল</div>
                <div class="org-contact">খুলনা আলিয়া মাদ্রাসা চত্বর, খুলনা | contact@dakhil2012khulna.org</div>
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
          <div class="info-row"><span class="info-label">ব্যাচ ও প্রতিষ্ঠান:</span> <span class="info-val">দাখিল ২০১২, খুলনা আলিয়া মাদ্রাসা</span></div>
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

    <!-- Signatures and Digital Verification Seal -->
    <table class="footer-table">
      <tr>
        <td class="sig-block">
          <div style="height: 35px;"></div>
          <div class="sig-line">অনুদান প্রদানকারীর স্বাক্ষর</div>
        </td>
        <td class="sig-block">
          <div class="seal-box">
            দাখিল ২০১২<br>
            খুলনা আলিয়া<br>
            ★ ডিজিটাল সীল ★<br>
            ${isApproved ? "VERIFIED" : isRejected ? "REJECTED" : "PENDING"}
          </div>
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
      এটি একটি কম্পিউটার উৎপাদিত ডিজিটাল মানি রিসিপ্ট। এই রশিদের যাবতীয় তথ্য দাখিল ২০১২ ব্যাচ কল্যাণ পোর্টালের ডাটাবেসে স্থায়ীভাবে সংরক্ষিত রয়েছে।<br>
      সত্যতা যাচাই করতে ভিজিট করুন: https://dakhil2012khulna.org | ভেরিফিকেশন আইডি: ${data.receiptNo}
    </div>
  </div>
</body>
</html>`;
}

export async function generateReceiptPdfBuffer(contributionId: string): Promise<ReceiptPdfResult> {
  const contribution = await prisma.monthlyContribution.findUnique({
    where: { id: contributionId },
    include: {
      fund: true,
      user: true,
      verifiedBy: { select: { id: true, name: true, role: true } },
    },
  });

  if (!contribution) {
    throw new Error("অনুদানের তথ্য পাওয়া যায়নি।");
  }

  const receiptNo = `RCPT-${contribution.monthYear.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, "")}-${contribution.id.slice(-6).toUpperCase()}`;
  const amountPaidNum = Number(contribution.amountPaid);
  const amountPaidFormatted = formatCurrency(amountPaidNum);
  const submissionDate = formatBengaliDate(contribution.createdAt);
  const approvalDate = contribution.verifiedAt ? formatBengaliDateTime(contribution.verifiedAt) : null;

  const html = generateReceiptHtml({
    receiptNo,
    donorName: contribution.user.name,
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
