"use client";

import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Bath } from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────

export interface BathroomDetail {
  id: string;
  label: string;
  floor: string;
  is_ensuite: boolean;
  has_shower: boolean;
  has_bathtub: boolean;
  has_water_heater: boolean;
}

interface BathroomEditorProps {
  value: BathroomDetail[];
  onChange: (rooms: BathroomDetail[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────

const FLOOR_OPTIONS = ["ชั้น G (ล่าง)", "ชั้น 1", "ชั้น 2", "ชั้น 3", "ชั้น Rooftop"];

const AMENITY_ITEMS: {
  key: keyof Pick<BathroomDetail, "is_ensuite" | "has_shower" | "has_bathtub" | "has_water_heater">;
  label: string;
}[] = [
  { key: "is_ensuite", label: "ห้องน้ำในห้องนอน" },
  { key: "has_shower", label: "ฝักบัว" },
  { key: "has_bathtub", label: "อ่างอาบน้ำ" },
  { key: "has_water_heater", label: "เครื่องทำน้ำอุ่น" },
];

// ─── Component ────────────────────────────────────────────────────────────

export function BathroomEditor({ value, onChange }: BathroomEditorProps) {
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
    const newId = `bath_${Date.now()}`;
    const newRoom: BathroomDetail = {
      id: newId,
      label: `ห้องน้ำที่ ${rooms.length + 1}`,
      floor: "ชั้น 1",
      is_ensuite: false,
      has_shower: true,
      has_bathtub: false,
      has_water_heater: true,
    };
    onChange([...rooms, newRoom]);
    setOpenRooms((prev) => new Set([...prev, newId]));
  };

  const removeRoom = (id: string) => {
    onChange(rooms.filter((r) => r.id !== id));
  };

  const updateRoom = (id: string, patch: Partial<BathroomDetail>) => {
    onChange(rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bath className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">รายละเอียดห้องน้ำ</span>
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
          เพิ่มห้องน้ำ
        </Button>
      </div>

      {/* Empty state */}
      {rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          ยังไม่มีข้อมูลห้องน้ำ — กดปุ่ม&nbsp;
          <span className="font-medium text-foreground">+ เพิ่มห้องน้ำ</span>
          &nbsp;เพื่อเริ่มต้น
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map((room, index) => {
            const isOpen = openRooms.has(room.id);
            return (
              <div key={room.id} className="rounded-lg border bg-card overflow-hidden">
                {/* Room header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/40 transition-colors"
                  onClick={() => toggleRoom(room.id)}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <Bath className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="font-medium text-sm flex-1">
                    {room.label || `ห้องน้ำที่ ${index + 1}`}
                  </span>
                  <div className="hidden sm:flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {room.floor}
                    </Badge>
                    {room.is_ensuite && (
                      <Badge variant="secondary" className="text-xs">ในห้องนอน</Badge>
                    )}
                    {room.has_bathtub && (
                      <Badge variant="secondary" className="text-xs">อ่างอาบน้ำ</Badge>
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

                {/* Room details */}
                {isOpen && (
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">ชื่อ / ตำแหน่ง</Label>
                        <Input
                          value={room.label}
                          onChange={(e) => updateRoom(room.id, { label: e.target.value })}
                          placeholder="เช่น ห้องน้ำมาสเตอร์, ห้องน้ำชั้นล่าง"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">ชั้น</Label>
                        <Select
                          value={room.floor}
                          onValueChange={(v) => updateRoom(room.id, { floor: v ?? room.floor })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FLOOR_OPTIONS.map((f) => (
                              <SelectItem key={f} value={f} className="text-sm">
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
