"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  StickyNote,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import {
  fetchPropertyNotes,
  createPropertyNote,
  updatePropertyNote,
  deletePropertyNote,
} from "@/lib/api";
import type { PropertyNote } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NOTE_CATEGORIES = [
  "ซ่อมบำรุง",
  "ข้อควรระวัง",
  "คำแนะนำ",
  "ติดต่อช่าง",
  "ทั่วไป",
];

interface PropertyNotesProps {
  propertyId: number;
}

export function PropertyNotes({ propertyId }: PropertyNotesProps) {
  const [notes, setNotes] = useState<PropertyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  // New note form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("ทั่วไป");
  const [showForm, setShowForm] = useState(false);

  // Load notes
  const loadNotes = useCallback(async () => {
    try {
      const data = await fetchPropertyNotes(propertyId);
      setNotes(data);
    } catch {
      toast.error("ไม่สามารถโหลดบันทึกได้");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Add new note
  const handleAdd = async () => {
    if (!newTitle.trim()) {
      toast.error("กรุณากรอกหัวข้อ");
      return;
    }

    setAdding(true);
    try {
      await createPropertyNote({
        property_id: propertyId,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
      toast.success("เพิ่มบันทึกเรียบร้อย");
      setNewTitle("");
      setNewContent("");
      setNewCategory("ทั่วไป");
      setShowForm(false);
      await loadNotes();
    } catch {
      toast.error("ไม่สามารถเพิ่มบันทึกได้");
    } finally {
      setAdding(false);
    }
  };

  // Update note content (auto-save on blur)
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

  const categoryColor = (cat: string) => {
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
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg"
        onClick={() => setIsOpen((o) => !o)}
      >
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            บันทึก / หมายเหตุ
            <Badge variant="secondary" className="ml-1 text-xs">
              {notes.length}
            </Badge>
          </span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Existing notes */}
              {notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  saving={savingId === note.id}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  categoryColor={categoryColor}
                />
              ))}

              {notes.length === 0 && !showForm && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ยังไม่มีบันทึก — กดปุ่มด้านล่างเพื่อเพิ่ม
                </p>
              )}

              {/* New note form */}
              {showForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label htmlFor="note-title" className="text-sm font-medium">
                        หัวข้อ
                      </Label>
                      <Input
                        id="note-title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="เช่น น้ำรั่ว, แอร์เสีย, วิธีเปิดประตู"
                        className="mt-1"
                      />
                    </div>
                    <div className="w-40">
                      <Label className="text-sm font-medium">หมวดหมู่</Label>
                      <Select
                        value={newCategory}
                        onValueChange={(v) => {
                          if (v) setNewCategory(v);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="note-content" className="text-sm font-medium">
                      รายละเอียด / วิธีแก้ไข / ผู้ติดต่อ
                    </Label>
                    <Textarea
                      id="note-content"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="เช่น น้ำรั่วจากหลังคาฝั่งซ้าย ให้โทรหาช่าง คุณสมชาย 08x-xxx-xxxx&#10;วิธีแก้เบื้องต้น: ปิดวาล์วน้ำที่..."
                      rows={4}
                      className="mt-1"
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
                </div>
              )}

              {/* Add button */}
              {!showForm && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="w-full gap-1"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มบันทึกใหม่
                </Button>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Individual Note Item ──────────────────────────────────────────────────

interface NoteItemProps {
  note: PropertyNote;
  saving: boolean;
  onUpdate: (
    id: number,
    updates: { title?: string; content?: string; category?: string }
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  categoryColor: (cat: string) => string;
}

function NoteItem({ note, saving, onUpdate, onDelete, categoryColor }: NoteItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category);

  const handleSave = async () => {
    await onUpdate(note.id, { title, content, category });
    setEditing(false);
  };

  const dateStr = new Date(note.created_at).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (editing) {
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-accent/30">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-sm font-medium">หัวข้อ</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="w-40">
            <Label className="text-sm font-medium">หมวดหมู่</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                if (v) setCategory(v);
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">รายละเอียด</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="mt-1"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setTitle(note.title);
              setContent(note.content);
              setCategory(note.category);
              setEditing(false);
            }}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            บันทึก
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-2 hover:bg-accent/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm">{note.title}</h4>
            <Badge variant={categoryColor(note.category) as "default" | "secondary" | "destructive" | "outline"}>
              {note.category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="text-xs h-7 px-2"
          >
            แก้ไข
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
                  &quot;{note.title}&quot; จะถูกลบถาวรและไม่สามารถกู้คืนได้
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => onDelete(note.id)}
                >
                  ลบ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {note.content && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {note.content}
        </p>
      )}
    </div>
  );
}
