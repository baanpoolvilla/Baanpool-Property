"use client";

import React from "react";
import { PropertyField } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CompletenessScoreProps {
  fields: PropertyField[];
  data: Record<string, unknown>;
}

export function CompletenessScore({ fields, data }: CompletenessScoreProps) {
  const activeFields = fields.filter((f) => f.is_active);
  if (activeFields.length === 0) return null;

  const filledCount = activeFields.filter((f) => {
    const v = data[f.field_key];
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }).length;

  const pct = Math.round((filledCount / activeFields.length) * 100);

  const color =
    pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="flex items-center gap-3">
      <Progress value={pct} className="h-2 flex-1" />
      <Badge variant="outline" className={color}>
        {pct}% complete
      </Badge>
      <span className="text-xs text-muted-foreground">
        {filledCount}/{activeFields.length} fields
      </span>
    </div>
  );
}
