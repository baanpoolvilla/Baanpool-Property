import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PropertyField, Property } from "@/lib/types";

// ─── Mock Supabase client ──────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockIlike = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockOr = vi.fn();
const mockFrom = vi.fn();

function resetChain(resolvedData: unknown = [], error: unknown = null) {
  const result = { data: resolvedData, error };

  mockSingle.mockReturnValue(Promise.resolve(result));
  mockOrder.mockReturnValue(Promise.resolve(result));
  mockEq.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle, maybeSingle: vi.fn().mockReturnValue(Promise.resolve(result)), or: mockOr, ...Promise.resolve(result), then: (fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn) });
  mockIlike.mockReturnValue(Promise.resolve(result));
  mockOr.mockReturnValue({ order: mockOrder, ...Promise.resolve(result), then: (fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn) });

  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle, or: mockOr });
  mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockReturnValue(Promise.resolve(result)) }) });
  mockUpdate.mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockReturnValue(Promise.resolve(result)) }) }) });
  mockDelete.mockReturnValue({ eq: vi.fn().mockReturnValue(Promise.resolve(result)) });

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });
}

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Import AFTER mock is set up
const api = await import("@/lib/api");

// ─── Sample data ───────────────────────────────────────────────────────────

const sampleField: PropertyField = {
  id: 1,
  field_key: "house_name",
  label: "ชื่อที่พัก",
  type: "text",
  section: "basic_info",
  required: true,
  options: null,
  order_index: 1,
  is_active: true,
};

const sampleProperty: Property = {
  id: 1,
  house_id: "PT60",
  data: { house_name: "PT60 พัทยา", max_guests: 10 },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Property Fields API ───────────────────────────────────────────────────

describe("Property Fields API", () => {
  it("fetchPropertyFields calls supabase from property_fields", async () => {
    resetChain([sampleField]);
    const fields = await api.fetchPropertyFields();
    expect(mockFrom).toHaveBeenCalledWith("property_fields");
    expect(fields).toEqual([sampleField]);
  });

  it("fetchPropertyField returns single field", async () => {
    resetChain(sampleField);
    const field = await api.fetchPropertyField(1);
    expect(mockFrom).toHaveBeenCalledWith("property_fields");
    expect(field).toEqual(sampleField);
  });

  it("createPropertyField calls insert", async () => {
    resetChain(sampleField);
    const result = await api.createPropertyField({
      field_key: "house_name",
      label: "ชื่อที่พัก",
      type: "text",
      section: "basic_info",
      required: true,
      options: null,
      order_index: 1,
      is_active: true,
    });
    expect(mockFrom).toHaveBeenCalledWith("property_fields");
    expect(result).toEqual(sampleField);
  });

  it("deletePropertyField calls delete", async () => {
    resetChain(null);
    await api.deletePropertyField(1);
    expect(mockFrom).toHaveBeenCalledWith("property_fields");
  });
});

// ─── Properties API ───────────────────────────────────────────────────────

describe("Properties API", () => {
  it("fetchProperties calls supabase from properties", async () => {
    resetChain([sampleProperty]);
    const props = await api.fetchProperties();
    expect(mockFrom).toHaveBeenCalledWith("properties");
    expect(props).toEqual([sampleProperty]);
  });

  it("fetchProperty returns single property", async () => {
    resetChain(sampleProperty);
    const prop = await api.fetchProperty(1);
    expect(mockFrom).toHaveBeenCalledWith("properties");
    expect(prop).toEqual(sampleProperty);
  });

  it("createProperty calls insert", async () => {
    resetChain(sampleProperty);
    const result = await api.createProperty({
      house_id: "PT60",
      data: { house_name: "PT60 พัทยา" },
    });
    expect(mockFrom).toHaveBeenCalledWith("properties");
    expect(result).toEqual(sampleProperty);
  });

  it("deleteProperty calls delete", async () => {
    resetChain(null);
    await api.deleteProperty(1);
    expect(mockFrom).toHaveBeenCalledWith("properties");
  });
});

// ─── Error handling ────────────────────────────────────────────────────────

describe("API Error Handling", () => {
  it("throws Error when supabase returns error", async () => {
    resetChain(null, { message: "Something went wrong" });
    await expect(api.fetchProperties()).rejects.toThrow("Something went wrong");
  });
});
