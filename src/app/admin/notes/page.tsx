"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  StickyNote,
  Plus,
  Loader2,
  Trash2,
  CalendarDays,
  Pencil,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import {
  fetchProperties,
  fetchPropertyNotes,
  createPropertyNote,
  updatePropertyNote,
  deletePropertyNote,
} from "@/lib/api";
import type { Property, PropertyNote } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
} from "@/components/ui/combobox";
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

const NOTE_CATEGORIES = [
  "ซ่อมบำรุง",
  "ข้อควรระวัง",
  "คำแนะนำ",
  "ติดต่อช่าง",
  "ทั่วไป",
];

function categoryColor(
  cat: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (cat) {
    case "ซ่อมบำรุง":
      return "destructive";
    case "ข้อควรระวัง":
      return "outline";
    case "ติดต่อช่าง":
      return "secondary";
    default:
      return "default";
  }
}

// ─── Edit inline component ────────────────────────────────────────────────

interface EditFormProps {
  note: PropertyNote;
  onSave: (id: number, updates: { title?: string; content?: string; category?: string }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function EditForm({ note, onSave, onCancel, saving }: EditFormProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category);

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-accent/30">
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-sm">หัวข้อ</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="w-40 space-y-1">
          <Label className="text-sm">หมวดหมู่</Label>
          <Select value={category} onValueChange={(v) => { if (v) setCategory(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {NOTE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-sm">รายละเอียด</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
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
          onClick={() => onSave(note.id, { title, content, category })}
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

export default function NotesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<PropertyNote[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // New note form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("ทั่วไป");

  // Load properties
  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch(() => toast.error("ไม่สามารถโหลดรายการที่พักได้"))
      .finally(() => setLoadingProperties(false));
  }, []);

  // Load notes when property selected
  const loadNotes = useCallback(async (propertyId: number) => {
    setLoadingNotes(true);
    try {
      const data = await fetchPropertyNotes(propertyId);
      setNotes(data);
    } catch {
      toast.error("ไม่สามารถโหลดบันทึกได้");
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadNotes(selectedId);
    } else {
      setNotes([]);
    }
  }, [selectedId, loadNotes]);

  // Group notes by date (YYYY-MM-DD from created_at)
  const notesByDate = useMemo(() => {
    const groups = new Map<string, { label: string; notes: PropertyNote[] }>();
    for (const note of notes) {
      const d = new Date(note.created_at);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
      const existing = groups.get(key);
      if (existing) {
        existing.notes.push(note);
      } else {
        groups.set(key, { label, notes: [note] });
      }
    }
    // Return sorted descending by date key
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [notes]);

  // Add note
  const handleAdd = async () => {
    if (!newTitle.trim()) {
      toast.error("กรุณากรอกหัวข้อ");
      return;
    }
    if (!selectedId) return;

    setAdding(true);
    try {
      await createPropertyNote({
        property_id: selectedId,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
      toast.success("เพิ่มบันทึกเรียบร้อย");
      setNewTitle("");
      setNewContent("");
      setNewCategory("ทั่วไป");
      setShowForm(false);
      await loadNotes(selectedId);
    } catch {
      toast.error("ไม่สามารถเพิ่มบันทึกได้");
    } finally {
      setAdding(false);
    }
  };

  // Update note
  const handleUpdate = async (
    id: number,
    updates: { title?: string; content?: string; category?: string }
  ) => {
    setSavingId(id);
    try {
      await updatePropertyNote(id, updates);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
      );
      setEditingId(null);
    } catch {
      toast.error("ไม่สามารถบันทึกได้");
    } finally {
      setSavingId(null);
    }
  };

  // Delete note
  const handleDelete = async (id: number) => {
    try {
      await deletePropertyNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("ลบบันทึกเรียบร้อย");
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
          <StickyNote className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">บันทึกหมายเหตุ</h1>
            <p className="text-muted-foreground text-sm mt-1">
              บันทึกรายวันแยกตามที่พัก สามารถเพิ่มได้ทุกวัน
            </p>
          </div>
        </div>

        {/* Property Selector (Combobox with search) */}
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
                <Combobox
                  value={selectedId?.toString() ?? ""}
                  onValueChange={(v) => {
                    setSelectedId(v ? Number(v) : null);
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  <ComboboxInput
                    className="max-w-sm"
                    placeholder="ค้นหาด้วยรหัสบ้านหรือชื่อ..."
                  />
                  <ComboboxList className="max-h-60 overflow-y-auto bg-background border rounded-md mt-1 shadow-lg z-50">
                    {properties.map((p) => (
                      <ComboboxOption key={p.id} value={p.id.toString()}>
                        {p.house_id}
                        {p.data?.house_name ? ` — ${p.data.house_name as string}` : ""}
                      </ComboboxOption>
                    ))}
                  </ComboboxList>
                </Combobox>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        {selectedId && (
          <div className="space-y-4">
            {/* Sub-header with count + add button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {selectedProperty?.house_id}
                </span>
                <Badge variant="secondary">{notes.length} บันทึก</Badge>
              </div>
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มบันทึกวันนี้
                </Button>
              )}
            </div>

            {/* Add Form */}
            {showForm && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    เพิ่มบันทึกใหม่
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-sm font-medium">หัวข้อ</Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="เช่น น้ำรั่ว, แอร์เสีย, วิธีเปิดประตู"
                        autoFocus
                      />
                    </div>
                    <div className="w-40 space-y-1">
                      <Label className="text-sm font-medium">หมวดหมู่</Label>
                      <Select
                        value={newCategory}
                        onValueChange={(v) => { if (v) setNewCategory(v); }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {NOTE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">
                      รายละเอียด / วิธีแก้ไข / ผู้ติดต่อ
                    </Label>
                    <Textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="เช่น น้ำรั่วจากหลังคา โทรช่างสมชาย 08x-xxx-xxxx"
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
                        setNewContent("");
                        setNewCategory("ทั่วไป");
                      }}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdd}
                      disabled={adding}
                      className="gap-1"
                    >
                      {adding && <Loader2 className="h-3 w-3 animate-spin" />}
                      บันทึก
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes Timeline */}
            {loadingNotes ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground text-sm">
                  ยังไม่มีบันทึกสำหรับที่พักนี้ — กด &quot;เพิ่มบันทึกวันนี้&quot; เพื่อเริ่มต้น
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {notesByDate.map(([dateKey, { label, notes: dayNotes }]) => (
                  <div key={dateKey} className="space-y-3">
                    {/* Date header */}
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        {label}
                      </span>
                      <Separator className="flex-1" />
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {dayNotes.length} รายการ
                      </Badge>
                    </div>

                    {/* Notes for this day */}
                    {dayNotes.map((note) =>
                      editingId === note.id ? (
                        <EditForm
                          key={note.id}
                          note={note}
                          saving={savingId === note.id}
                          onSave={handleUpdate}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div
                          key={note.id}
                          className="border rounded-lg p-4 space-y-2 hover:bg-accent/20 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-sm">{note.title}</h4>
                                <Badge variant={categoryColor(note.category)}>
                                  {note.category}
                                </Badge>
                              </div>
                              {note.content && (
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                  {note.content}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(note.created_at).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditingId(note.id)}
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
                                    <AlertDialogTitle>ลบบันทึกนี้?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      การลบนี้ไม่สามารถยกเลิกได้
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(note.id)}
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
