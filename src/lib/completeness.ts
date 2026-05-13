import type { PropertyField } from "./types";

export interface CompletenessResult {
  percent: number;
  filledCount: number;
  totalCount: number;
  breakdown: Record<string, number>;
}

// ─── Helper: quality-tier score ────────────────────────────────────────────
function qualityScore(
  text: unknown,
  tiers: Array<{ min: number; pts: number }>
): number {
  const len = (typeof text === "string" ? text.trim() : "").length;
  const sorted = [...tiers].sort((a, b) => b.min - a.min);
  for (const t of sorted) {
    if (len >= t.min) return t.pts;
  }
  return 0;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isSet(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "";
}

function arrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

// ─── Weighted scoring per pool_villa_progress_logic.md ─────────────────────
export function calculateCompleteness(
  _fields: PropertyField[],
  data: Record<string, unknown>
): CompletenessResult {
  let score = 0;
  const breakdown: Record<string, number> = {};

  // ── Section 1: ข้อมูลทั่วไป (19%) ─────────────────────────────────────
  // 1.1 รหัสบ้าน — house_id is stored at property level; passed via data as house_id or falls back to empty
  const houseIdLen = str(data.house_id ?? data.house_code ?? "").length;
  const s1_1 = houseIdLen >= 2 ? 2 : 0;
  score += s1_1; breakdown["house_id"] = s1_1;

  // 1.2 ชื่อที่พัก
  const s1_2 = qualityScore(data.house_name, [{ min: 5, pts: 5 }, { min: 1, pts: 2 }]);
  score += s1_2; breakdown["house_name"] = s1_2;

  // 1.3 รายละเอียดที่พัก
  const s1_3 = qualityScore(data.description, [
    { min: 150, pts: 8 }, { min: 80, pts: 5 }, { min: 30, pts: 2 },
  ]);
  score += s1_3; breakdown["description"] = s1_3;

  // 1.4 ค่าประกัน / มัดจำ
  const deposit = num(data.deposit_amount);
  const s1_4 = deposit !== null && deposit > 0 ? 3 : 0;
  score += s1_4; breakdown["deposit_amount"] = s1_4;

  // 1.5 วันที่อัพเดตภาพล่าสุด
  const s1_5 = isSet(data.last_photo_updated) ? 1 : 0;
  score += s1_5; breakdown["last_photo_updated"] = s1_5;

  // ── Section 2: ที่ตั้ง / แผนที่ (12%) ──────────────────────────────────
  // 2.1 โซน / พื้นที่
  const s2_1 = isSet(data.zone) ? 3 : 0;
  score += s2_1; breakdown["zone"] = s2_1;

  // 2.2 Google Maps link
  const gm = str(data.google_maps_url);
  const s2_2 = gm.startsWith("http") && gm.length > 10 ? 4 : 0;
  score += s2_2; breakdown["google_maps_url"] = s2_2;

  // 2.3 ระยะห่างจากทะเล
  const seaDist = num(data.distance_to_sea_km);
  const s2_3 = seaDist !== null && seaDist >= 0 ? 2 : 0;
  score += s2_3; breakdown["distance_to_sea_km"] = s2_3;

  // 2.4 ชื่อทะเล/หาด
  const s2_4 = str(data.beach_name).length >= 3 ? 1 : 0;
  score += s2_4; breakdown["beach_name"] = s2_4;

  // 2.5 ประเภทการติดทะเล (multiselect)
  const s2_5 = arrLen(data.sea_type) > 0 ? 2 : 0;
  score += s2_5; breakdown["sea_type"] = s2_5;

  // ── Section 3: ความจุ / พื้นที่ใช้สอย (18%) ───────────────────────────
  // 3.1 รองรับผู้เข้าพักสูงสุด
  const maxGuests = num(data.max_guests);
  const s3_1 = maxGuests !== null && maxGuests > 0 ? 7 : 0;
  score += s3_1; breakdown["max_guests"] = s3_1;

  // 3.2 จำนวนห้องนอน
  const totalBedrooms = num(data.total_bedrooms);
  const s3_2 = totalBedrooms !== null && totalBedrooms > 0 ? 3 : 0;
  score += s3_2; breakdown["total_bedrooms"] = s3_2;

  // 3.3 จำนวนห้องน้ำรวม
  const totalBath = num(data.total_bathrooms);
  const s3_3 = totalBath !== null && totalBath > 0 ? 2 : 0;
  score += s3_3; breakdown["total_bathrooms"] = s3_3;

  // 3.4 ห้องน้ำในตัว
  const s3_4 = isSet(data.bedrooms_with_ensuite) ? 1 : 0;
  score += s3_4; breakdown["bedrooms_with_ensuite"] = s3_4;

  // 3.5 ห้องน้ำส่วนกลาง
  const s3_5 = isSet(data.common_bathroom_count) ? 1 : 0;
  score += s3_5; breakdown["common_bathroom_count"] = s3_5;

  // 3.6 จำนวนชั้น
  const floors = num(data.total_floors);
  const s3_6 = floors !== null && floors > 0 ? 1 : 0;
  score += s3_6; breakdown["total_floors"] = s3_6;

  // 3.7 Toggle ที่นอนเสริม
  const s3_7 = isSet(data.extra_bed_available) ? 1 : 0;
  score += s3_7; breakdown["extra_bed_available"] = s3_7;

  // 3.8 รายละเอียดที่นอนเสริม (Conditional)
  if (data.extra_bed_available === true) {
    const s3_8 = str(data.extra_bed_details).length >= 20 ? 2 : 0;
    score += s3_8; breakdown["extra_bed_details"] = s3_8;
  } else {
    score += 2; breakdown["extra_bed_details"] = 2;
  }

  // ── Section 4: สระว่ายน้ำ (10%) ────────────────────────────────────────
  if (data.has_pool === false) {
    score += 10; breakdown["pool_section"] = 10;
  } else {
    let poolScore = 0;
    // 4.1 Toggle มีสระ set
    poolScore += 2;
    // 4.2 ประเภทน้ำสระ
    poolScore += isSet(data.pool_water_type) ? 2 : 0;
    // 4.3 ขนาดสระ
    poolScore += str(data.pool_size).length >= 3 ? 2 : 0;
    // 4.4 ความลึก
    const dMin = num(data.pool_depth_min_cm);
    const dMax = num(data.pool_depth_max_cm);
    poolScore += (dMin !== null && dMin > 0 && dMax !== null && dMax > 0) ? 1 : 0;
    // 4.5 เวลาเปิด-ปิดสระ
    poolScore += (isSet(data.pool_light_on) && isSet(data.pool_light_off)) ? 2 : 0;
    // 4.6 เสื้อชูชีพ
    poolScore += isSet(data.pool_lifejacket) ? 1 : 0;
    score += poolScore; breakdown["pool_section"] = poolScore;
  }

  // ── Section 5: ที่จอดรถ (6%) ───────────────────────────────────────────
  const s5_1 = isSet(data.parking_total_max) ? 2 : 0;
  score += s5_1; breakdown["parking_total_max"] = s5_1;
  const s5_2 = isSet(data.parking_indoor_count) ? 2 : 0;
  score += s5_2; breakdown["parking_indoor_count"] = s5_2;
  const s5_3 = isSet(data.parking_outdoor_count) ? 2 : 0;
  score += s5_3; breakdown["parking_outdoor_count"] = s5_3;

  // ── Section 6: สิ่งอำนวยความสะดวก (10%) ────────────────────────────────
  // Count all boolean/multiselect facility fields that are "true" or non-empty
  const facilityKeys = [
    "wifi", "air_conditioning", "smart_tv", "karaoke", "fitness_room",
    "game_room", "bbq_grill", "cctv", "security_guard", "elevator",
    "wheelchair_accessible", "pool_fence", "garden_area", "pool_heated",
    "backup_power",
  ];
  const multiselectFacilityKeys = [
    "kitchen_equipment", "laundry_equipment", "safety_equipment",
    "baby_equipment", "provided_consumables", "bathroom_amenities",
    "outdoor_features", "bed_types",
  ];
  let checkedCount = 0;
  for (const k of facilityKeys) {
    if (data[k] === true) checkedCount++;
  }
  for (const k of multiselectFacilityKeys) {
    if (arrLen(data[k]) > 0) checkedCount++;
  }
  const totalFacilityItems = facilityKeys.length + multiselectFacilityKeys.length;
  let s6: number;
  if (checkedCount === 0) s6 = 0;
  else if (checkedCount <= 5) s6 = 2;
  else s6 = Math.min(10, Math.round((checkedCount / totalFacilityItems) * 10));
  score += s6; breakdown["facilities_section"] = s6;

  // ── Section 7: กฎ / ข้อปฏิบัติ (12%) ──────────────────────────────────
  // 7.1 กฎระเบียบ (additional_rules)
  const s7_1 = qualityScore(data.additional_rules, [
    { min: 200, pts: 8 }, { min: 100, pts: 6 }, { min: 50, pts: 4 }, { min: 1, pts: 2 },
  ]);
  score += s7_1; breakdown["additional_rules"] = s7_1;

  // 7.2 เวลาเช็คอิน
  const s7_2 = isSet(data.checkin_time) ? 2 : 0;
  score += s7_2; breakdown["checkin_time"] = s7_2;

  // 7.3 เวลาเช็คเอาท์
  const s7_3 = isSet(data.checkout_time) ? 2 : 0;
  score += s7_3; breakdown["checkout_time"] = s7_3;

  // 7.4 อนุญาตสัตว์เลี้ยง
  const s7_4 = isSet(data.pets_allowed) ? 0.5 : 0;
  score += s7_4; breakdown["pets_allowed"] = s7_4;

  // 7.5 ค่าสัตว์เลี้ยง (Conditional)
  if (data.pets_allowed === true) {
    const s7_5 = str(data.pet_fee_details).length >= 10 ? 0.5 : 0;
    score += s7_5; breakdown["pet_fee_details"] = s7_5;
  } else {
    score += 0.5; breakdown["pet_fee_details"] = 0.5;
  }

  // 7.6 ค่าเช็คอินก่อน/หลังเวลา
  const s7_6 =
    (isSet(data.early_checkin_available) && isSet(data.late_checkout_available)) ? 0.5 : 0;
  score += s7_6; breakdown["early_late_checkout"] = s7_6;

  // 7.7 ห้ามส่งเสียงดังหลังเวลา
  const s7_7 = isSet(data.quiet_hours_start) ? 0.5 : 0;
  score += s7_7; breakdown["quiet_hours_start"] = s7_7;

  // ── Section 8: Nice to Have (20%) ──────────────────────────────────────
  // 8.1 รายละเอียดห้องนอน — bedroom_details textarea
  const s8_1 = qualityScore(data.bedroom_details, [
    { min: 30, pts: 8 }, { min: 10, pts: 4 },
  ]);
  score += s8_1; breakdown["bedroom_details"] = s8_1;

  // 8.2 ร้านสะดวกซื้อ / ร้านอาหารใกล้เคียง (nearby_convenience multiselect)
  const shopCount = arrLen(data.nearby_convenience);
  const s8_2 = shopCount >= 3 ? 5 : shopCount >= 1 ? 3 : 0;
  score += s8_2; breakdown["nearby_convenience"] = s8_2;

  // 8.3 รายละเอียดห้องน้ำส่วนกลาง
  const commonBath = num(data.common_bathroom_count);
  const s8_3 = (commonBath === null || commonBath <= 0)
    ? 2  // ไม่มีห้องน้ำกลาง = ข้อมูลครบ
    : isSet(data.bathroom_floor) ? 2 : 0;
  score += s8_3; breakdown["bathroom_floor"] = s8_3;

  // 8.4 อนุญาตสูบบุหรี่ภายนอก
  const s8_4 = isSet(data.smoking_allowed) ? 1 : 0;
  score += s8_4; breakdown["smoking_allowed"] = s8_4;

  // 8.5 ระยะทางร้านใกล้เคียง
  const s8_5 = isSet(data.distance_to_city_km) ? 1 : 0;
  score += s8_5; breakdown["distance_to_city_km"] = s8_5;

  // ── Count filled fields for display ────────────────────────────────────
  const allScoredKeys = Object.keys(breakdown);
  const filledCount = allScoredKeys.filter((k) => (breakdown[k] ?? 0) > 0).length;
  const totalCount = allScoredKeys.length;

  return {
    percent: Math.min(100, Math.round(score)),
    filledCount,
    totalCount,
    breakdown,
  };
}
