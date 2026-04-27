-- ═══════════════════════════════════════════════════════════════════════════════
-- Property Disputes (ข้อมูลโต้แย้งเชิงลบ) Table
-- Run this in your database SQL editor
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS property_disputes (
  id           SERIAL PRIMARY KEY,
  property_id  INTEGER     NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  dispute_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  category     TEXT        NOT NULL DEFAULT 'ร้องเรียน',
  status       TEXT        NOT NULL DEFAULT 'รอดำเนินการ',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every UPDATE
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

-- Index for fast lookup by property
CREATE INDEX IF NOT EXISTS idx_property_disputes_property_id ON property_disputes(property_id);
CREATE INDEX IF NOT EXISTS idx_property_disputes_date ON property_disputes(dispute_date DESC);

COMMENT ON TABLE property_disputes IS 'ข้อมูลโต้แย้งเชิงลบ: ข้อร้องเรียน ข้อพิพาท หรือข้อมูลเชิงลบที่เกี่ยวข้องกับที่พัก';

-- Enable RLS (Row Level Security)
ALTER TABLE property_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to property_disputes"
  ON property_disputes
  FOR ALL
  USING (true)
  WITH CHECK (true);
