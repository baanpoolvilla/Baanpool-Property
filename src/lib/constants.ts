import { SectionConfig } from "./types";

// PostgREST base URL — override via env var
export const POSTGREST_URL =
  process.env.NEXT_PUBLIC_POSTGREST_URL ?? "http://localhost:3001";

// ─── Section definitions (display order & labels) ──────────────────────────

export const SECTIONS: SectionConfig[] = [
  { key: "basic_info", label: "Basic Information", icon: "info", order: 0 },
  { key: "location", label: "Location", icon: "map-pin", order: 1 },
  { key: "capacity", label: "Capacity & Rooms", icon: "users", order: 2 },
  { key: "facilities", label: "Facilities", icon: "building", order: 3 },
  { key: "parking", label: "Parking", icon: "car", order: 4 },
  { key: "pool_outdoor", label: "Pool & Outdoor", icon: "waves", order: 5 },
  { key: "pricing", label: "Pricing", icon: "banknote", order: 6 },
  { key: "utilities", label: "Utilities & Hours", icon: "zap", order: 7 },
  { key: "rules", label: "Rules & Policies", icon: "shield", order: 8 },
  { key: "contact", label: "Contact & Management", icon: "phone", order: 9 },
];

export const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean (Switch)" },
  { value: "select", label: "Select (Dropdown)" },
  { value: "textarea", label: "Textarea" },
  { value: "multiselect", label: "Multi-select" },
] as const;
