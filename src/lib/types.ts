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

export interface PropertyChangeField {
  field_key: string;
  label: string;
  old_value: unknown;
  new_value: unknown;
}

export interface PropertyChangeLog {
  id: number;
  property_id: number;
  house_id: string;
  actor_user_id: number | null;
  actor_username_snapshot: string;
  action: "create" | "update";
  changed_fields: PropertyChangeField[];
  created_at: string;
}

export type PropertyChangeLogInsert = Omit<PropertyChangeLog, "id" | "created_at">;

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  role: "super_admin" | "editor";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Section Config ────────────────────────────────────────────────────────

export interface SectionConfig {
  key: string;
  label: string;
  icon: string;
  order: number;
}

// ─── Property Notes ────────────────────────────────────────────────────────

export interface PropertyNote {
  id: number;
  property_id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export type PropertyNoteInsert = Omit<PropertyNote, "id" | "created_at" | "updated_at">;
export type PropertyNoteUpdate = Partial<Omit<PropertyNote, "id" | "property_id" | "created_at" | "updated_at">>;

// ─── Negative Disputes (ฐานความรู้แชทบอท) ────────────────────────────────

export interface NegativeDispute {
  id: number;
  property_id: number;
  complaint: string;   // ข้อร้องเรียน/คำพูดเชิงลบที่ลูกค้าอาจพูด
  response: string;    // คำชี้แจงที่แชทบอทจะใช้ตอบลูกค้า
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type NegativeDisputeInsert = Omit<NegativeDispute, "id" | "created_at" | "updated_at">;
export type NegativeDisputeUpdate = Partial<Omit<NegativeDispute, "id" | "property_id" | "created_at" | "updated_at">>;

// ─── API Response ──────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}
