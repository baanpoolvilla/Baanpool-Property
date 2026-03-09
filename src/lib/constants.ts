import { SectionConfig } from "./types";

// API base URL — calls go through Next.js API proxy to avoid CORS/mixed-content
export const POSTGREST_URL = "/api/postgrest";

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
