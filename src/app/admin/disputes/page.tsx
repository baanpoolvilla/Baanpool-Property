"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  MessageCircleX,
  MessageCircleCheck,
  EyeOff,
  Eye,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { Switch } from "@/components/ui/switch";

const DISPUTE_CATEGORIES = [
  "สระน้ำ",
  "ความสะอาด",
  "เสียงรบกวน",
  "อุปกรณ์/เครื่องใช้",
  "ที่จอดรถ",
  "แอร์/ไฟฟ้า",
  "น้ำ/ประปา",
  "กฎระเบียบ",
  "ราคา/ค่าบริการ",
  "ทั่วไป",
];

// ─── Edit Form ────────────────────────────────────────────────────────────

interface EditFormProps {
  dispute: NegativeDispute;
  onSave: (
    id: number,
    updates: Partial<Pick<NegativeDispute, "complaint" | "response" | "category" | "is_active">>
  ) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function EditForm({ dispute, onSave, onCancel, saving }: EditFormProps) {
  const [complaint, setComplaint] = useState(dispute.complaint);
  const [response, setResponse] = useState(dispute.response);
  const [category, setCategory] = useState(dispute.category);
  const [isActive, setIsActive] = useState(dispute.is_active);

  return (
    <div className="border-2 border-primary/30 rounded-lg p-4 space-y-4 bg-accent/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">แก้ไขรายการ</span>
        <div className="flex items-center gap-2">
          <Label className="text-sm">ใช้งาน</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium flex items-center gap-1">
          <MessageCircleX className="h-3.5 w-3.5 text-destructive" />
          ข้อร้องเรียน / คำพูดเชิงลบที่ลูกค้าอาจพูด
        </Label>
        <Textarea
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          rows={2}
          placeholder="เช่น ทำไมสระน้ำเขียว"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium flex items-center gap-1">
          <MessageCircleCheck className="h-3.5 w-3.5 text-primary" />
          คำชี้แจง / คำตอบที่แชทบอทจะตอบลูกค้า
        </Label>
        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={4}
          placeholder="เช่น สระน้ำของเราได้รับการดูแลทำความสะอาดและเติมสารเคมีทุกสัปดาห์..."
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label className="text-sm">หมวดหมู่</Label>
          <Select value={category} onValueChange={(v) => { if (v) setCategory(v); }}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DISPUTE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-end pb-0.5">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => onSave(dispute.id, { complaint, response, category, is_active: isActive })}
            className="gap-1"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            บันทึก
          </Button>
        </div>
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

  const [newComplaint, setNewComplaint] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [newCategory, setNewCategory] = useState("ทั่วไป");

  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch(() => toast.error("ไม่สามารถโหลดรายการที่พักได้"))
      .finally(() => setLoadingProperties(false));
  }, []);

  const loadDisputes = useCallback(async (propertyId: number) => {
    setLoadingDisputes(true);
    try {
      const data = await fetchNegativeDisputes(propertyId);
      setDisputes(data);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
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

  const handleAdd = async () => {
    if (!newComplaint.trim()) { toast.error("กรุณากรอกข้อร้องเรียน"); return; }
    if (!newResponse.trim()) { toast.error("กรุณากรอกคำชี้แจง"); return; }
    if (!selectedId) return;
    setAdding(true);
    try {
      await createNegativeDispute({
        property_id: selectedId,
        complaint: newComplaint.trim(),
        response: newResponse.trim(),
        category: newCategory,
        is_active: true,
      });
      toast.success("เพิ่มเรียบร้อย");
      setNewComplaint("");
      setNewResponse("");
      setNewCategory("ทั่วไป");
      setShowForm(false);
      await loadDisputes(selectedId);
    } catch {
      toast.error("ไม่สามารถเพิ่มข้อมูลได้");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (
    id: number,
    updates: Partial<Pick<NegativeDispute, "complaint" | "response" | "category" | "is_active">>
  ) => {
    setSavingId(id);
    try {
      await updateNegativeDispute(id, updates);
      setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
      setEditingId(null);
      toast.success("บันทึกเรียบร้อย");
    } catch {
      toast.error("ไม่สามารถบันทึกได้");
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (id: number, current: boolean) => {
    setSavingId(id);
    try {
      await updateNegativeDispute(id, { is_active: !current });
      setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, is_active: !current } : d)));
    } catch {
      toast.error("ไม่สามารถเปลี่ยนสถานะได้");
    } finally {
      setSavingId(null);
    }
  };

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
  const activeCount = disputes.filter((d) => d.is_active).length;
  const inactiveCount = disputes.filter((d) => !d.is_active).length;

  const byCategory = disputes.reduce<Record<string, NegativeDispute[]>>((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {});

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ข้อมูลโต้แย้งเชิงลบ</h1>
            <p className="text-muted-foreground text-sm mt-1">
              ฐานความรู้สำหรับแชทบอท — คู่ข้อร้องเรียนของลูกค้า &amp; คำชี้แจงที่แชทบอทจะตอบ
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">เลือกที่พัก</Label>
              {loadingProperties ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />กำลังโหลด…
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
                        {p.house_id}{p.data?.house_name ? ` — ${p.data.house_name as string}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{selectedProperty?.house_id}</span>
                <Badge variant="secondary">{disputes.length} รายการ</Badge>
                {activeCount > 0 && <Badge variant="default">{activeCount} ใช้งาน</Badge>}
                {inactiveCount > 0 && <Badge variant="outline">{inactiveCount} ปิด</Badge>}
              </div>
              {!showForm && (
                <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  เพิ่มข้อมูลใหม่
                </Button>
              )}
            </div>

            {showForm && (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    เพิ่มคู่ข้อร้องเรียน — คำชี้แจงใหม่
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <MessageCircleX className="h-3.5 w-3.5 text-destructive" />
                      ข้อร้องเรียน / คำพูดเชิงลบที่ลูกค้าอาจพูด
                    </Label>
                    <Textarea
                      value={newComplaint}
                      onChange={(e) => setNewComplaint(e.target.value)}
                      placeholder={"เช่น ทำไมสระน้ำเขียว\nเช่น พื้นบ้านเหนียวมาก\nเช่น เสียงดังเกินไป"}
                      rows={3}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <MessageCircleCheck className="h-3.5 w-3.5 text-primary" />
                      คำชี้แจง / คำตอบที่แชทบอทจะตอบลูกค้า
                    </Label>
                    <Textarea
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      placeholder="เช่น สระน้ำของเราได้รับการดูแลทำความสะอาดและเติมสารเคมีทุกสัปดาห์ โดยทีมงานมืออาชีพ หากพบปัญหาสามารถแจ้งเจ้าหน้าที่ได้ทันที..."
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-48 space-y-1">
                      <Label className="text-sm font-medium">หมวดหมู่</Label>
                      <Select value={newCategory} onValueChange={(v) => { if (v) setNewCategory(v); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DISPUTE_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 items-end pb-0.5 ml-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowForm(false);
                          setNewComplaint("");
                          setNewResponse("");
                          setNewCategory("ทั่วไป");
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Button type="button" size="sm" onClick={handleAdd} disabled={adding} className="gap-1">
                        {adding && <Loader2 className="h-3 w-3 animate-spin" />}
                        บันทึก
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingDisputes ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : disputes.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground text-sm">
                  ยังไม่มีข้อมูลสำหรับที่พักนี้ — กด &quot;เพิ่มข้อมูลใหม่&quot; เพื่อเริ่มต้น
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(byCategory).map(([cat, items]) => (
                  <div key={cat} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="shrink-0">{cat}</Badge>
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0">{items.length} รายการ</span>
                    </div>
                    {items.map((dispute) =>
                      editingId === dispute.id ? (
                        <EditForm
                          key={dispute.id}
                          dispute={dispute}
                          saving={savingId === dispute.id}
                          onSave={handleUpdate}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div
                          key={dispute.id}
                          className={`border rounded-lg overflow-hidden transition-opacity ${!dispute.is_active ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-start gap-3 p-3 bg-destructive/5 border-b">
                            <MessageCircleX className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm flex-1 whitespace-pre-wrap">{dispute.complaint}</p>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-primary/5">
                            <MessageCircleCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <p className="text-sm flex-1 whitespace-pre-wrap text-muted-foreground">
                              {dispute.response || (
                                <span className="italic text-muted-foreground/60">ยังไม่มีคำชี้แจง</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-t">
                            <button
                              onClick={() => handleToggleActive(dispute.id, dispute.is_active)}
                              disabled={savingId === dispute.id}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {dispute.is_active ? (
                                <><Eye className="h-3.5 w-3.5" />ใช้งาน</>
                              ) : (
                                <><EyeOff className="h-3.5 w-3.5" />ปิดใช้งาน</>
                              )}
                            </button>
                            <div className="flex items-center gap-1">
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
