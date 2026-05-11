import type { PropertyField } from "./types";
import { FIELDS_EXCLUDED_FROM_SCORE } from "./constants";

interface CompletenessResult {
  percent: number;
  filledCount: number;
  totalCount: number;
}

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

export function calculateCompleteness(
  fields: PropertyField[],
  data: Record<string, unknown>
): CompletenessResult {
  const activeFields = fields.filter(
    (f) => f.is_active && !FIELDS_EXCLUDED_FROM_SCORE.includes(f.field_key)
  );

  if (activeFields.length === 0) {
    return { percent: 0, filledCount: 0, totalCount: 0 };
  }

  const filledCount = activeFields.filter((f) => isFilled(data[f.field_key])).length;
  const totalCount = activeFields.length;
  const percent = Math.round((filledCount / totalCount) * 100);

  return { percent, filledCount, totalCount };
}
