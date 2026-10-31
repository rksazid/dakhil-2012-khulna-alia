import { toBengaliNumber } from "@/lib/utils";

export const BENGALI_MONTHS = [
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
] as const;

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function fromBengaliDigits(str: string | number): string {
  let s = String(str);
  BENGALI_DIGITS.forEach((bd, idx) => {
    s = s.replaceAll(bd, String(idx));
  });
  return s;
}

export interface ParsedMonthYear {
  monthName: string;
  monthIndex: number; // 0 to 11
  year: number; // 4-digit full year (e.g. 2026, 2027)
  yearSuffix: string; // 2-digit Bengali year suffix (e.g. "২৬", "২৭")
}

export function parseMonthYear(monthYearStr: string): ParsedMonthYear | null {
  if (!monthYearStr || typeof monthYearStr !== "string") return null;
  const parts = monthYearStr.split("-");
  if (parts.length < 2) return null;

  const monthName = parts[0].trim();
  const yearSuffix = parts[1].trim();
  const monthIndex = BENGALI_MONTHS.indexOf(monthName as typeof BENGALI_MONTHS[number]);
  if (monthIndex === -1) return null;

  const englishYearNum = parseInt(fromBengaliDigits(yearSuffix), 10);
  if (isNaN(englishYearNum)) return null;

  const fullYear = englishYearNum < 100 ? 2000 + englishYearNum : englishYearNum;

  return {
    monthName,
    monthIndex,
    year: fullYear,
    yearSuffix,
  };
}

export function formatMonthYear(monthIndex: number, fullYear: number): string {
  const safeMonthIndex = ((monthIndex % 12) + 12) % 12;
  const monthName = BENGALI_MONTHS[safeMonthIndex];
  const year2Digit = fullYear % 100;
  const yearSuffix = toBengaliNumber(year2Digit.toString().padStart(2, "0"));
  return `${monthName}-${yearSuffix}`;
}

export function getNextMonthYear(currentMonthYear: string): string {
  const parsed = parseMonthYear(currentMonthYear);
  if (!parsed) return currentMonthYear;

  let nextMonthIndex = parsed.monthIndex + 1;
  let nextYear = parsed.year;
  if (nextMonthIndex >= 12) {
    nextMonthIndex = 0;
    nextYear += 1;
  }
  return formatMonthYear(nextMonthIndex, nextYear);
}

export function getPreviousMonthYear(currentMonthYear: string): string {
  const parsed = parseMonthYear(currentMonthYear);
  if (!parsed) return currentMonthYear;

  let prevMonthIndex = parsed.monthIndex - 1;
  let prevYear = parsed.year;
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevYear -= 1;
  }
  return formatMonthYear(prevMonthIndex, prevYear);
}

// Generate continuous sequential list of months between start and end
export function generateMonthSequence(startMonthYear: string, endMonthYear: string): string[] {
  const start = parseMonthYear(startMonthYear);
  const end = parseMonthYear(endMonthYear);

  if (!start || !end) return [startMonthYear];

  const results: string[] = [];
  let currYear = start.year;
  let currMonth = start.monthIndex;

  const targetLimitMonths = (end.year - start.year) * 12 + (end.monthIndex - start.monthIndex);
  if (targetLimitMonths < 0) return [startMonthYear];

  for (let i = 0; i <= targetLimitMonths; i++) {
    results.push(formatMonthYear(currMonth, currYear));
    currMonth++;
    if (currMonth >= 12) {
      currMonth = 0;
      currYear++;
    }
  }

  return results;
}

// Sort any arbitrary list of month-year strings chronologically
export function sortMonthYears(monthYears: string[]): string[] {
  return [...monthYears].sort((a, b) => {
    const pa = parseMonthYear(a);
    const pb = parseMonthYear(b);
    if (!pa && !pb) return 0;
    if (!pa) return -1;
    if (!pb) return 1;

    if (pa.year !== pb.year) return pa.year - pb.year;
    return pa.monthIndex - pb.monthIndex;
  });
}

// Default rolling months list starting from batch inception (October 2026)
// through the current date plus 6-12 future months
export function getDefaultRollingMonths(minCount = 12): string[] {
  const startYear = 2026;
  const startMonthIndex = 9; // October (0-indexed)

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Project at least through end of next year or minCount months ahead
  const endYear = Math.max(currentYear + 1, 2027);
  const endMonthIndex = 11; // December

  const initialList = generateMonthSequence(
    formatMonthYear(startMonthIndex, startYear),
    formatMonthYear(endMonthIndex, endYear)
  );

  return initialList.slice(0, Math.max(initialList.length, minCount));
}
