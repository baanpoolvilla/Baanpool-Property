-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: อัพเดต Property Fields v2 - April 2026
-- Run in DBeaver: chatbot > public schema
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── basic_info: แก้ label + เพิ่มวันที่อัพเดตภาพ ────────────────────────
UPDATE property_fields SET label = 'ขนาดพื้นที่ดิน (ตร.ว)' WHERE field_key = 'land_size_sqm';

INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active)
VALUES ('last_photo_updated', 'วันที่อัพเดตภาพล่าสุด', 'text', 'basic_info', false, NULL, 10, true)
ON CONFLICT (field_key) DO UPDATE SET label = EXCLUDED.label, section = EXCLUDED.section, is_active = true;

-- ─── location: ลบทั้งหมด เพิ่มใหม่ ─────────────────────────────────────
DELETE FROM property_fields WHERE section = 'location';

INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('zone',                   'โซน / พื้นที่',                               'select',      'location', true,  '["บางแสน","พัทยา","สัตหีบ","ระยอง"]',                                                                                         10, true),
('sea_type',               'ประเภทการติดทะเล',                           'multiselect', 'location', false, '["Beachfront (ติดทะเลจริงๆ)","Beachfront (มีถนนกั้น)","Seaview","ทะเลเล่นได้","ทะเลชมวิว"]',                                   11, true),
('distance_to_sea_km',     'ระยะห่างจากทะเล (กม.)',                      'number',      'location', false, NULL,                                                                                                                            12, true),
('google_maps_url',        'ลิงก์ Google Maps ที่พัก',                   'text',        'location', false, NULL,                                                                                                                            13, true),
('ev_station_distance_km', 'ระยะทางจากปั๊ม EV ที่ใกล้ที่สุด (กม.)',    'number',      'location', false, NULL,                                                                                                                            14, true),
('ev_station_map_url',     'ลิงก์ Google Maps ปั๊ม EV',                  'text',        'location', false, NULL,                                                                                                                            15, true);

-- ─── parking: ลบทั้งหมด เพิ่มใหม่ ──────────────────────────────────────
DELETE FROM property_fields WHERE section = 'parking';

INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('parking_total_max',     'จำนวนที่จอดรถสูงสุด (คัน)',                   'number',  'parking', false, NULL, 55, true),
('parking_indoor_count',  'จอดรถในบ้าน (คัน)',                           'number',  'parking', false, NULL, 56, true),
('parking_outdoor_count', 'จอดรถหน้าบ้าน / ถนน (คัน)',                  'number',  'parking', false, NULL, 57, true),
('ev_charger_available',  'มีที่ชาร์จรถ EV',                             'boolean', 'parking', false, NULL, 58, true),
('ev_charger_details',    'รายละเอียดที่ชาร์จ EV (ค่าบริการ / วิธีใช้)', 'textarea','parking', false, NULL, 59, true);

-- ─── pool / pool_outdoor: ลบทั้งหมด เพิ่มใหม่ ───────────────────────────
DELETE FROM property_fields WHERE section IN ('pool', 'pool_outdoor');

INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('has_pool',          'มีสระว่ายน้ำ',                        'boolean', 'pool', true,  NULL,                            40, true),
('pool_water_type',   'ประเภทน้ำในสระ',                      'select',  'pool', false, '["คลอรีน","เกลือ","น้ำแร่"]',  41, true),
('pool_depth_min_cm', 'ความลึกขั้นต่ำ (ซม.)',                'number',  'pool', false, NULL,                            42, true),
('pool_depth_max_cm', 'ความลึกสูงสุด (ซม.)',                 'number',  'pool', false, NULL,                            43, true),
('pool_size',         'ขนาดสระ (เช่น กว้าง 4 x ยาว 8 เมตร)', 'text',   'pool', false, NULL,                            44, true),
('pool_light_on',     'เวลาเปิดไฟสระ (เช่น 18:00)',          'text',    'pool', false, NULL,                            45, true),
('pool_light_off',    'เวลาปิดไฟสระ (เช่น 22:00)',           'text',    'pool', false, NULL,                            46, true),
('pool_lifejacket',   'มีเสื้อชูชีพให้',                     'boolean', 'pool', false, NULL,                            47, true);

-- ─── capacity: เพิ่ม ที่นอนเสริม ───────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active)
VALUES
  ('extra_bed_available', 'มีที่นอนเสริม', 'boolean', 'capacity', false, NULL, 36, true),
  ('extra_bed_details',   'รายละเอียดที่นอนเสริม (ประเภท / จำนวน)', 'textarea', 'capacity', false, NULL, 37, true)
ON CONFLICT (field_key) DO UPDATE SET label = EXCLUDED.label, section = EXCLUDED.section, is_active = true;

-- ─── rules: แก้ไข smoking + เพิ่ม fields ─────────────────────────────
UPDATE property_fields
SET label = 'อนุญาตสูบบุหรี่เฉพาะภายนอกบ้านเท่านั้น', type = 'boolean'
WHERE field_key = 'smoking_allowed';

INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active)
VALUES
  ('pet_fee_details',            'รายละเอียดค่าใช้จ่ายสัตว์เลี้ยง',           'textarea', 'rules', false, NULL, 112, true),
  ('late_checkout_fee_per_hour', 'ค่าเช็คเอาท์หลังเวลา (บาท / ชั่วโมง)',      'number',   'rules', false, NULL, 116, true),
  ('noise_curfew_time',          'ห้ามส่งเสียงดังนอกอาคารหลังเวลา (เช่น 22:00)', 'text',  'rules', false, NULL, 117, true)
ON CONFLICT (field_key) DO UPDATE SET label = EXCLUDED.label, section = EXCLUDED.section, is_active = true;

COMMIT;
