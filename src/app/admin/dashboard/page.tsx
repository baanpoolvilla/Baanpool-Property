"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  FileText,
  Home,
  Info,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchAllPropertyNotes, fetchProperties } from "@/lib/api";
import { calculateCompleteness } from "@/lib/completeness";
import { usePropertyFields } from "@/hooks/use-property-fields";
import type { Property, PropertyNote } from "@/lib/types";

const COMPLETE_THRESHOLD = 90;

function isUpdatedToday(isoDate: string) {
  const target = new Date(isoDate);
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

function ScoreBadge({ percent }: { percent: number }) {
  const color =
    percent >= COMPLETE_THRESHOLD
      ? "border-green-300 text-green-600"
      : percent >= 60
      ? "border-blue-300 text-blue-600"
      : "border-destructive/40 text-destructive";
  return (
    <Badge variant="outline" className={`text-[10px] ${color}`}>
      {percent}%
    </Badge>
  );
}

function ExpandablePropertyList({
  items,
  getPercent,
  showScore = true,
  emptyText,
}: {
  items: Property[];
  getPercent: (p: Property) => number;
  showScore?: boolean;
  emptyText: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 3);
  const extra = items.length - 3;

  return (
    <div className="space-y-1 min-h-[72px]">
      {items.length === 0 && (
        <div className="text-xs text-muted-foreground">{emptyText}</div>
      )}
      {visible.map((p) => (
        <Link
          key={p.id}
          href={`/admin/property/${p.id}`}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="truncate max-w-[120px]">
            {p.house_id}
          </span>
          {showScore && <ScoreBadge percent={getPercent(p)} />}
        </Link>
      ))}
      {items.length > 3 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> ย่อรายการ
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> ดูอีก {extra} รายการ
            </>
          )}
        </button>
      )}
    </div>
  );
}

function MissingFieldsHint({ percent }: { percent: number }) {
  if (percent >= COMPLETE_THRESHOLD) return null;
  return (
    <p className="text-[10px] text-muted-foreground leading-relaxed">
      {percent < 30 && "⚠️ ข้อมูลไม่เพียงพอ — กรอกข้อมูลพื้นฐานให้ครบก่อน"}
      {percent >= 30 && percent < 60 && "ข้อมูลบางส่วน — เพิ่ม Google Maps, กฎระเบียบ, เวลาเช็คอิน"}
      {percent >= 60 && percent < COMPLETE_THRESHOLD && "ใกล้สมบูรณ์ — เพิ่มร้านใกล้เคียง, รายละเอียดห้องนอน, ขนาดสระ"}
    </p>
  );
}

// ─── Scoring Guide Data ────────────────────────────────────────────────────
type Tier = { pts: string; cond: string };
type FieldRule = { label: string; pts: string; criteria: string; tiers?: Tier[]; note?: string };
type ScoringSection = {
  key: string;
  label: string;
  total: string;
  level: "critical" | "important" | "nice";
  fields: FieldRule[];
};

const SCORING_SECTIONS: ScoringSection[] = [
  {
    key: "basic",
    label: "ข้อมูลทั่วไป",
    total: "19%",
    level: "critical",
    fields: [
      { label: "รหัสบ้าน", pts: "2%", criteria: "มีค่า ≥ 2 ตัวอักษร" },
      {
        label: "ชื่อที่พัก", pts: "5%", criteria: "≥ 5 ตัวอักษร",
        tiers: [{ pts: "5%", cond: "≥ 5 ตัวอักษร" }, { pts: "2%", cond: "1–4 ตัวอักษร" }],
      },
      {
        label: "รายละเอียดที่พัก", pts: "8%", criteria: "≥ 150 ตัวอักษร",
        tiers: [
          { pts: "8%", cond: "≥ 150 ตัวอักษร" },
          { pts: "5%", cond: "80–149 ตัวอักษร" },
          { pts: "2%", cond: "30–79 ตัวอักษร" },
        ],
      },
      { label: "ค่ามัดจำ (deposit_amount)", pts: "3%", criteria: "ตัวเลข > 0" },
      { label: "วันที่อัพเดตภาพล่าสุด", pts: "1%", criteria: "มีค่า (ไม่ว่างเปล่า)" },
    ],
  },
  {
    key: "location",
    label: "ที่ตั้ง / แผนที่",
    total: "12%",
    level: "important",
    fields: [
      { label: "โซน / พื้นที่ (zone)", pts: "3%", criteria: "เลือกค่าจาก dropdown" },
      { label: "ลิงก์ Google Maps", pts: "4%", criteria: "URL ขึ้นต้น http และมีความยาว > 10 ตัว" },
      { label: "ระยะห่างจากทะเล (กม.)", pts: "2%", criteria: "ตัวเลข ≥ 0 (0 = ติดทะเล)" },
      { label: "ชื่อทะเล / หาด", pts: "1%", criteria: "≥ 3 ตัวอักษร" },
      { label: "ประเภทการติดทะเล (sea_type)", pts: "2%", criteria: "เลือกอย่างน้อย 1 ตัวเลือก" },
    ],
  },
  {
    key: "capacity",
    label: "ความจุ / พื้นที่ใช้สอย",
    total: "18%",
    level: "critical",
    fields: [
      { label: "รองรับผู้เข้าพักสูงสุด", pts: "7%", criteria: "ตัวเลข > 0 (สำคัญที่สุด!)" },
      { label: "จำนวนห้องนอนทั้งหมด", pts: "3%", criteria: "ตัวเลข > 0" },
      { label: "จำนวนห้องน้ำทั้งหมด", pts: "2%", criteria: "ตัวเลข > 0" },
      { label: "ห้องนอนที่มีห้องน้ำในตัว", pts: "1%", criteria: "มีค่าใดก็ได้ (รวม 0)" },
      { label: "ห้องน้ำส่วนกลาง", pts: "1%", criteria: "มีค่าใดก็ได้ (รวม 0)" },
      { label: "จำนวนชั้น", pts: "1%", criteria: "ตัวเลข > 0" },
      { label: "Toggle มีที่นอนเสริม", pts: "1%", criteria: "set ค่าใดก็ได้ (on หรือ off)" },
      {
        label: "รายละเอียดที่นอนเสริม", pts: "2%",
        criteria: "≥ 20 ตัวอักษร (เฉพาะเมื่อ toggle = ON)",
        note: "ถ้า toggle = OFF → ได้ 2% อัตโนมัติ",
      },
    ],
  },
  {
    key: "pool",
    label: "สระว่ายน้ำ",
    total: "10%",
    level: "important",
    fields: [
      {
        label: "Toggle มีสระว่ายน้ำ", pts: "2%",
        criteria: "set ค่าใดก็ได้",
        note: "ถ้า has_pool = false → ได้ 10% ทั้งหมดอัตโนมัติ",
      },
      { label: "ประเภทน้ำในสระ (pool_water_type)", pts: "2%", criteria: "เลือกค่า (conditional: ถ้ามีสระ)" },
      { label: "ขนาดสระ (pool_size)", pts: "2%", criteria: "≥ 3 ตัวอักษร เช่น \"4x8\" (conditional)" },
      { label: "ความลึกสระ (min + max)", pts: "1%", criteria: "ทั้งความลึกต่ำสุดและสูงสุด > 0 (conditional)" },
      { label: "เวลาเปิด-ปิดไฟสระ", pts: "2%", criteria: "มีทั้งเวลาเปิดและปิด (conditional)" },
      { label: "มีเสื้อชูชีพ (pool_lifejacket)", pts: "1%", criteria: "set ค่าใดก็ได้ (conditional)" },
    ],
  },
  {
    key: "parking",
    label: "ที่จอดรถ",
    total: "6%",
    level: "important",
    fields: [
      { label: "จำนวนที่จอดรถสูงสุด (parking_total_max)", pts: "2%", criteria: "มีค่าใดก็ได้ (รวม 0 = ไม่มี)" },
      { label: "จอดรถในบ้าน (parking_indoor_count)", pts: "2%", criteria: "มีค่าใดก็ได้ (รวม 0)" },
      { label: "จอดรถหน้าบ้าน / ถนน (parking_outdoor_count)", pts: "2%", criteria: "มีค่าใดก็ได้ (รวม 0)" },
    ],
  },
  {
    key: "facilities",
    label: "สิ่งอำนวยความสะดวก",
    total: "10%",
    level: "important",
    fields: [
      {
        label: "Checklist รวม (~23 รายการ)", pts: "10%",
        criteria: "ยิ่งติ๊กมาก ยิ่งได้คะแนนมาก",
        tiers: [
          { pts: "10%", cond: "ติ๊กครบทุกรายการ (proportional)" },
          { pts: "2%", cond: "ติ๊ก 1–5 รายการ" },
          { pts: "0%", cond: "ไม่ติ๊กเลย" },
        ],
        note: "นับจาก wifi, แอร์, smart_tv, ครัว, ตู้เย็น, เตาไฟ, ฯลฯ",
      },
    ],
  },
  {
    key: "rules",
    label: "กฎ / ข้อปฏิบัติ",
    total: "12%",
    level: "critical",
    fields: [
      {
        label: "กฎระเบียบบ้านพัก (additional_rules)", pts: "8%", criteria: "≥ 200 ตัวอักษร",
        tiers: [
          { pts: "8%", cond: "≥ 200 ตัวอักษร" },
          { pts: "6%", cond: "100–199 ตัวอักษร" },
          { pts: "4%", cond: "50–99 ตัวอักษร" },
          { pts: "2%", cond: "1–49 ตัวอักษร" },
        ],
      },
      { label: "เวลาเช็คอิน (checkin_time)", pts: "2%", criteria: "มีค่า เช่น 14:00" },
      { label: "เวลาเช็คเอาท์ (checkout_time)", pts: "2%", criteria: "มีค่า เช่น 12:00" },
      { label: "Toggle อนุญาตสัตว์เลี้ยง", pts: "0.5%", criteria: "set ค่าใดก็ได้" },
      {
        label: "รายละเอียดค่าสัตว์เลี้ยง (pet_fee_details)", pts: "0.5%",
        criteria: "≥ 10 ตัวอักษร (conditional: ถ้าอนุญาตสัตว์)",
        note: "ถ้าไม่อนุญาตสัตว์ → ได้ 0.5% อัตโนมัติ",
      },
      {
        label: "เช็คอิน/เอาท์ก่อน-หลังเวลา", pts: "0.5%",
        criteria: "ทั้ง early_checkin_available และ late_checkout_available มีค่า",
      },
      { label: "เวลาห้ามส่งเสียงดัง (quiet_hours_start)", pts: "0.5%", criteria: "มีค่า เช่น 22:00" },
    ],
  },
  {
    key: "nice",
    label: "Nice to Have",
    total: "20%",
    level: "nice",
    fields: [
      {
        label: "รายละเอียดห้องนอน (bedroom_details)", pts: "8%", criteria: "≥ 30 ตัวอักษร",
        tiers: [
          { pts: "8%", cond: "≥ 30 ตัวอักษร" },
          { pts: "4%", cond: "10–29 ตัวอักษร" },
        ],
      },
      {
        label: "ร้านสะดวกซื้อ / ร้านใกล้เคียง (nearby_convenience)", pts: "5%",
        criteria: "≥ 3 รายการ",
        tiers: [
          { pts: "5%", cond: "≥ 3 รายการ" },
          { pts: "3%", cond: "1–2 รายการ" },
        ],
      },
      {
        label: "รายละเอียดห้องน้ำส่วนกลาง (bathroom_floor)", pts: "2%",
        criteria: "มีข้อมูลชั้นที่ตั้งของห้องน้ำ",
        note: "ถ้า common_bathroom_count = 0 → ได้ 2% อัตโนมัติ",
      },
      { label: "อนุญาตสูบบุหรี่ (smoking_allowed)", pts: "1%", criteria: "เลือกค่าใดก็ได้" },
      { label: "ระยะทางจากตัวเมือง (distance_to_city_km)", pts: "1%", criteria: "มีค่าตัวเลข" },
    ],
  },
];

const LEVEL_CONFIG = {
  critical: { label: "🔴 Critical", className: "text-red-600 bg-red-50 border-red-200" },
  important: { label: "🟠 Important", className: "text-orange-600 bg-orange-50 border-orange-200" },
  nice: { label: "🟡 Nice to Have", className: "text-yellow-700 bg-yellow-50 border-yellow-200" },
};

function ScoringGuide() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const toggle = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          onClick={() => setGuideOpen((v) => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            เกณฑ์การให้คะแนน — ต้องกรอกอะไรเท่าไหร่ถึงได้คะแนนเต็ม
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>100 คะแนนเต็ม</span>
            {guideOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>
      </CardHeader>

      {guideOpen && (
        <CardContent className="space-y-2 pt-0">
          {SCORING_SECTIONS.map((section) => {
            const isOpen = openSection === section.key;
            const cfg = LEVEL_CONFIG[section.level];
            return (
              <div key={section.key} className="border rounded-lg overflow-hidden">
                {/* Section header */}
                <button
                  onClick={() => toggle(section.key)}
                  className="flex items-center justify-between w-full px-3 py-2.5 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                    />
                    <span className="text-sm font-medium">{section.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {section.total}
                  </Badge>
                </button>

                {/* Field rows */}
                {isOpen && (
                  <div className="divide-y">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_52px_1fr] gap-2 px-3 py-1.5 bg-muted/10 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      <span>Field</span>
                      <span className="text-center">คะแนน</span>
                      <span>เงื่อนไขได้คะแนนเต็ม</span>
                    </div>
                    {section.fields.map((f) => (
                      <div
                        key={f.label}
                        className="grid grid-cols-[1fr_52px_1fr] gap-2 px-3 py-2.5 text-xs hover:bg-muted/20 transition-colors"
                      >
                        {/* Field name */}
                        <div className="space-y-0.5">
                          <div className="font-medium text-foreground leading-snug">{f.label}</div>
                          {f.note && (
                            <div className="text-[10px] text-muted-foreground italic leading-snug">
                              ℹ️ {f.note}
                            </div>
                          )}
                        </div>

                        {/* Points badge */}
                        <div className="flex justify-center pt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[11px] font-bold text-primary border-primary/40 h-fit"
                          >
                            {f.pts}
                          </Badge>
                        </div>

                        {/* Criteria */}
                        <div className="space-y-1">
                          {f.tiers ? (
                            f.tiers.map((t, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] shrink-0 ${
                                    i === 0
                                      ? "bg-green-100 text-green-700"
                                      : i === f.tiers!.length - 1 && t.pts === "0%"
                                      ? "bg-red-50 text-red-500"
                                      : "bg-yellow-50 text-yellow-700"
                                  }`}
                                >
                                  {t.pts}
                                </Badge>
                                <span className="text-muted-foreground">{t.cond}</span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 shrink-0">
                                {f.pts}
                              </Badge>
                              <span className="text-muted-foreground">{f.criteria}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [notes, setNotes] = useState<PropertyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { fields } = usePropertyFields(true);

  const getCompletenessPercent = (p: Property) => {
    return calculateCompleteness(fields, { ...p.data, house_id: p.house_id }).percent;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [propertyData, noteData] = await Promise.all([
          fetchProperties(),
          fetchAllPropertyNotes(),
        ]);
        setProperties(propertyData);
        setNotes(noteData);
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const propertyMap = useMemo(() => {
    const map = new Map<number, Property>();
    for (const p of properties) map.set(p.id, p);
    return map;
  }, [properties]);

  const updatedToday = useMemo(
    () => properties.filter((p) => isUpdatedToday(p.updated_at)).sort((a, b) => a.id - b.id),
    [properties]
  );

  const lowCompleteness = useMemo(
    () =>
      properties
        .filter((p) => getCompletenessPercent(p) < COMPLETE_THRESHOLD)
        .sort((a, b) => getCompletenessPercent(a) - getCompletenessPercent(b)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [properties, fields]
  );

  const completeProperties = useMemo(
    () =>
      properties
        .filter((p) => getCompletenessPercent(p) >= COMPLETE_THRESHOLD)
        .sort((a, b) => getCompletenessPercent(b) - getCompletenessPercent(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [properties, fields]
  );

  const latestNotes = useMemo(() => notes.slice(0, 8), [notes]);

  const avgScore = useMemo(() => {
    if (properties.length === 0) return 0;
    const total = properties.reduce((sum, p) => sum + getCompletenessPercent(p), 0);
    return Math.round(total / properties.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, fields]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            สรุปภาพรวมบ้านที่อัปเดต ความสมบูรณ์ และหมายเหตุต่างๆ
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* ── Summary bar ──────────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  ภาพรวมทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">บ้านทั้งหมด {properties.length} หลัง</Badge>
                  <Badge variant="outline">อัปเดตวันนี้ {updatedToday.length}</Badge>
                  <Badge variant="outline" className="border-destructive/40 text-destructive">
                    ต่ำกว่า {COMPLETE_THRESHOLD}% จำนวน {lowCompleteness.length} หลัง
                  </Badge>
                  <Badge variant="outline" className="border-green-300 text-green-600">
                    สมบูรณ์ {completeProperties.length} หลัง
                  </Badge>
                  <Badge variant="outline">หมายเหตุ {notes.length}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>คะแนนเฉลี่ยทุกบ้าน</span>
                    <span className="font-medium">{avgScore}%</span>
                  </div>
                  <Progress value={avgScore} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* ── 4-card grid ──────────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {/* Card 1: Updated today */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    อัปเดตวันนี้
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-semibold">{updatedToday.length}</div>
                  <ExpandablePropertyList
                    items={updatedToday}
                    getPercent={getCompletenessPercent}
                    emptyText="ไม่มีบ้านที่อัปเดตวันนี้"
                  />
                  <Link href="/admin?preset=updated_today">
                    <Button size="sm" className="w-full">ดูรายการนี้</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Card 2: Low completeness */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TriangleAlert className="h-4 w-4 text-destructive" />
                    คะแนนต่ำกว่า {COMPLETE_THRESHOLD}%
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-semibold text-destructive">
                    {lowCompleteness.length}
                  </div>
                  <ExpandablePropertyList
                    items={lowCompleteness}
                    getPercent={getCompletenessPercent}
                    emptyText={`ไม่มีบ้านที่ต่ำกว่า ${COMPLETE_THRESHOLD}%`}
                  />
                  {lowCompleteness.length > 0 && (
                    <MissingFieldsHint percent={getCompletenessPercent(lowCompleteness[0])} />
                  )}
                  <Link href="/admin?preset=low_completeness">
                    <Button size="sm" variant="outline" className="w-full">ดูรายการนี้</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Card 3: Complete */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    สมบูรณ์ (≥ {COMPLETE_THRESHOLD}%)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-semibold text-green-600">
                    {completeProperties.length}
                  </div>
                  <ExpandablePropertyList
                    items={completeProperties}
                    getPercent={getCompletenessPercent}
                    emptyText="ยังไม่มีบ้านที่ถึงเกณฑ์"
                  />
                  <Link href="/admin?preset=complete">
                    <Button size="sm" variant="outline" className="w-full">ดูรายการนี้</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Card 4: Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    หมายเหตุที่บันทึก
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-semibold">{notes.length}</div>
                  <div className="space-y-1 min-h-[72px]">
                    {latestNotes.map((note) => (
                      <div key={note.id} className="text-xs text-muted-foreground truncate">
                        {(propertyMap.get(note.property_id)?.house_id ?? "-")} · {note.title}
                      </div>
                    ))}
                    {latestNotes.length === 0 && (
                      <div className="text-xs text-muted-foreground">ยังไม่มีหมายเหตุ</div>
                    )}
                  </div>
                  <Link href="/admin/notes">
                    <Button size="sm" variant="outline" className="w-full">ไปหน้าหมายเหตุ</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* ── Scoring guide ────────────────────────────────────────── */}
            <ScoringGuide />
          </>
        )}
      </div>
    </AdminShell>
  );
}
