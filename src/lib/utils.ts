import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type NumericLike = number | string | { toString(): string } | null | undefined;

// Convert numbers to Bengali digits
export function toBengaliNumber(num: NumericLike): string {
  if (num === undefined || num === null) return "০";
  const str = typeof num === "object" ? num.toString() : String(num);
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

// Format currency in BDT (টাকা)
export function formatCurrency(amount: NumericLike): string {
  if (amount === undefined || amount === null) return "৳০";
  const num = typeof amount === "number" ? amount : parseFloat(amount.toString());
  if (isNaN(num)) return "৳০";
  const formatted = num.toLocaleString("en-IN");
  return `৳ ${toBengaliNumber(formatted)}`;
}

// Format Date to friendly Bengali text in Asia/Dhaka (GMT+6)
export function formatBengaliDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(d);

  const dayVal = parts.find((p) => p.type === "day")?.value || "1";
  const monthVal = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10) - 1;
  const yearVal = parts.find((p) => p.type === "year")?.value || "2026";

  const bengaliMonths = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];
  return `${toBengaliNumber(dayVal)} ${bengaliMonths[monthVal]}, ${toBengaliNumber(yearVal)}`;
}

// Format Date and Time in Bengali in Asia/Dhaka (GMT+6)
export function formatBengaliDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const dateStr = formatBengaliDate(d);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(d);

  const rawHour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const rawMinute = parts.find((p) => p.type === "minute")?.value || "00";

  let period = "রাত";
  if (rawHour >= 4 && rawHour < 6) period = "ভোর";
  else if (rawHour >= 6 && rawHour < 12) period = "সকাল";
  else if (rawHour >= 12 && rawHour < 15) period = "দুপুর";
  else if (rawHour >= 15 && rawHour < 18) period = "বিকাল";
  else if (rawHour >= 18 && rawHour < 20) period = "সন্ধ্যা";

  let hour12 = rawHour % 12;
  if (hour12 === 0) hour12 = 12;

  const hoursBn = toBengaliNumber(hour12);
  const minutesBn = toBengaliNumber(rawMinute.padStart(2, "0"));

  return `${dateStr} | ${period} ${hoursBn}:${minutesBn}`;
}
