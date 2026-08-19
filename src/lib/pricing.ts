// ─── ราคาขายบ้านรายวัน (จ–อา) ──────────────────────────────────────────────
// เก็บเป็น field แยกใน data JSONB (price_mon … price_sun) เพื่อให้ export /
// change log / API แชทบอท ใช้งานได้เหมือนฟิลด์ปกติ

export interface DayPriceDef {
  /** field_key ใน property_fields */
  key: string;
  /** ตัวย่อสำหรับหัวตาราง เช่น จ, อ, พ */
  short: string;
  /** ชื่อเต็มภาษาไทย */
  label: string;
  /** วันหยุดสุดสัปดาห์ (ศุกร์–อาทิตย์) — ใช้เน้นสีในตาราง */
  weekend: boolean;
}

/** เรียงตามสัปดาห์ไทย: จันทร์ → อาทิตย์ */
export const DAY_PRICE_FIELDS: DayPriceDef[] = [
  { key: "price_mon", short: "จ", label: "จันทร์", weekend: false },
  { key: "price_tue", short: "อ", label: "อังคาร", weekend: false },
  { key: "price_wed", short: "พ", label: "พุธ", weekend: false },
  { key: "price_thu", short: "พฤ", label: "พฤหัสบดี", weekend: false },
  { key: "price_fri", short: "ศ", label: "ศุกร์", weekend: true },
  { key: "price_sat", short: "ส", label: "เสาร์", weekend: true },
  { key: "price_sun", short: "อา", label: "อาทิตย์", weekend: true },
];

export const DAY_PRICE_KEYS: string[] = DAY_PRICE_FIELDS.map((d) => d.key);

/** index ตาม Date.getDay() (0 = อาทิตย์) */
const KEY_BY_JS_DAY = [
  "price_sun",
  "price_mon",
  "price_tue",
  "price_wed",
  "price_thu",
  "price_fri",
  "price_sat",
];

/** แปลงค่าใน data ให้เป็นตัวเลข — คืน null ถ้าไม่มีค่า/ไม่ใช่ตัวเลข */
export function toPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** ราคาทั้ง 7 วัน เรียง จันทร์ → อาทิตย์ */
export function getDayPrices(data: Record<string, unknown>): (number | null)[] {
  return DAY_PRICE_FIELDS.map((d) => toPrice(data[d.key]));
}

/** ช่วงราคาต่ำสุด–สูงสุดของสัปดาห์ — คืน null ถ้ายังไม่กรอกวันไหนเลย */
export function getPriceRange(
  data: Record<string, unknown>
): { min: number; max: number } | null {
  const prices = getDayPrices(data).filter((p): p is number => p !== null);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/**
 * ราคาของวันที่กำหนด (ค่าเริ่มต้น = วันนี้)
 * ถ้ายังไม่ได้กรอกราคารายวัน จะ fallback ไปที่ price_weekend (ศ–ส) / price_weekday
 */
export function getPriceForDate(
  data: Record<string, unknown>,
  date: Date = new Date()
): number | null {
  const jsDay = date.getDay();
  const direct = toPrice(data[KEY_BY_JS_DAY[jsDay]]);
  if (direct !== null) return direct;

  const isWeekend = jsDay === 5 || jsDay === 6; // ศุกร์, เสาร์
  return toPrice(isWeekend ? data.price_weekend : data.price_weekday);
}

/** 4500 → "4,500" */
export function formatPrice(value: number): string {
  return value.toLocaleString("th-TH");
}
