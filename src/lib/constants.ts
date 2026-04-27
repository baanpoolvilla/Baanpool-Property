import { SectionConfig } from "./types";

// ─── Section definitions (display order & labels) ──────────────────────────

export const SECTIONS: SectionConfig[] = [
  { key: "basic_info", label: "ข้อมูลทั่วไป", icon: "info", order: 0 },
  { key: "location", label: "ที่ตั้ง / แผนที่", icon: "map-pin", order: 1 },
  { key: "rooms", label: "ห้องนอน / ห้องน้ำ", icon: "bed", order: 2 },
  { key: "capacity", label: "ความจุ / พื้นที่ใช้สอย", icon: "users", order: 3 },
  { key: "pool", label: "สระว่ายน้ำ", icon: "waves", order: 4 },
  { key: "parking", label: "ที่จอดรถ", icon: "car", order: 5 },
  { key: "facilities", label: "สิ่งอำนวยความสะดวก", icon: "building", order: 6 },
  { key: "equipment", label: "เครื่องใช้ / อุปกรณ์เสริม", icon: "wrench", order: 7 },
  { key: "utilities", label: "สาธารณูปโภค / ค่าใช้จ่าย", icon: "zap", order: 8 },
  { key: "rules", label: "กฎ / ข้อปฏิบัติ", icon: "shield", order: 9 },
  { key: "time_rules", label: "เวลา / เสียง / แสงไฟ", icon: "clock", order: 10 },
  { key: "contact", label: "ผู้ดูแล / ติดต่อ", icon: "phone", order: 11 },
];

export const FIELD_TYPES = [
  { value: "text", label: "ข้อความ" },
  { value: "number", label: "ตัวเลข" },
  { value: "boolean", label: "เปิด/ปิด (สวิตช์)" },
  { value: "select", label: "ตัวเลือกเดียว (Dropdown)" },
  { value: "textarea", label: "ข้อความยาว" },
  { value: "multiselect", label: "เลือกได้หลายรายการ" },
] as const;
