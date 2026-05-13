"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Home,
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

            {/* ── Tip section ──────────────────────────────────────────── */}
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">💡 Field ที่มีผลต่อคะแนนมากที่สุด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  {[
                    { label: "รองรับสูงสุด", pts: "7%" },
                    { label: "รายละเอียดที่พัก", pts: "8%" },
                    { label: "กฎระเบียบ", pts: "8%" },
                    { label: "Google Maps", pts: "4%" },
                    { label: "รายละเอียดห้องนอน", pts: "8%" },
                    { label: "ชื่อที่พัก", pts: "5%" },
                    { label: "ร้านใกล้เคียง", pts: "5%" },
                    { label: "โซน/พื้นที่", pts: "3%" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1">
                      <span>{item.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{item.pts}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminShell>
  );
}
