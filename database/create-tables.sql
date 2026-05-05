-- ============================================================
-- SQL Script: สร้างตาราง property_notes, property_disputes และ property_change_logs
-- รัน Query นี้ใน DBeaver หรือ SQL Editor ของคุณ
-- ============================================================

-- ─── 1. ตาราง property_notes (บันทึกหมายเหตุ) ────────────────────────────

CREATE TABLE IF NOT EXISTS property_notes (
  id           SERIAL PRIMARY KEY,
  property_id  INTEGER     NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL DEFAULT '',
  category     TEXT        NOT NULL DEFAULT 'general',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_property_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_property_notes_updated_at ON property_notes;
CREATE TRIGGER trg_property_notes_updated_at
  BEFORE UPDATE ON property_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_property_notes_updated_at();

CREATE INDEX IF NOT EXISTS idx_property_notes_property_id ON property_notes(property_id);

ALTER TABLE property_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'property_notes'
    AND policyname = 'Allow all access to property_notes'
  ) THEN
    CREATE POLICY "Allow all access to property_notes"
      ON property_notes FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 3. ตาราง property_change_logs (ประวัติการแก้ไขข้อมูลที่พัก) ───────────

CREATE TABLE IF NOT EXISTS property_change_logs (
  id             SERIAL PRIMARY KEY,
  property_id    INTEGER     NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  house_id       TEXT        NOT NULL,
  actor_username TEXT        NOT NULL,
  action         TEXT        NOT NULL CHECK (action IN ('create', 'update')),
  changed_fields JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_change_logs_property_id
  ON property_change_logs(property_id);

CREATE INDEX IF NOT EXISTS idx_property_change_logs_created_at
  ON property_change_logs(created_at DESC);

GRANT ALL ON property_change_logs TO web_anon;
GRANT USAGE, SELECT ON SEQUENCE property_change_logs_id_seq TO web_anon;

ALTER TABLE property_change_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'property_change_logs'
    AND policyname = 'Allow all access to property_change_logs'
  ) THEN
    CREATE POLICY "Allow all access to property_change_logs"
      ON property_change_logs FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 2. ตาราง property_disputes (คำถามที่พบบ่อย / FAQ) ───────────────────

CREATE TABLE IF NOT EXISTS property_disputes (
  id           SERIAL PRIMARY KEY,
  property_id  INTEGER     NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  complaint    TEXT        NOT NULL,
  response     TEXT        NOT NULL DEFAULT '',
  category     TEXT        NOT NULL DEFAULT 'general',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_property_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_property_disputes_updated_at ON property_disputes;
CREATE TRIGGER trg_property_disputes_updated_at
  BEFORE UPDATE ON property_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_property_disputes_updated_at();

CREATE INDEX IF NOT EXISTS idx_property_disputes_property_id ON property_disputes(property_id);

ALTER TABLE property_disputes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'property_disputes'
    AND policyname = 'Allow all access to property_disputes'
  ) THEN
    CREATE POLICY "Allow all access to property_disputes"
      ON property_disputes FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END $$;
