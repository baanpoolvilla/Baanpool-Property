"use client";

import React from "react";
import type { PropertyField } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface DynamicFieldProps {
  field: PropertyField;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}

export function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  const id = `field-${field.field_key}`;

  switch (field.type) {
    case "text":
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={id}
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.field_key, e.target.value)}
            placeholder={`กรุณากรอก${field.label}`}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={id}
            type="number"
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) => {
              const v = e.target.value;
              onChange(field.field_key, v === "" ? null : Number(v));
            }}
            placeholder={`กรุณากรอก${field.label}`}
          />
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor={id} className="cursor-pointer">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Switch
            id={id}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(field.field_key, checked)}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(field.field_key, v ?? "")}
          >
            <SelectTrigger id={id} className="w-full">
              <SelectValue placeholder={`เลือก${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.field_key, e.target.value)}
            placeholder={`กรุณากรอก${field.label}`}
            rows={3}
          />
        </div>
      );

    case "multiselect":
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(field.options ?? []).map((opt) => {
              const selected = Array.isArray(value) ? value : [];
              const checked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      const next = c
                        ? [...selected, opt]
                        : selected.filter((v: string) => v !== opt);
                      onChange(field.field_key, next);
                    }}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      );

    default:
      return null;
  }
}
