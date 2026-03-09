// ─── Field Types ────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "textarea"
  | "multiselect";

export interface PropertyField {
  id: number;
  field_key: string;
  label: string;
  type: FieldType;
  section: string;
  required: boolean;
  options: string[] | null;
  order_index: number;
  is_active: boolean;
}

export type PropertyFieldInsert = Omit<PropertyField, "id">;
export type PropertyFieldUpdate = Partial<PropertyFieldInsert>;

// ─── Property Types ────────────────────────────────────────────────────────

export interface Property {
  id: number;
  house_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type PropertyInsert = Omit<Property, "id" | "created_at" | "updated_at">;
export type PropertyUpdate = Partial<PropertyInsert>;

// ─── Section Config ────────────────────────────────────────────────────────

export interface SectionConfig {
  key: string;
  label: string;
  icon: string;
  order: number;
}

// ─── API Response ──────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}
