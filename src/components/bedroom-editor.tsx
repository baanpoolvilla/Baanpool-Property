"use client";

import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────

export interface BedroomRoom {
  id: string;
  name: string;
  bed_type: string;
  bed_count: number;
  has_ac: boolean;
  has_tv: boolean;
  has_wardrobe: boolean;
  has_ensuite: boolean;
  notes: string;
}

interface BedroomEditorProps {
  value: BedroomRoom[];
  onChange: (rooms: BedroomRoom[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────

const BED_TYPES = [
  "เตียงเดี่ยว",
  "เตียงคู่",
  "เตียงควีนไซซ์",
  "เตียงคิงไซซ์",
  "เตียงสองชั้น",
  "โซฟาเบด",
];

const AMENITY_ITEMS: { key: keyof Pick<BedroomRoom, "has_ac" | "has_tv" | "has_wardrobe" | "has_ensuite">; label: string }[] = [
  { key: "has_ac", label: "แอร์" },
  { key: "has_tv", label: "ทีวี" },
  { key: "has_wardrobe", label: "ตู้เสื้อผ้า" },
  { key: "has_ensuite", label: "ห้องน้ำในห้อง" },
];

// ─── Component ────────────────────────────────────────────────────────────

export function BedroomEditor({ value, onChange }: BedroomEditorProps) {
  const rooms = value ?? [];
  const [openRooms, setOpenRooms] = useState<Set<string>>(new Set());

  const toggleRoom = (id: string) => {
    setOpenRooms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addRoom = () => {
    const newId = `room_${Date.now()}`;
    const newRoom: BedroomRoom = {
      id: newId,
      name: `ห้องนอนที่ ${rooms.length + 1}`,
      bed_type: "เตียงคู่",
      bed_count: 1,
      has_ac: true,
      has_tv: false,
      has_wardrobe: false,
      has_ensuite: false,
      notes: "",
    };
    onChange([...rooms, newRoom]);
    // Auto-expand new room
    setOpenRooms((prev) => new Set([...prev, newId]));
  };

  const removeRoom = (id: string) => {
    onChange(rooms.filter((r) => r.id !== id));
  };

  const updateRoom = (id: string, patch: Partial<BedroomRoom>) => {
    onChange(rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">รายละเอียดแต่ละห้องนอน</span>
          {rooms.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {rooms.length} ห้อง
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRoom}
          className="gap-1.5 text-sm"
        >
          <Plus className="h-4 w-4" />
          เพิ่มห้องนอน
        </Button>
      </div>

      {/* Room list */}
      {rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          ยังไม่มีข้อมูลห้องนอน — กดปุ่ม&nbsp;
          <span className="font-medium text-foreground">+ เพิ่มห้องนอน</span>
          &nbsp;เพื่อเริ่มต้น
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map((room, index) => {
            const isOpen = openRooms.has(room.id);
            return (
              <div key={room.id} className="rounded-lg border bg-card overflow-hidden">
                {/* Room header — click to expand */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/40 transition-colors"
                  onClick={() => toggleRoom(room.id)}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <BedDouble className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-sm flex-1">
                    {room.name || `ห้องนอนที่ ${index + 1}`}
                  </span>
                  <div className="hidden sm:flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {room.bed_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {room.bed_count} เตียง
                    </Badge>
                    {room.has_ac && (
                      <Badge variant="secondary" className="text-xs">
                        แอร์
                      </Badge>
                    )}
                    {room.has_ensuite && (
                      <Badge variant="secondary" className="text-xs">
                        ห้องน้ำใน
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRoom(room.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Room details — collapsible */}
                {isOpen && (
                  <div className="border-t px-4 py-4 space-y-5 bg-muted/20">
                    {/* Row 1: Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">ชื่อห้อง</Label>
                      <Input
                        value={room.name}
                        onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                        placeholder="เช่น ห้องนอนหลัก, ห้องนอนรอง"
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Row 2: Bed type + count */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">ประเภทเตียง</Label>
                        <Select
                          value={room.bed_type}
                          onValueChange={(v) => updateRoom(room.id, { bed_type: v ?? room.bed_type })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BED_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="text-sm">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">จำนวนเตียง</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={room.bed_count}
                          onChange={(e) =>
                            updateRoom(room.id, {
                              bed_count: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Row 3: Amenity toggles */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">สิ่งอำนวยความสะดวกในห้อง</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {AMENITY_ITEMS.map(({ key, label }) => (
                          <div
                            key={key}
                            className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                          >
                            <span className="text-sm">{label}</span>
                            <Switch
                              checked={room[key]}
                              onCheckedChange={(checked) =>
                                updateRoom(room.id, { [key]: checked })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Row 4: Notes */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">รายละเอียดเตียง / หมายเหตุ</Label>
                      <Textarea
                        value={room.notes}
                        onChange={(e) => updateRoom(room.id, { notes: e.target.value })}
                        placeholder="เช่น ชั้น 1: เตียง 5 ฟุต, ชั้น 2: เตียง 3 ฟุต; วิวสระน้ำ, ห้องมุม"
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
