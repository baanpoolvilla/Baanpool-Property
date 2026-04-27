"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  CalendarDays,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import {
  fetchProperties,
  fetchNegativeDisputes,
  createNegativeDispute,
  updateNegativeDispute,
  deleteNegativeDispute,
} from "@/lib/api";
import type { Property, NegativeDispute } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const DISPUTE_CATEGORIES = [
  "ร้องเรียน",
  "ข้อพิพาท",
  "ปฏิเสธข้อกล่าวหา",
  "ข้อโต้แย้ง",
  "อื่นๆ",
];

const DISPUTE_STATUSES = [
  "รอดำเนินการ",
  "กำลังดำเนินการ",
  "เสร็จสิ้น",
  "ยกเลิก",
];

function statusColor(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "รอดำเนินการ":
      return "destructive";
    case "กำลังดำเนินการ":
      return "outline";
    case "เสร็จสิ้น":
      return "default";
    default:
      return "secondary";
  }
}

function categoryColor(
  cat: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (cat) {
    case "ร้องเรียน":
      return "destructive";
    case "ข้อพิพาท":
      return "outline";
    default:
      return "secondary";
  }
}

// ─── Edit Form ────────────────────────────────────────────────────────────

interface EditDisputeFormProps {
  dispute: NegativeDispute;
  onSave: (
    id: number,
    updates: Partial<Pick<NegativeDispute, "title" | "description" | "category" | "status" | "dispute_date">>
  ) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function EditDisputeForm({ dispute, onSave, onCancel, saving }: EditDisputeFormProps) {
  const [title, setTitle] = useState(dispute.title);
  const [description, setDescription] = useState(dispute.description);
  const [category, setCategory] = useState(dispute.category);
  const [status, setStatus] = useState(dispute.status);
  const [disputeDate, setDisputeDate] = useState(dispute.dispute_date);

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-accent/30">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1 space-y-1">
          <Label className="text-sm">วันที่เกิดเหตุ</Label>
          <Input
            type="date"
            value={disputeDate}
            onChange={(e) => setDisputeDate(e.target.value)}
          />
        </div>
        <div className="sm:col-span-1 space-y-1">
          <Label className="text-sm">ประเภท</Label>
          <Select value={category} onValueChange={(v) => { if (v) setCategory(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DISPUTE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-1 space-y-1">
          <Label className="text-sm">สถานะ</Label>
          <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DISPUTE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-sm">หัวข้อ / เรื่อง</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ระบุเรื่องที่โต้แย้ง"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm">รายละเอียด</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={() =>
            onSave(dispute.id, { title, description, category, status, dispute_date: disputeDate })
          }
          className="gap-1"
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          บันทึก
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function DisputesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [disputes, setDisputes] = useState<NegativeDispute[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // New dispute form state
  const today = new Date().toISOString().slice(0, 10);
  const [newDate, setNewDate] = useState(today);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("ร้องเรียน");
  const [newStatus, setNewStatus] = useState("รอดำเนินการ");

  // Load properties
  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch(() => toast.error("ไม่สามารถโหลดรายการที่พักได้"))
      .finally(() => setLoadingProperties(false));
  }, []);

  // Load disputes when property selected
  const loadDisputes = useCallback(async (propertyId: number) => {
    setLoadingDisputes(true);
    try {
      const data = await fetchNegativeDisputes(propertyId);
      setDisputes(data);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลโต้แย้งได้");
    } finally {
      setLoadingDisputes(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDisputes(selectedId);
    } else {
      setDisputes([]);
    }
  }, [selectedId, loadDisputes]);

  // Group by date
  const disputesByDate = useMemo(() => {
    const groups = new Map<string, { label: string; items: NegativeDispute[] }>();
    for (const d of disputes) {
      const key = d.dispute_date;
      const label = new Date(d.dispute_date + "T00:00:00").toLocaleDateString(
        "th-TH",
        { year: "numeric", month: "long", day: "numeric", weekday: "long" }
      );
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(d);
      } else {
        groups.set(key, { label, items: [d] });
      }
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [disputes]);

  // Stats
  const stats = useMemo(() => ({
    total: disputes.length,
    pending: disputes.filter((d) => d.status === "รอดำเนินการ").length,
    inProgress: disputes.filter((d) => d.status === "กำลังดำเนินการ").length,
    done: disputes.filter((d) => d.status === "เสร็จสิ้น").length,
  }), [disputes]);

  // Add dispute
  const handleAdd = async () => {
    if (!newTitle.trim()) {
      toast.error("กรุณากรอกหัวข้อ");
      return;
    }
    if (!selectedId) return;

    setAdding(true);
    try {
      await createNegativeDispute({
        property_id: selectedId,
        dispute_date: newDate,
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        status: newStatus,
      });
      toast.success("เพิ่มข้อมูลโต้แย้งเรียบร้อย");
      setNewTitle("");
      setNewDescription("");
      setNewCategory("ร้องเรียน");
      setNewStatus("รอดำเนินการ");
      setNewDate(today);
      setShowForm(false);
      await loadDisputes(selectedId);
    } catch {
      toast.error("ไม่สามารถเพิ่มข้อมูลได้");
    } finally {
      setAdding(false);
    }
  };

  // Update dispute
  const handleUpdate = async (
    id: number,
    updates: Partial<Pick<NegativeDispute, "title" | "description" | "category" | "status" | "dispute_date">>
  ) => {
    setSavingId(id);
    try {
      await updateNegativeDispute(id, updates);
      setDisputes((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      );
      setEditingId(null);
      toast.success("อัปเดตเรียบร้อย");
    } catch {
      toast.error("ไม่สามารถบันทึกได้");
    } finally {
      setSavingId(null);
    }
  };

  // Delete dispute
  const handleDelete = async (id: number) => {
    try {
      await deleteNegativeDispute(id);
      setDisputes((prev) => prev.filter((d) => d.id !== id));
      toast.success("ลบเรียบร้อย");
    } catch {
      toast.error("ไม่สามารถลบได้");
    }
  };

  const selectedProperty = properties.find((p) => p.id === selectedId);

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              ข้อมูลโต้แย้งเชิงลบ
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              บันทึกข้อร้องเรียน ข้อพิพาท และข้อโต้แย้งเชิงลบแยกตามที่พัก
            </p>
          </div>
        </div>

        {/* Property Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">เลือกที่พัก</Label>
              {loadingProperties ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังโหลด…
                </div>
              ) : (
                <Select
                  value={selectedId?.toString() ?? ""}
                  onValueChange={(v) => {
                    setSelectedId(v ? Number(v) : null);
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="— เลือกที่พัก —" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.house_id}
                        {p.data?.house_name ? ` — ${p.data.house_name as string}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Disputes Section */}
        {selectedId && (
          <div className="space-y-4">
            {/* Stats + Add Button */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {selectedProperty?.house_id}
                </span>
                <Badge variant="secondary">{stats.total} รายการ</Badge>
                {stats.pending > 0 && (
                  <Badge variant="destructive">{stats.pending} รอดำเนินการ</Badge>
                )}
                {stats.inProgress > 0 && (
                  <Badge variant="outline">{stats.inProgress} กำลังดำเนินการ</Badge>
                )}
                {stats.done > 0 && (
                  <Badge variant="default">{stats.done} เสร็จสิ้น</Badge>
                )}
              </div>
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="gap-2"
                  size="sm"
                  variant="destructive"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มข้อมูลโต้แย้ง
                </Button>
              )}
            </div>

            {/* Add Form */}
            {showForm && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    เพิ่มข้อมูลโต้แย้งใหม่
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">วันที่เกิดเหตุ</Label>
                      <Input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">ประเภท</Label>
                      <Select
                        value={newCategory}
                        onValueChange={(v) => { if (v) setNewCategory(v); }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DISPUTE_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">สถานะ</Label>
                      <Select
                        value={newStatus}
                        onValueChange={(v) => { if (v) setNewStatus(v); }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DISPUTE_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">หัวข้อ / เรื่อง</Label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="เช่น ลูกค้าร้องเรียนเรื่องเสียงรบกวน"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">รายละเอียด</Label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="อธิบายรายละเอียดของปัญหาหรือข้อโต้แย้ง"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowForm(false);
                        setNewTitle("");
                        setNewDescription("");
                        setNewCategory("ร้องเรียน");
                        setNewStatus("รอดำเนินการ");
                        setNewDate(today);
                      }}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdd}
                      disabled={adding}
                      className="gap-1 bg-destructive hover:bg-destructive/90"
                    >
                      {adding && <Loader2 className="h-3 w-3 animate-spin" />}
                      บันทึก
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Disputes Timeline */}
            {loadingDisputes ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : disputes.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground text-sm">
                  ยังไม่มีข้อมูลโต้แย้งสำหรับที่พักนี้
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {disputesByDate.map(([dateKey, { label, items }]) => (
                  <div key={dateKey} className="space-y-3">
                    {/* Date header */}
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        {label}
                      </span>
                      <Separator className="flex-1" />
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {items.length} รายการ
                      </Badge>
                    </div>

                    {/* Dispute items */}
                    {items.map((dispute) =>
                      editingId === dispute.id ? (
                        <EditDisputeForm
                          key={dispute.id}
                          dispute={dispute}
                          saving={savingId === dispute.id}
                          onSave={handleUpdate}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div
                          key={dispute.id}
                          className="border border-destructive/20 rounded-lg p-4 space-y-2 hover:bg-destructive/5 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-sm">{dispute.title}</h4>
                                <Badge variant={categoryColor(dispute.category)}>
                                  {dispute.category}
                                </Badge>
                                <Badge variant={statusColor(dispute.status)}>
                                  {dispute.status}
                                </Badge>
                              </div>
                              {dispute.description && (
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                  {dispute.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                บันทึกเมื่อ{" "}
                                {new Date(dispute.created_at).toLocaleString("th-TH", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditingId(dispute.id)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger
                                  render={
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                    />
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>ลบรายการนี้?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      การลบนี้ไม่สามารถยกเลิกได้
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(dispute.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      ลบ
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
