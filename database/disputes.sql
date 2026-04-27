-- ═══════════════════════════════════════════════════════════════════════════════
-- ข้อมูลโต้แย้งเชิงลบ — ฐานความรู้สำหรับแชทบอท
-- โครงสร้าง: คู่ (ข้อร้องเรียนของลูกค้า → คำชี้แจงของแชทบอท)
-- เช่น "ทำไมสระน้ำเขียว" → "สระน้ำได้รับการดูแลทุกสัปดาห์..."
-- Run this in public schema
-- ═══════════════════════════════════════════════════════════════════════════════

-- ลบตารางเก่าก่อน (ถ้ามี ทั้งใน public และ unified_chat)
DROP TABLE IF EXISTS public.property_disputes CASCADE;
DROP TABLE IF EXISTS unified_chat.property_disputes CASCADE;

-- สร้างตารางใหม่
CREATE TABLE IF NOT EXISTS public.property_disputes (
  id           SERIAL PRIMARY KEY,
  property_id  INTEGER     NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  complaint    TEXT        NOT NULL,               -- ข้อร้องเรียน/คำพูดเชิงลบที่ลูกค้าอาจพูด
  response     TEXT        NOT NULL DEFAULT '',    -- คำชี้แจงที่แชทบอทจะใช้ตอบ
  category     TEXT        NOT NULL DEFAULT 'ทั่วไป',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_property_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_property_disputes_updated_at ON public.property_disputes;
CREATE TRIGGER trg_property_disputes_updated_at
  BEFORE UPDATE ON public.property_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_disputes_updated_at();

CREATE INDEX IF NOT EXISTS idx_property_disputes_property_id ON public.property_disputes(property_id);
CREATE INDEX IF NOT EXISTS idx_property_disputes_is_active ON public.property_disputes(is_active);

COMMENT ON TABLE public.property_disputes IS 'ฐานความรู้สำหรับแชทบอท: คู่ข้อร้องเรียนลูกค้าและคำชี้แจง';
COMMENT ON COLUMN public.property_disputes.complaint IS 'ข้อร้องเรียน/คำพูดเชิงลบที่ลูกค้าอาจพูด';
COMMENT ON COLUMN public.property_disputes.response IS 'คำชี้แจง/คำตอบที่แชทบอทจะใช้ตอบลูกค้า';

-- Enable RLS
ALTER TABLE public.property_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to property_disputes" ON public.property_disputes;
CREATE POLICY "Allow all access to property_disputes"
  ON public.property_disputes
  FOR ALL
  USING (true)
  WITH CHECK (true);
