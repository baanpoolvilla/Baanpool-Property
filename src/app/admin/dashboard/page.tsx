"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
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
import { fetchAllPropertyNotes, fetchProperties } from "@/lib/api";
import { usePropertyFields } from "@/hooks/use-property-fields";
import type { Property, PropertyNote } from "@/lib/types";

function isUpdatedToday(isoDate: string) {
  const target = new Date(isoDate);
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [notes, setNotes] = useState<PropertyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { fields } = usePropertyFields(true);

  const getCompletenessPercent = (data: Record<string, unknown>) => {
    const activeFields = fields.filter((f) => f.is_active);
    if (activeFields.length === 0) return 0;

    const filledCount = activeFields.filter((f) => {
      const v = data[f.field_key];
      if (v === undefined || v === null || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    }).length;

    return Math.round((filledCount / activeFields.length) * 100);
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
    () => properties.filter((p) => getCompletenessPercent(p.data) < 80).sort((a, b) => a.id - b.id),
    [properties, fields]
  );

  const completeProperties = useMemo(
    () => properties.filter((p) => getCompletenessPercent(p.data) >= 80).sort((a, b) => a.id - b.id),
    [properties, fields]
  );

  const latestNotes = useMemo(() => notes.slice(0, 8), [notes]);

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  บ้านที่อัปเดตวันนี้
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-semibold">{updatedToday.length}</div>
                <div className="space-y-1 min-h-[72px]">
                  {updatedToday.slice(0, 3).map((p) => (
                    <div key={p.id} className="text-xs text-muted-foreground">
                      {p.house_id}
                    </div>
                  ))}
                  {updatedToday.length === 0 && (
                    <div className="text-xs text-muted-foreground">ไม่มีบ้านที่อัปเดตวันนี้</div>
                  )}
                </div>
                <Link href="/admin?preset=updated_today">
                  <Button size="sm" className="w-full">ดูเฉพาะรายการนี้</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-destructive" />
                  บ้านที่ % ต่ำกว่า 80
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-semibold text-destructive">{lowCompleteness.length}</div>
                <div className="space-y-1 min-h-[72px]">
                  {lowCompleteness.slice(0, 3).map((p) => (
                    <div key={p.id} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{p.house_id}</span>
                      <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                        {getCompletenessPercent(p.data)}%
                      </Badge>
                    </div>
                  ))}
                  {lowCompleteness.length === 0 && (
                    <div className="text-xs text-muted-foreground">ไม่มีบ้านที่ต่ำกว่า 80%</div>
                  )}
                </div>
                <Link href="/admin?preset=low_completeness">
                  <Button size="sm" variant="outline" className="w-full">ดูเฉพาะรายการนี้</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  บ้านที่สมบูรณ์ (≥ 80%)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-semibold text-green-600">{completeProperties.length}</div>
                <div className="space-y-1 min-h-[72px]">
                  {completeProperties.slice(0, 3).map((p) => (
                    <div key={p.id} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{p.house_id}</span>
                      <Badge variant="outline" className="text-[10px] border-green-300 text-green-600">
                        {getCompletenessPercent(p.data)}%
                      </Badge>
                    </div>
                  ))}
                  {completeProperties.length === 0 && (
                    <div className="text-xs text-muted-foreground">ยังไม่มีบ้านที่ถึงเกณฑ์</div>
                  )}
                </div>
                <Link href="/admin?preset=complete">
                  <Button size="sm" variant="outline" className="w-full">ดูเฉพาะรายการนี้</Button>
                </Link>
              </CardContent>
            </Card>

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
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Home className="h-4 w-4" />
              สรุปทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">บ้านทั้งหมด {properties.length} หลัง</Badge>
            <Badge variant="outline">อัปเดตวันนี้ {updatedToday.length}</Badge>
            <Badge variant="outline" className="border-destructive/40 text-destructive">ต่ำกว่า 80% {lowCompleteness.length}</Badge>
            <Badge variant="outline" className="border-green-300 text-green-600">สมบูรณ์ {completeProperties.length}</Badge>
            <Badge variant="outline">หมายเหตุ {notes.length}</Badge>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
