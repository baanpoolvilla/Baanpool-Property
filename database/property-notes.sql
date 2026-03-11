-- ═══════════════════════════════════════════════════════════════════════════════
-- Property Notes / Maintenance Log Table
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS property_notes (
  id           SERIAL PRIMARY KEY,
  property_id  INTEGER     NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL DEFAULT '',
  category     TEXT        NOT NULL DEFAULT 'ทั่วไป',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every UPDATE
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

-- Index for fast lookup by property
CREATE INDEX IF NOT EXISTS idx_property_notes_property_id ON property_notes(property_id);

COMMENT ON TABLE property_notes IS 'Per-property maintenance notes and case logs (e.g. water leak, fix instructions, contacts).';

-- Enable RLS (Row Level Security) but allow all for now
ALTER TABLE property_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to property_notes"
  ON property_notes
  FOR ALL
  USING (true)
  WITH CHECK (true);
