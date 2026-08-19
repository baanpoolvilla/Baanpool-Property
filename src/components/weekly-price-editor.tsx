"use client";

import React, { useState } from "react";
import { Banknote, CopyCheck, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DAY_PRICE_FIELDS,
  formatPrice,
  getDayPrices,
  getPriceRange,
  toPrice,
} from "@/lib/pricing";

interface WeeklyPriceEditorProps {
  /** data ทั้งก้อนของที่พัก (อ่านค่า price_mon … price_sun) */
  data: Record<string, unknown>;
  /** ใช้ตัวเดียวกับ DynamicField เพื่อให้ auto-save / change log ทำงานเหมือนกัน */
  onChange: (key: string, value: unknown) => void;
}

export function WeeklyPriceEditor({ data, onChange }: WeeklyPriceEditorProps) {
  const [fillValue, setFillValue] = useState("");

  const prices = getDayPrices(data);
  const range = getPriceRange(data);
  const filledCount = prices.filter((p) => p !== null).length;

  const applyToAllDays = () => {
    const value = toPrice(fillValue);
    if (value === null) return;
    for (const day of DAY_PRICE_FIELDS) {
      onChange(day.key, value);
    }
    setFillValue("");
  };

  const clearAllDays = () => {
    for (const day of DAY_PRICE_FIELDS) {
      onChange(day.key, null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">ราคาขายบ้าน รายวัน (บาท/คืน)</span>
          <Badge variant="secondary" className="text-xs">
            กรอกแล้ว {filledCount}/7 วัน
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            step={100}
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyToAllDays();
              }
            }}
            placeholder="ราคาเท่ากันทุกวัน"
            className="h-8 w-40 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applyToAllDays}
            disabled={toPrice(fillValue) === null}
            className="gap-1.5 text-sm"
          >
            <CopyCheck className="h-4 w-4" />
            ใส่ทุกวัน
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllDays}
            disabled={filledCount === 0}
            className="gap-1.5 text-sm text-muted-foreground"
          >
            <Eraser className="h-4 w-4" />
            ล้าง
          </Button>
        </div>
      </div>

      {/* 7 วัน */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {DAY_PRICE_FIELDS.map((day, index) => (
          <div
            key={day.key}
            className={`rounded-lg border px-3 py-2 space-y-1.5 ${
              day.weekend ? "bg-amber-50/60 border-amber-200" : "bg-card"
            }`}
          >
            <Label
              htmlFor={`field-${day.key}`}
              className="flex items-baseline gap-1.5 text-xs"
            >
              <span className="font-semibold">{day.short}</span>
              <span className="text-muted-foreground">{day.label}</span>
            </Label>
            <Input
              id={`field-${day.key}`}
              type="number"
              min={0}
              step={100}
              value={prices[index] !== null ? String(prices[index]) : ""}
              onChange={(e) =>
                onChange(day.key, e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="0"
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>

      {/* สรุป */}
      <p className="text-xs text-muted-foreground">
        {range ? (
          range.min === range.max ? (
            <>ราคาเท่ากันทุกวันที่กรอก: ฿{formatPrice(range.min)} / คืน</>
          ) : (
            <>
              ช่วงราคา: ฿{formatPrice(range.min)} – ฿{formatPrice(range.max)} / คืน
            </>
          )
        ) : (
          <>ยังไม่ได้กรอกราคารายวัน — เว้นว่างไว้ได้ถ้าใช้ราคาวันธรรมดา/วันหยุดด้านล่างแทน</>
        )}
      </p>
    </div>
  );
}
