"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  StickyNote,
  Plus,
  Loader2,
  Trash2,
  CalendarDays,
  Pencil,
  Search,
  ChevronDown,
  X,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import {
  fetchProperties,
  fetchAllPropertyNotes,
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

// ─── Property Search Dropdown ──────────────────────────────────────────────

interface PropertyDropdownProps {
  properties: Property[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  placeholder?: string;
  clearable?: boolean;
}

function PropertyDropdown({ properties, selectedId, onSelect, placeholder = "— เลือกที่พัก —", clearable = true }: PropertyDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = properties.find((p) => p.id === selectedId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return properties;
    return properties.filter(
      (p) =>
        p.house_id.toLowerCase().includes(q) ||
        (typeof p.data?.house_name === "string" &&
          (p.data.house_name as string).toLowerCase().includes(q))
    );
  }, [properties, search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (p: Property) => {
    onSelect(p.id);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative max-w-sm">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-input bg-background text-sm hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        <span className={selected ? "text-foreground font-medium truncate" : "text-muted-foreground"}>
          {selected
            ? `${selected.house_id}${selected.data?.house_name ? ` \u2014 ${selected.data.house_name as string}` : ""}`
            : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && clearable && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
              className="p-0.5 rounded hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                Not found
              </li>
            ) : (
              filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors ${
                      p.id === selectedId ? "bg-primary/15 font-semibold text-primary" : ""
                    }`}
                  >
                    <span className="font-mono font-semibold">{p.house_id}</span>
                    {typeof p.data?.house_name === "string" && p.data.house_name && (
                      <span className="text-muted-foreground ml-2">
                        {" \u2014 "}{p.data.house_name}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
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
  const [allNotes, setAllNotes] = useState<PropertyNote[]>([]);
  const [filterPropertyId, setFilterPropertyId] = useState<number | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // New note form state
  const [newPropertyId, setNewPropertyId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("ทั่วไป");

  // Load properties
  useEffect(() => {
    fetchProperties()
      .then((data) => {
        const sorted = data.sort((a, b) => a.id - b.id);
        setProperties(sorted);
        // Auto-select from URL param ?property=ID
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const param = params.get("property");
          if (param && !isNaN(Number(param))) {
            setFilterPropertyId(Number(param));
          }
        }
      })
      .catch(() => toast.error("ไม่สามารถโหลดรายการที่พักได้"))
      .finally(() => setLoadingProperties(false));
  }, []);

  // Load all notes on mount
  useEffect(() => {
    fetchAllPropertyNotes()
      .then((data) => setAllNotes(data))
      .catch(() => toast.error("ไม่สามารถโหลดบันทึกได้"))
      .finally(() => setLoadingNotes(false));
  }, []);

  // Property lookup map
  const propertyMap = useMemo(() => {
    const map = new Map<number, Property>();
    for (const p of properties) map.set(p.id, p);
    return map;
  }, [properties]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    if (!filterPropertyId) return allNotes;
    return allNotes.filter((n) => n.property_id === filterPropertyId);
  }, [allNotes, filterPropertyId]);

  // Group notes by date (YYYY-MM-DD from created_at)
  const notesByDate = useMemo(() => {
    const groups = new Map<string, { label: string; notes: PropertyNote[] }>();
    for (const note of filteredNotes) {
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
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredNotes]);

  // Add note
  const handleAdd = async () => {
    if (!newTitle.trim()) { toast.error("กรุณากรอกหัวข้อ"); return; }
    if (!newPropertyId) { toast.error("กรุณาเลือกที่พัก"); return; }

    setAdding(true);
    try {
      const created = await createPropertyNote({
        property_id: newPropertyId,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
      setAllNotes((prev) => [created, ...prev]);
      toast.success("เพิ่มบันทึกเรียบร้อย");
      setNewTitle("");
      setNewContent("");
      setNewCategory("ทั่วไป");
      setShowForm(false);
    } catch {
      toast.error("ไม่สามารถเพิ่มบันทึกได้");
    } finally {
      setAdding(false);
    }
  };

  // Update note
  const handleUpdate = useCallback(async (
    id: number,
    updates: { title?: string; content?: string; category?: string }
  ) => {
    setSavingId(id);
    try {
      await updatePropertyNote(id, updates);
      setAllNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
      setEditingId(null);
    } catch {
      toast.error("ไม่สามารถบันทึกได้");
    } finally {
      setSavingId(null);
    }
  }, []);

  // Delete note
  const handleDelete = async (id: number) => {
    try {
      await deletePropertyNote(id);
      setAllNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("ลบบันทึกเรียบร้อย");
    } catch {
      toast.error("ไม่สามารถลบได้");
    }
  };

  const filterProperty = filterPropertyId ? propertyMap.get(filterPropertyId) : null;

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <StickyNote className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">บันทึกหมายเหตุ</h1>
              <p className="text-muted-foreground text-sm mt-1">
                บันทึกรายวันแยกตามที่พัก สามารถเพิ่มได้ทุกวัน
              </p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2" size="sm">
            <Plus className="h-4 w-4" />
            เพิ่มบันทึกใหม่
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="overflow-visible">
          <CardContent className="pt-4 pb-4 overflow-visible">
            <div className="flex items-center gap-3 flex-wrap">
              <Label className="text-sm font-medium shrink-0">กรองตามที่พัก:</Label>
              {loadingProperties ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <PropertyDropdown
                  properties={properties}
                  selectedId={filterPropertyId}
                  onSelect={setFilterPropertyId}
                />
              )}
              {filterPropertyId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterPropertyId(null)}
                  className="text-muted-foreground gap-1 h-8"
                >
                  <X className="h-3.5 w-3.5" />
                  ดูทั้งหมด
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                {filterProperty && (
                  <span className="text-sm font-medium text-primary">
                    {filterProperty.house_id}
                  </span>
                )}
                <Badge variant="secondary">{filteredNotes.length} บันทึก</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Form */}
        {showForm && (
          <Card className="overflow-visible">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                เพิ่มบันทึกใหม่
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-visible">
              <div className="space-y-2">
                <Label className="text-sm font-medium">เลือกที่พัก *</Label>
                <PropertyDropdown
                  properties={properties}
                  selectedId={newPropertyId}
                  onSelect={setNewPropertyId}
                  placeholder="— เลือกที่พักที่จะบันทึก —"
                  clearable={false}
                />
              </div>
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
                  rows={3}
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
        ) : filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground text-sm">
              {filterPropertyId ? "ไม่มีบันทึกสำหรับที่พักนี้" : "ยังไม่มีบันทึก"}{" "}
              — กด &quot;เพิ่มบันทึกใหม่&quot; เพื่อเริ่มต้น
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
                            {!filterPropertyId && propertyMap.get(note.property_id) && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {propertyMap.get(note.property_id)!.house_id}
                              </Badge>
                            )}
                          </div>
                          {note.content && (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
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
    </AdminShell>
  );
}
