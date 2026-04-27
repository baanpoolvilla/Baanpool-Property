-- ═══════════════════════════════════════════════════════════════════════════════
-- Comprehensive Pool Villa Field Definitions (Thai Labels)
-- Run this in Supabase SQL Editor to replace all existing field definitions
-- ═══════════════════════════════════════════════════════════════════════════════

-- Clear existing fields
DELETE FROM property_fields;

-- Reset sequence
ALTER SEQUENCE property_fields_id_seq RESTART WITH 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ข้อมูลทั่วไป (basic_info)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('house_name', 'ชื่อที่พัก', 'text', 'basic_info', true, NULL, 1, true),
('property_type', 'ประเภทที่พัก', 'select', 'basic_info', true, '["พูลวิลล่า","บ้านพักตากอากาศ","คอนโด","รีสอร์ท","ทาวน์โฮม"]', 2, true),
('description', 'รายละเอียดที่พัก', 'textarea', 'basic_info', false, NULL, 3, true),
('highlight', 'จุดเด่นของที่พัก', 'textarea', 'basic_info', false, NULL, 4, true),
('house_style', 'สไตล์บ้าน', 'select', 'basic_info', false, '["โมเดิร์น","ลอฟท์","ไทยร่วมสมัย","มินิมอล","บาหลี","ทรอปิคอล"]', 5, true),
('total_floors', 'จำนวนชั้น', 'number', 'basic_info', false, NULL, 6, true),
('house_size_sqm', 'ขนาดพื้นที่ตัวบ้าน (ตร.ม.)', 'number', 'basic_info', false, NULL, 7, true),
('land_size_sqm', 'ขนาดพื้นที่ดิน (ตร.ม.)', 'number', 'basic_info', false, NULL, 8, true),
('year_built', 'ปีที่สร้าง', 'number', 'basic_info', false, NULL, 9, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ที่ตั้ง / แผนที่ (location)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('address', 'ที่อยู่เต็ม', 'textarea', 'location', true, NULL, 10, true),
('subdistrict', 'ตำบล / แขวง', 'text', 'location', false, NULL, 11, true),
('district', 'อำเภอ / เขต', 'text', 'location', false, NULL, 12, true),
('province', 'จังหวัด', 'text', 'location', true, NULL, 13, true),
('google_maps_url', 'ลิงก์ Google Maps', 'text', 'location', false, NULL, 14, true),
('nearby_landmarks', 'สถานที่ใกล้เคียง', 'textarea', 'location', false, NULL, 15, true),
('distance_to_city_km', 'ระยะห่างจากตัวเมือง (กม.)', 'number', 'location', false, NULL, 16, true),
('distance_to_airport_km', 'ระยะห่างจากสนามบิน (กม.)', 'number', 'location', false, NULL, 17, true),
('near_beach', 'ติดทะเล / ใกล้ทะเล', 'boolean', 'location', false, NULL, 18, true),
('beach_name', 'ชื่อหาด / ชายทะเลใกล้เคียง', 'text', 'location', false, NULL, 19, true),
('beach_distance_km', 'ระยะห่างจากทะเล (กม.)', 'number', 'location', false, NULL, 20, true),
('nearby_convenience', 'ร้านสะดวกซื้อ / ห้างใกล้เคียง', 'multiselect', 'location', false, '["7-Eleven","Lotus''s","Big C","Makro","แม็คโคร","ตลาดสด","ร้านอาหาร","โรงพยาบาล","ปั๊มน้ำมัน"]', 21, true),
('nearby_attractions', 'แหล่งท่องเที่ยวใกล้เคียง', 'textarea', 'location', false, NULL, 22, true),
('distance_to_beach_walk_min', 'เวลาเดินไปทะเล (นาที)', 'number', 'location', false, NULL, 23, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ห้องนอน / ห้องน้ำ (rooms)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('total_bedrooms', 'จำนวนห้องนอนทั้งหมด', 'number', 'rooms', true, NULL, 20, true),
('total_bathrooms', 'จำนวนห้องน้ำทั้งหมด', 'number', 'rooms', true, NULL, 21, true),
('bedrooms_with_ensuite', 'ห้องนอนที่มีห้องน้ำในตัว (จำนวน)', 'number', 'rooms', false, NULL, 22, true),
('bedroom_details', 'รายละเอียดห้องนอน (ขนาดเตียง, ชั้นที่ตั้ง)', 'textarea', 'rooms', false, NULL, 23, true),
('bed_types', 'ประเภทเตียง', 'multiselect', 'rooms', false, '["เตียงคิงไซส์","เตียงควีนไซส์","เตียงเดี่ยว","เตียงสองชั้น","ที่นอนญี่ปุ่น (ฟูก)","โซฟาเบด"]', 24, true),
('has_extra_mattress', 'มีที่นอนเสริมให้หรือไม่', 'boolean', 'rooms', false, NULL, 25, true),
('extra_mattress_count', 'จำนวนที่นอนเสริม', 'number', 'rooms', false, NULL, 26, true),
('common_bathroom_count', 'ห้องน้ำส่วนกลาง (จำนวน)', 'number', 'rooms', false, NULL, 27, true),
('bathroom_amenities', 'อุปกรณ์ในห้องน้ำ', 'multiselect', 'rooms', false, '["สบู่/แชมพู","ผ้าเช็ดตัว","ไดร์เป่าผม","เครื่องทำน้ำอุ่น","อ่างอาบน้ำ","ฝักบัวแยก"]', 28, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ความจุ / พื้นที่ใช้สอย (capacity)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('max_guests', 'รองรับผู้เข้าพักสูงสุด (คน)', 'number', 'capacity', true, NULL, 30, true),
('standard_guests', 'จำนวนผู้เข้าพักมาตรฐาน (คน)', 'number', 'capacity', false, NULL, 31, true),
('extra_guest_fee', 'ค่าผู้เข้าพักเพิ่ม (บาท/คน/คืน)', 'number', 'capacity', false, NULL, 32, true),
('living_areas', 'จำนวนพื้นที่นั่งเล่น', 'number', 'capacity', false, NULL, 33, true),
('kitchen_type', 'ประเภทครัว', 'select', 'capacity', false, '["ครัวเต็ม","ครัวมินิ (Kitchenette)","ไม่มีครัว"]', 34, true),
('dining_capacity', 'โต๊ะทานข้าว (จำนวนที่นั่ง)', 'number', 'capacity', false, NULL, 35, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. สระว่ายน้ำ (pool)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('has_pool', 'มีสระว่ายน้ำ', 'boolean', 'pool', true, NULL, 40, true),
('pool_type', 'ประเภทสระ', 'select', 'pool', false, '["สระส่วนตัว","สระรวม","สระบนดาดฟ้า","สระลอยฟ้า (Infinity)"]', 41, true),
('pool_size', 'ขนาดสระ (กว้าง x ยาว x ลึก เมตร)', 'text', 'pool', false, NULL, 42, true),
('pool_depth_min_cm', 'ความลึกขั้นต่ำ (ซม.)', 'number', 'pool', false, NULL, 43, true),
('pool_depth_max_cm', 'ความลึกสูงสุด (ซม.)', 'number', 'pool', false, NULL, 44, true),
('pool_heated', 'สระน้ำอุ่น', 'boolean', 'pool', false, NULL, 45, true),
('pool_light_on_time', 'เวลาเปิดไฟสระ', 'text', 'pool', false, NULL, 46, true),
('pool_light_off_time', 'เวลาปิดไฟสระ', 'text', 'pool', false, NULL, 47, true),
('pool_swim_hours', 'เวลาว่ายน้ำได้ (เช่น 06:00–22:00)', 'text', 'pool', false, NULL, 48, true),
('pool_fence', 'มีรั้วกั้นสระ', 'boolean', 'pool', false, NULL, 49, true),
('pool_cleaning_schedule', 'ตารางทำความสะอาดสระ', 'text', 'pool', false, NULL, 50, true),
('outdoor_features', 'สิ่งอำนวยความสะดวกรอบสระ', 'multiselect', 'pool', false, '["เก้าอี้อาบแดด","ร่มกันแดด","ศาลาริมสระ","จากุซซี่","เครื่องเล่นสไลเดอร์","ห่วงยาง/ของเล่นน้ำ"]', 51, true),
('garden_area', 'มีสวน / พื้นที่สีเขียว', 'boolean', 'pool', false, NULL, 52, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ที่จอดรถ (parking)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('has_parking', 'มีที่จอดรถ', 'boolean', 'parking', false, NULL, 55, true),
('parking_indoor_count', 'ที่จอดรถในร่ม (คัน)', 'number', 'parking', false, NULL, 56, true),
('parking_outdoor_count', 'ที่จอดรถกลางแจ้ง (คัน)', 'number', 'parking', false, NULL, 57, true),
('parking_total', 'รวมที่จอดรถทั้งหมด (คัน)', 'number', 'parking', false, NULL, 58, true),
('parking_ev_charger', 'มีที่ชาร์จรถ EV', 'boolean', 'parking', false, NULL, 59, true),
('parking_notes', 'หมายเหตุที่จอดรถ', 'textarea', 'parking', false, NULL, 60, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. สิ่งอำนวยความสะดวก (facilities)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('wifi', 'Wi-Fi ฟรี', 'boolean', 'facilities', false, NULL, 65, true),
('wifi_speed_mbps', 'ความเร็ว Wi-Fi (Mbps)', 'number', 'facilities', false, NULL, 66, true),
('air_conditioning', 'แอร์ทุกห้อง', 'boolean', 'facilities', false, NULL, 67, true),
('smart_tv', 'Smart TV / Netflix', 'boolean', 'facilities', false, NULL, 68, true),
('tv_count', 'จำนวนทีวี', 'number', 'facilities', false, NULL, 69, true),
('karaoke', 'คาราโอเกะ', 'boolean', 'facilities', false, NULL, 70, true),
('fitness_room', 'ห้องฟิตเนส', 'boolean', 'facilities', false, NULL, 71, true),
('game_room', 'ห้องเกม / บิลเลียด', 'boolean', 'facilities', false, NULL, 72, true),
('bbq_grill', 'เตาย่างบาร์บีคิว', 'boolean', 'facilities', false, NULL, 73, true),
('cctv', 'กล้องวงจรปิด (CCTV)', 'boolean', 'facilities', false, NULL, 74, true),
('security_guard', 'รปภ. / ยาม', 'boolean', 'facilities', false, NULL, 75, true),
('elevator', 'ลิฟท์', 'boolean', 'facilities', false, NULL, 76, true),
('wheelchair_accessible', 'รองรับวีลแชร์', 'boolean', 'facilities', false, NULL, 77, true),
('other_facilities', 'สิ่งอำนวยความสะดวกอื่นๆ', 'textarea', 'facilities', false, NULL, 78, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. เครื่องใช้ / อุปกรณ์เสริม (equipment)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('kitchen_equipment', 'เครื่องครัวที่มี', 'multiselect', 'equipment', false, '["ตู้เย็น","ไมโครเวฟ","เตาแก๊ส/เตาไฟฟ้า","หม้อหุงข้าว","กาต้มน้ำ","เครื่องชงกาแฟ","เครื่องปั่น","เครื่องล้างจาน","เตาอบ"]', 80, true),
('laundry_equipment', 'อุปกรณ์ซักผ้า', 'multiselect', 'equipment', false, '["เครื่องซักผ้า","เครื่องอบผ้า","ราวตากผ้า","เตารีด/โต๊ะรีด"]', 81, true),
('safety_equipment', 'อุปกรณ์ความปลอดภัย', 'multiselect', 'equipment', false, '["ถังดับเพลิง","เครื่องตรวจจับควัน","กล่องปฐมพยาบาล","สัญญาณกันขโมย"]', 82, true),
('baby_equipment', 'อุปกรณ์สำหรับเด็ก', 'multiselect', 'equipment', false, '["เตียงเด็ก","เก้าอี้เด็ก","รั้วกันเด็ก","อ่างอาบน้ำเด็ก"]', 83, true),
('provided_consumables', 'ของใช้ที่จัดเตรียมให้', 'multiselect', 'equipment', false, '["น้ำดื่ม","กาแฟ/ชา","สบู่/แชมพู","ผ้าเช็ดตัว","ผ้าปูที่นอน","กระดาษทิชชู่"]', 84, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ราคา / ค่าบริการ (pricing)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('price_weekday', 'ราคา วันธรรมดา (บาท/คืน)', 'number', 'pricing', true, NULL, 90, true),
('price_weekend', 'ราคา วันศุกร์–เสาร์ (บาท/คืน)', 'number', 'pricing', false, NULL, 91, true),
('price_holiday', 'ราคา วันหยุดนักขัตฤกษ์ (บาท/คืน)', 'number', 'pricing', false, NULL, 92, true),
('price_long_weekend', 'ราคา วันหยุดยาว (บาท/คืน)', 'number', 'pricing', false, NULL, 93, true),
('price_new_year', 'ราคา ช่วงปีใหม่ (บาท/คืน)', 'number', 'pricing', false, NULL, 94, true),
('price_songkran', 'ราคา ช่วงสงกรานต์ (บาท/คืน)', 'number', 'pricing', false, NULL, 95, true),
('minimum_nights', 'เข้าพักขั้นต่ำ (คืน)', 'number', 'pricing', false, NULL, 96, true),
('deposit_amount', 'ค่ามัดจำ (บาท)', 'number', 'pricing', false, NULL, 97, true),
('cleaning_fee', 'ค่าทำความสะอาด (บาท)', 'number', 'pricing', false, NULL, 98, true),
('pricing_notes', 'หมายเหตุราคา', 'textarea', 'pricing', false, NULL, 99, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. สาธารณูปโภค / ค่าใช้จ่าย (utilities)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('electricity_included', 'ค่าไฟรวมในราคาแล้ว', 'boolean', 'utilities', false, NULL, 100, true),
('electricity_rate', 'อัตราค่าไฟ (บาท/ยูนิต)', 'number', 'utilities', false, NULL, 101, true),
('water_included', 'ค่าน้ำรวมในราคาแล้ว', 'boolean', 'utilities', false, NULL, 102, true),
('water_rate', 'อัตราค่าน้ำ (บาท/ยูนิต)', 'number', 'utilities', false, NULL, 103, true),
('gas_type', 'ก๊าซหุงต้ม', 'select', 'utilities', false, '["แก๊สถัง LPG","แก๊สธรรมชาติ","ไฟฟ้า (ไม่ใช้แก๊ส)"]', 104, true),
('water_source', 'แหล่งน้ำ', 'select', 'utilities', false, '["น้ำประปา","น้ำบาดาล","น้ำประปาภูเขา"]', 105, true),
('internet_type', 'ประเภทอินเทอร์เน็ต', 'select', 'utilities', false, '["ไฟเบอร์ออปติก","4G/5G Router","ADSL"]', 106, true),
('backup_power', 'ไฟสำรอง / UPS', 'boolean', 'utilities', false, NULL, 107, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. กฎ / ข้อปฏิบัติ (rules)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('pets_allowed', 'อนุญาตสัตว์เลี้ยง', 'boolean', 'rules', false, NULL, 110, true),
('pet_fee', 'ค่าสัตว์เลี้ยง (บาท/ตัว)', 'number', 'rules', false, NULL, 111, true),
('pet_rules', 'ข้อกำหนดสัตว์เลี้ยง', 'textarea', 'rules', false, NULL, 112, true),
('smoking_allowed', 'อนุญาตสูบบุหรี่', 'select', 'rules', false, '["ไม่อนุญาต","นอกตัวบ้านเท่านั้น","อนุญาต"]', 113, true),
('party_events_allowed', 'จัดปาร์ตี้ / อีเวนต์', 'select', 'rules', false, '["ไม่อนุญาต","ได้เฉพาะปาร์ตี้เล็ก","อนุญาต"]', 114, true),
('additional_rules', 'กฎเพิ่มเติม', 'textarea', 'rules', false, NULL, 115, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. เวลา / เสียง / แสงไฟ (time_rules)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('checkin_time', 'เวลาเช็คอิน', 'text', 'time_rules', true, NULL, 120, true),
('checkout_time', 'เวลาเช็คเอาท์', 'text', 'time_rules', true, NULL, 121, true),
('early_checkin_available', 'เช็คอินก่อนเวลาได้ (ถ้าว่าง)', 'boolean', 'time_rules', false, NULL, 122, true),
('late_checkout_available', 'เช็คเอาท์หลังเวลาได้ (ถ้าว่าง)', 'boolean', 'time_rules', false, NULL, 123, true),
('late_checkout_fee', 'ค่าเช็คเอาท์หลังเวลา (บาท)', 'number', 'time_rules', false, NULL, 124, true),
('quiet_hours_start', 'ห้ามส่งเสียงดังหลังเวลา', 'text', 'time_rules', false, NULL, 125, true),
('quiet_hours_end', 'เริ่มส่งเสียงได้หลังเวลา', 'text', 'time_rules', false, NULL, 126, true),
('karaoke_hours', 'เวลาที่ใช้คาราโอเกะได้ (เช่น 10:00–22:00)', 'text', 'time_rules', false, NULL, 127, true),
('music_speaker_hours', 'เวลาที่เปิดลำโพงได้ (เช่น 08:00–22:00)', 'text', 'time_rules', false, NULL, 128, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. ผู้ดูแล / ติดต่อ (contact)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO property_fields (field_key, label, type, section, required, options, order_index, is_active) VALUES
('owner_name', 'ชื่อเจ้าของ', 'text', 'contact', false, NULL, 130, true),
('caretaker_name', 'ชื่อผู้ดูแล / แม่บ้าน', 'text', 'contact', false, NULL, 131, true),
('caretaker_phone', 'เบอร์โทรผู้ดูแล', 'text', 'contact', false, NULL, 132, true),
('emergency_phone', 'เบอร์โทรฉุกเฉิน', 'text', 'contact', false, NULL, 133, true),
('line_id', 'LINE ID ติดต่อ', 'text', 'contact', false, NULL, 134, true),
('booking_channels', 'ช่องทางการจอง', 'multiselect', 'contact', false, '["โทรศัพท์","LINE","Facebook","Airbnb","Agoda","Booking.com","เว็บไซต์ตรง"]', 135, true),
('caretaker_onsite', 'ผู้ดูแลพักอยู่ในพื้นที่/ใกล้เคียง', 'boolean', 'contact', false, NULL, 136, true),
('caretaker_response_time', 'เวลาตอบกลับโดยประมาณ', 'select', 'contact', false, '["ภายใน 5 นาที","ภายใน 15 นาที","ภายใน 30 นาที","ภายใน 1 ชั่วโมง"]', 137, true);
