-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: เพิ่ม Generated Columns จาก JSONB data ตาม property_fields
-- รัน Query นี้ใน DBeaver (chatbot > public > properties)
-- Safe to re-run — ข้ามถ้า column มีอยู่แล้ว
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r          RECORD;
  col_type   TEXT;
  col_expr   TEXT;
  col_exists BOOLEAN;
BEGIN

  FOR r IN
    SELECT field_key, type
    FROM   property_fields
    WHERE  is_active = true
    ORDER  BY order_index
  LOOP

    -- ── กำหนด PostgreSQL type ตาม field type ──────────────────────────────
    col_type := CASE r.type
      WHEN 'number'      THEN 'NUMERIC'
      WHEN 'boolean'     THEN 'BOOLEAN'
      WHEN 'multiselect' THEN 'JSONB'
      ELSE                    'TEXT'        -- text, textarea, select
    END;

    -- ── กำหนด expression ดึงค่าจาก data JSONB ─────────────────────────────
    col_expr := CASE r.type
      WHEN 'number'      THEN '(data->>' || quote_literal(r.field_key) || ')::numeric'
      WHEN 'boolean'     THEN '(data->>' || quote_literal(r.field_key) || ')::boolean'
      WHEN 'multiselect' THEN  'data->'  || quote_literal(r.field_key)
      ELSE                     'data->>' || quote_literal(r.field_key)
    END;

    -- ── ตรวจว่า column มีแล้วหรือยัง ─────────────────────────────────────
    SELECT EXISTS (
      SELECT 1
      FROM   information_schema.columns
      WHERE  table_schema = 'public'
        AND  table_name   = 'properties'
        AND  column_name  = r.field_key
    ) INTO col_exists;

    IF col_exists THEN
      RAISE NOTICE 'SKIP  (already exists): %', r.field_key;
    ELSE
      EXECUTE format(
        'ALTER TABLE properties ADD COLUMN %I %s GENERATED ALWAYS AS (%s) STORED',
        r.field_key,
        col_type,
        col_expr
      );
      RAISE NOTICE 'ADDED %  (%)', r.field_key, col_type;
    END IF;

  END LOOP;

END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- Index สำหรับ column ที่ใช้ filter / sort บ่อย
-- (รัน AFTER DO block เสร็จแล้ว)
-- ═══════════════════════════════════════════════════════════════════════════

-- location
CREATE INDEX IF NOT EXISTS idx_properties_zone           ON properties (zone);

-- capacity / search
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms       ON properties (bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_bathrooms      ON properties (bathrooms);
CREATE INDEX IF NOT EXISTS idx_properties_max_guests     ON properties (max_guests);
CREATE INDEX IF NOT EXISTS idx_properties_floors         ON properties (floors);

-- pool
CREATE INDEX IF NOT EXISTS idx_properties_has_pool       ON properties (has_pool);
CREATE INDEX IF NOT EXISTS idx_properties_pool_depth_min ON properties (pool_depth_min_cm);
CREATE INDEX IF NOT EXISTS idx_properties_pool_depth_max ON properties (pool_depth_max_cm);

-- parking / EV
CREATE INDEX IF NOT EXISTS idx_properties_parking_total  ON properties (parking_total_max);
CREATE INDEX IF NOT EXISTS idx_properties_ev_charger     ON properties (ev_charger_available);

-- rules
CREATE INDEX IF NOT EXISTS idx_properties_pets_allowed   ON properties (pets_allowed);
CREATE INDEX IF NOT EXISTS idx_properties_smoking        ON properties (smoking_allowed);

-- multiselect: ใช้ GIN index เพื่อ @> / ? operator
CREATE INDEX IF NOT EXISTS idx_properties_sea_type_gin   ON properties USING GIN (sea_type);
CREATE INDEX IF NOT EXISTS idx_properties_amenities_gin  ON properties USING GIN (amenities);
