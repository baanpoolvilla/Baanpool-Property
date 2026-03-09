"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Edit,
  GripVertical,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import {
  createPropertyField,
  deletePropertyField,
  fetchPropertyFields,
  updatePropertyField,
} from "@/lib/api";
import { FIELD_TYPES, SECTIONS } from "@/lib/constants";
import type {
  FieldType,
  PropertyField,
  PropertyFieldInsert,
} from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

// ─── Blank form state ──────────────────────────────────────────────────────

const blankField: PropertyFieldInsert = {
  field_key: "",
  label: "",
  type: "text",
  section: "basic_info",
  required: false,
  options: null,
  order_index: 0,
  is_active: true,
};

export default function FieldManagementPage() {
  const [fields, setFields] = useState<PropertyField[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PropertyFieldInsert>(blankField);
  const [optionsInput, setOptionsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPropertyFields(false);
      setFields(data);
    } catch {
      toast.error("ไม่สามารถโหลดฟิลด์ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Open dialog ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    const maxOrder = fields.length > 0 ? Math.max(...fields.map((f) => f.order_index)) : 0;
    setForm({ ...blankField, order_index: maxOrder + 1 });
    setOptionsInput("");
    setDialogOpen(true);
  };

  const openEdit = (field: PropertyField) => {
    setEditingId(field.id);
    setForm({
      field_key: field.field_key,
      label: field.label,
      type: field.type,
      section: field.section,
      required: field.required,
      options: field.options,
      order_index: field.order_index,
      is_active: field.is_active,
    });
    setOptionsInput(field.options?.join(", ") ?? "");
    setDialogOpen(true);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.field_key.trim() || !form.label.trim()) {
      toast.error("กรุณากรอก Field Key และ Label");
      return;
    }

    // Parse options for select/multiselect
    const needsOptions = form.type === "select" || form.type === "multiselect";
    const parsedOptions = needsOptions
      ? optionsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    if (needsOptions && (!parsedOptions || parsedOptions.length === 0)) {
      toast.error("กรุณาใส่ตัวเลือกอย่างน้อย 1 รายการ (คั่นด้วยเครื่องหมายจุลภาค)");
      return;
    }

    setSubmitting(true);
    try {
      const payload: PropertyFieldInsert = {
        ...form,
        field_key: form.field_key.trim().toLowerCase().replace(/\s+/g, "_"),
        options: parsedOptions,
      };

      if (editingId) {
        await updatePropertyField(editingId, payload);
        toast.success("อัปเดตฟิลด์แล้ว");
      } else {
        await createPropertyField(payload);
        toast.success("สร้างฟิลด์แล้ว");
      }

      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถบันทึกฟิลด์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle active ──────────────────────────────────────────────────────

  const toggleActive = async (field: PropertyField) => {
    try {
      await updatePropertyField(field.id, { is_active: !field.is_active });
      load();
    } catch {
      toast.error("ไม่สามารถอัปเดตฟิลด์ได้");
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    try {
      await deletePropertyField(id);
      toast.success("ลบฟิลด์แล้ว");
      load();
    } catch {
      toast.error("ไม่สามารถลบฟิลด์ได้");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings2 className="h-6 w-6" />
              จัดการฟิลด์
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              กำหนดฟิลด์ข้อมูลที่พัก — การเปลี่ยนแปลงจะแสดงผลในฟอร์มทันที
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            เพิ่มฟิลด์
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              รายการฟิลด์ทั้งหมด
              <Badge variant="secondary" className="ml-2">
                {fields.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>ยังไม่มีฟิลด์</p>
                <Button variant="link" onClick={openCreate} className="mt-2">
                  สร้างฟิลด์แรก
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Field Key</TableHead>
                      <TableHead>ป้ายกำกับ</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead className="hidden md:table-cell">
                        หมวดหมู่
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        จำเป็น
                      </TableHead>
                      <TableHead>เปิดใช้</TableHead>
                      <TableHead className="text-right w-24">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((f) => (
                      <TableRow
                        key={f.id}
                        className={f.is_active ? "" : "opacity-50"}
                      >
                        <TableCell className="text-muted-foreground">
                          <GripVertical className="h-4 w-4 inline-block mr-1" />
                          {f.order_index}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {f.field_key}
                        </TableCell>
                        <TableCell>{f.label}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{f.type}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary">{f.section}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {f.required ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              ใช่
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">ไม่</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={f.is_active}
                            onCheckedChange={() => toggleActive(f)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(f)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                  />
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ลบฟิลด์
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ลบ{" "}
                                    <strong>{f.label}</strong> ({f.field_key})?
                                    ข้อมูลที่พักเดิมจะยังอยู่ แต่ฟิลด์นี้จะไม่แสดงในฟอร์มอีกต่อไป
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(f.id)}
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

      {/* ─── Create / Edit Dialog ───────────────────────────────────────────── */}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "แก้ไขฟิลด์" : "เพิ่มฟิลด์ใหม่"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Field Key */}
            <div className="space-y-2">
              <Label htmlFor="fk">Field Key</Label>
              <Input
                id="fk"
                value={form.field_key}
                onChange={(e) =>
                  setForm((p) => ({ ...p, field_key: e.target.value }))
                }
                placeholder="เช่น karaoke"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                ตัวอักษรพิมพ์เล็ก ขีดล่างเท่านั้น ใช้เป็น JSON key
              </p>
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="fl">ป้ายกำกับ (Label)</Label>
              <Input
                id="fl"
                value={form.label}
                onChange={(e) =>
                  setForm((p) => ({ ...p, label: e.target.value }))
                }
                placeholder="เช่น ระบบคาราโอเกะ"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select
                value={form.type}
                onValueChange={(v) => {
                  if (v) setForm((p) => ({ ...p, type: v as FieldType }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Options (only for select / multiselect) */}
            {(form.type === "select" || form.type === "multiselect") && (
              <div className="space-y-2">
                <Label htmlFor="opts">ตัวเลือก (คั่นด้วยเครื่องหมายจุลภาค)</Label>
                <Input
                  id="opts"
                  value={optionsInput}
                  onChange={(e) => setOptionsInput(e.target.value)}
                  placeholder="ตัวเลือก A, ตัวเลือก B, ตัวเลือก C"
                />
              </div>
            )}

            {/* Section */}
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select
                value={form.section}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, section: v ?? p.section }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="oi">ลำดับ</Label>
              <Input
                id="oi"
                type="number"
                value={form.order_index}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    order_index: Number(e.target.value),
                  }))
                }
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="req"
                  checked={form.required}
                  onCheckedChange={(c) =>
                    setForm((p) => ({ ...p, required: c }))
                  }
                />
                <Label htmlFor="req">จำเป็น</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="act"
                  checked={form.is_active}
                  onCheckedChange={(c) =>
                    setForm((p) => ({ ...p, is_active: c }))
                  }
                />
                <Label htmlFor="act">เปิดใช้</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "กำลังบันทึก…" : editingId ? "อัปเดต" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
