"use client";

import React from "react";
import { PropertyField } from "@/lib/types";
import { calculateCompleteness } from "@/lib/completeness";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CompletenessScoreProps {
  fields: PropertyField[];
  data: Record<string, unknown>;
}

export function CompletenessScore({ fields, data }: CompletenessScoreProps) {
  const { percent: pct, filledCount, totalCount } = calculateCompleteness(fields, data);
  if (totalCount === 0) return null;

  const color =
    pct >= 90 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="flex items-center gap-3">
      <Progress value={pct} className="h-2 flex-1" />
      <Badge variant="outline" className={color}>
        {pct}% สมบูรณ์
      </Badge>
      <span className="text-xs text-muted-foreground">
        กรอกแล้ว {filledCount}/{totalCount} รายการ
      </span>
    </div>
  );
}
