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

// Format Date to friendly Bengali text
export function formatBengaliDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const day = toBengaliNumber(d.getDate());
  const year = toBengaliNumber(d.getFullYear());
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
  const month = bengaliMonths[d.getMonth()];
  return `${day} ${month}, ${year}`;
}
