"use client";

import React from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────

export interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance_km: number | null;
  walkable: boolean;
}

interface NearbyPlacesEditorProps {
  value: NearbyPlace[];
  onChange: (places: NearbyPlace[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────

const PLACE_TYPES = [
  "ร้านสะดวกซื้อ",
  "ร้านอาหาร",
  "ห้างสรรพสินค้า",
  "ตลาดสด",
  "ปั๊มน้ำมัน",
  "โรงพยาบาล",
  "ร้านนวด / สปา",
  "สถานที่ท่องเที่ยว",
  "ร้านสะดวกซื้อ / ATM",
  "อื่นๆ",
];

// ─── Component ────────────────────────────────────────────────────────────

export function NearbyPlacesEditor({ value, onChange }: NearbyPlacesEditorProps) {
  const places = value ?? [];

  const addPlace = () => {
    const newPlace: NearbyPlace = {
      id: `place_${Date.now()}`,
      name: "",
      type: "ร้านสะดวกซื้อ",
      distance_km: null,
      walkable: false,
    };
    onChange([...places, newPlace]);
  };

  const removePlace = (id: string) => {
    onChange(places.filter((p) => p.id !== id));
  };

  const updatePlace = (id: string, patch: Partial<NearbyPlace>) => {
    onChange(places.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">ร้านสะดวกซื้อ / ร้านอาหารใกล้เคียง</span>
          {places.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {places.length} รายการ
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPlace}
          className="gap-1.5 text-sm"
        >
          <Plus className="h-4 w-4" />
          เพิ่มสถานที่
        </Button>
      </div>

      {/* Column headers */}
      {places.length > 0 && (
        <div className="grid grid-cols-[1fr_140px_80px_72px_32px] gap-2 px-1">
          <Label className="text-xs text-muted-foreground">ชื่อสถานที่</Label>
          <Label className="text-xs text-muted-foreground">ประเภท</Label>
          <Label className="text-xs text-muted-foreground">ระยะ (กม.)</Label>
          <Label className="text-xs text-muted-foreground">เดินได้</Label>
          <span />
        </div>
      )}

      {/* Empty state */}
      {places.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          ยังไม่มีสถานที่ — กดปุ่ม&nbsp;
          <span className="font-medium text-foreground">+ เพิ่มสถานที่</span>
          &nbsp;เพื่อเริ่มต้น
        </div>
      ) : (
        <div className="space-y-2">
          {places.map((place, index) => (
            <div
              key={place.id}
              className="grid grid-cols-[1fr_140px_80px_72px_32px] gap-2 items-center rounded-lg border bg-card px-3 py-2"
            >
              {/* Name */}
              <Input
                value={place.name}
                onChange={(e) => updatePlace(place.id, { name: e.target.value })}
                placeholder={`สถานที่ ${index + 1}`}
                className="h-8 text-sm"
              />

              {/* Type */}
              <Select
                value={place.type}
                onValueChange={(v) => updatePlace(place.id, { type: v ?? place.type })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-sm">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Distance */}
              <Input
                type="number"
                min={0}
                step={0.1}
                value={place.distance_km ?? ""}
                onChange={(e) =>
                  updatePlace(place.id, {
                    distance_km: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="0.5"
                className="h-8 text-sm"
              />

              {/* Walkable */}
              <div className="flex items-center gap-1.5 justify-center">
                <Switch
                  checked={place.walkable}
                  onCheckedChange={(checked) => updatePlace(place.id, { walkable: checked })}
                />
              </div>

              {/* Delete */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => removePlace(place.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
