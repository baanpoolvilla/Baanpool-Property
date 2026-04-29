"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Edit,
  Plus,
  Search,
  Trash2,
  MapPin,
  Users,
  Download,
  FileJson,
  FileSpreadsheet,
  Share2,
  Clock,
  StickyNote,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { CompletenessScore } from "@/components/completeness-score";
import { usePropertyFields } from "@/hooks/use-property-fields";
import { deleteProperty, fetchProperties, searchProperties } from "@/lib/api";
import type { Property, PropertyField } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PropertyListPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { fields } = usePropertyFields(true);

  const getPropertyZone = (data: Record<string, unknown>) => {
    const zone = data.zone;
    if (typeof zone === "string" && zone.trim()) return zone;

    const legacyLocation = data.location;
    if (typeof legacyLocation === "string" && legacyLocation.trim()) {
      return legacyLocation;
    }

    return null;
  };

  // ─── Export helpers ────────────────────────────────────────────────
  const exportJSON = () => {
    const exportData = properties.map((p) => ({
      house_id: p.house_id,
      ...p.data,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, "properties.json");
    toast.success(`ส่งออก ${properties.length} รายการเป็น JSON แล้ว`);
  };

  const exportCSV = () => {
    const allKeys = new Set<string>();
    for (const p of properties) {
      Object.keys(p.data).forEach((k) => allKeys.add(k));
    }
    const dataKeys = Array.from(allKeys).sort();
    const headers = ["house_id", ...dataKeys, "created_at", "updated_at"];

    const rows = properties.map((p) =>
      headers.map((h) => {
        let val: unknown;
        if (h === "house_id") val = p.house_id;
        else if (h === "created_at") val = p.created_at;
        else if (h === "updated_at") val = p.updated_at;
        else val = p.data[h];

        if (val === null || val === undefined) return "";
        if (Array.isArray(val)) return val.join("; ");
        if (typeof val === "boolean") return val ? "ใช่" : "ไม่";
        const s = String(val);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      })
    );

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    downloadBlob(blob, "properties.csv");
    toast.success(`ส่งออก ${properties.length} รายการเป็น CSV แล้ว`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyApiUrl = () => {
    const url = `${window.location.origin}/api/properties`;
    navigator.clipboard.writeText(url);
    toast.success("คัดลอก API URL แล้ว");
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = search.trim()
        ? await searchProperties(search.trim())
        : await fetchProperties();
      // เรียง id น้อยไปมาก
      setProperties(data.sort((a, b) => a.id - b.id));
    } catch (err) {
      toast.error("ไม่สามารถโหลดรายการที่พักได้");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const handleDelete = async (id: number) => {
    try {
      await deleteProperty(id);
      toast.success("ลบที่พักแล้ว");
      load();
    } catch {
      toast.error("ไม่สามารถลบที่พักได้");
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              รายการที่พัก
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              จัดการข้อมูลที่พักทั้งหมดของคุณ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" className="gap-2" />
                }
              >
                <Download className="h-4 w-4" />
                ส่งออก
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  ส่งออกเป็น JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  ส่งออกเป็น CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyApiUrl}>
                  <Share2 className="h-4 w-4 mr-2" />
                  คัดลอก API URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/admin/property/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                เพิ่มที่พัก
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาด้วยรหัสบ้านหรือชื่อ…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              ที่พักทั้งหมด
              <Badge variant="secondary" className="ml-2">
                {properties.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>ยังไม่มีที่พัก</p>
                <Link href="/admin/property/new">
                  <Button variant="link" className="mt-2">
                    เพิ่มที่พักรายการแรก
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">รหัสบ้าน</TableHead>
                      <TableHead>ชื่อที่พัก</TableHead>
                      <TableHead className="hidden md:table-cell">
                        ที่ตั้ง
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        ผู้เข้าพัก
                      </TableHead>
                      <TableHead className="hidden xl:table-cell w-52">
                        ความสมบูรณ์
                      </TableHead>
                      <TableHead className="hidden lg:table-cell w-40">
                        อัพเดตล่าสุด
                      </TableHead>
                      <TableHead className="text-right w-28">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/property/${p.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/admin/property/${p.id}`);
                          }
                        }}
                        tabIndex={0}
                      >
                        <TableCell className="font-mono font-semibold">
                          {p.house_id}
                        </TableCell>
                        <TableCell>
                          {(p.data.house_name as string) || (
                            <span className="text-muted-foreground italic">
                              ยังไม่ตั้งชื่อ
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {getPropertyZone(p.data) ? (
                            <span className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {getPropertyZone(p.data)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {p.data.max_guests != null ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Users className="h-3 w-3" />
                              {String(p.data.max_guests)} คน
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <CompletenessScore fields={fields} data={p.data} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {p.updated_at ? (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 shrink-0" />
                              {new Date(p.updated_at).toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              })}
                              {" "}
                              {new Date(p.updated_at).toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/property/${p.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="ghost" size="icon" title="แก้ไขข้อมูล">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link
                              href={`/admin/notes?property=${p.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="ghost" size="icon" title="ดูบันทึกหมายเหตุ" className="text-primary hover:text-primary">
                                <StickyNote className="h-4 w-4" />
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ลบที่พัก
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
                                    <strong>{p.house_id}</strong>?
                                    การกระทำนี้ไม่สามารถย้อนกลับได้
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(p.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    ลบ
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
