"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock3,
  History,
  Loader2,
  PencilLine,
  UserRound,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fetchProperty, fetchPropertyChangeLogs } from "@/lib/api";
import type { Property, PropertyChangeField, PropertyChangeLog } from "@/lib/types";

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "ใช่" : "ไม่ใช่";
  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function ChangeFieldRow({ field }: { field: PropertyChangeField }) {
  return (
    <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-[180px_1fr_1fr]">
      <div>
        <p className="text-xs text-muted-foreground">ฟิลด์</p>
        <p className="font-medium text-sm">{field.label}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">ค่าเดิม</p>
        <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-muted/40 p-2 text-xs">{formatValue(field.old_value)}</pre>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">ค่าใหม่</p>
        <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-primary/5 p-2 text-xs">{formatValue(field.new_value)}</pre>
      </div>
    </div>
  );
}

export default function PropertyLogsPage() {
  const params = useParams();
  const propertyId = Number(params?.id);
  const [property, setProperty] = useState<Property | null>(null);
  const [logs, setLogs] = useState<PropertyChangeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || Number.isNaN(propertyId)) return;

    (async () => {
      setLoading(true);
      try {
        const [loadedProperty, loadedLogs] = await Promise.all([
          fetchProperty(propertyId),
          fetchPropertyChangeLogs(propertyId),
        ]);

        setProperty(loadedProperty);
        setLogs(loadedLogs);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "ไม่สามารถโหลดประวัติการแก้ไขได้"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId]);

  const latestUpdate = useMemo(() => logs[0]?.created_at ?? property?.updated_at, [logs, property?.updated_at]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <History className="h-6 w-6 text-primary" />
              ประวัติการแก้ไขข้อมูลที่พัก
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ตรวจสอบได้ว่าใครแก้ไขข้อมูลอะไร และแก้เมื่อเวลาไหน
            </p>
          </div>
          {property && (
            <Link href={`/admin/property/${property.id}`}>
              <Button className="gap-2">
                <PencilLine className="h-4 w-4" />
                กลับไปหน้าแก้ไข
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">รหัสบ้าน</p>
              <p className="font-semibold">{property?.house_id ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ชื่อที่พัก</p>
              <p className="font-semibold">{(property?.data.house_name as string) || "ยังไม่ตั้งชื่อ"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">อัปเดตล่าสุด</p>
              <p className="font-semibold">
                {latestUpdate
                  ? new Date(latestUpdate).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              ยังไม่มีประวัติการแก้ไขสำหรับที่พักนี้
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={log.action === "create" ? "default" : "outline"}>
                        {log.action === "create" ? "สร้างรายการ" : "อัปเดตข้อมูล"}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                        <UserRound className="h-4 w-4" />
                        {log.actor_username}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      {new Date(log.created_at).toLocaleString("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    เปลี่ยนทั้งหมด {log.changed_fields.length} ฟิลด์
                  </p>
                  <Separator />
                  <div className="space-y-3">
                    {log.changed_fields.map((field, index) => (
                      <ChangeFieldRow key={`${log.id}-${field.field_key}-${index}`} field={field} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}