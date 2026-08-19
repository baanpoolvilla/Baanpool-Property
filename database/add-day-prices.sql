-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: เพิ่มฟิลด์ "ราคาขายบ้าน รายวัน" (จ อ พ พฤ ศ ส อา)
-- รัน Query นี้ใน DBeaver / SQL Editor (chatbot > public)
-- Safe to re-run — ใช้ ON CONFLICT / UPDATE ด้วยค่าคงที่
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. ขยับ order_index ของฟิลด์ราคาเดิม เพื่อเว้นช่อง 90–96 ให้ราคารายวัน ──
UPDATE property_fields AS f
SET    order_index = v.order_index
FROM (VALUES
  ('price_weekday',      97),
  ('price_weekend',      98),
  ('price_holiday',      99),
  ('price_long_weekend', 100),
  ('price_new_year',     101),
  ('price_songkran',     102),
  ('minimum_nights',     103),
  ('deposit_amount',     104),
  ('cleaning_fee',       105),
  ('pricing_notes',      106)
) AS v(field_key, order_index)
WHERE f.field_key = v.field_key
  AND f.section   = 'pricing';

-- ─── 2. เพิ่มฟิลด์ราคารายวัน จันทร์ → อาทิตย์ ─────────────────────────────
INSERT INTO property_fields
  (field_key, label, type, section, required, options, order_index, is_active)
VALUES
  ('price_mon', 'ราคา วันจันทร์ (บาท/คืน)',    'number', 'pricing', false, NULL, 90, true),
  ('price_tue', 'ราคา วันอังคาร (บาท/คืน)',    'number', 'pricing', false, NULL, 91, true),
  ('price_wed', 'ราคา วันพุธ (บาท/คืน)',       'number', 'pricing', false, NULL, 92, true),
  ('price_thu', 'ราคา วันพฤหัสบดี (บาท/คืน)',  'number', 'pricing', false, NULL, 93, true),
  ('price_fri', 'ราคา วันศุกร์ (บาท/คืน)',      'number', 'pricing', false, NULL, 94, true),
  ('price_sat', 'ราคา วันเสาร์ (บาท/คืน)',      'number', 'pricing', false, NULL, 95, true),
  ('price_sun', 'ราคา วันอาทิตย์ (บาท/คืน)',    'number', 'pricing', false, NULL, 96, true)
ON CONFLICT (field_key) DO UPDATE
SET label       = EXCLUDED.label,
    type        = EXCLUDED.type,
    section     = EXCLUDED.section,
    required    = EXCLUDED.required,
    options     = EXCLUDED.options,
    order_index = EXCLUDED.order_index,
    is_active   = EXCLUDED.is_active;

-- ─── 3. ตรวจผลลัพธ์ ────────────────────────────────────────────────────────
SELECT field_key, label, order_index
FROM   property_fields
WHERE  section = 'pricing'
ORDER  BY order_index;

-- ═══════════════════════════════════════════════════════════════════════════
-- หลังรันไฟล์นี้: รัน database/migrate-generated-columns.sql อีกครั้ง
-- เพื่อสร้าง generated column price_mon … price_sun บนตาราง properties
-- ═══════════════════════════════════════════════════════════════════════════
