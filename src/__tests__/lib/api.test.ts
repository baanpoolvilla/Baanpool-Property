import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchPropertyFields,
  fetchPropertyField,
  createPropertyField,
  updatePropertyField,
  deletePropertyField,
  fetchProperties,
  fetchProperty,
  fetchPropertyByHouseId,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties,
} from "@/lib/api";
import type { PropertyField, Property } from "@/lib/types";

// ─── Mock fetch globally ───────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── Sample data ───────────────────────────────────────────────────────────

const sampleField: PropertyField = {
  id: 1,
  field_key: "house_name",
  label: "House Name",
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
  data: { house_name: "PT60 Pattaya", max_guests: 10 },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ─── Property Fields API ───────────────────────────────────────────────────

describe("Property Fields API", () => {
  it("fetchPropertyFields returns all fields", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleField]));

    const fields = await fetchPropertyFields();

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/property_fields?order=order_index.asc"),
      expect.any(Object)
    );
    expect(fields).toEqual([sampleField]);
  });

  it("fetchPropertyFields with activeOnly=true adds filter", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleField]));

    await fetchPropertyFields(true);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("is_active=eq.true");
  });

  it("fetchPropertyFields with activeOnly=false has no active filter", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleField]));

    await fetchPropertyFields(false);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain("is_active=eq.true");
  });

  it("fetchPropertyField returns a single field", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleField]));

    const field = await fetchPropertyField(1);

    expect(field).toEqual(sampleField);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("id=eq.1");
  });

  it("fetchPropertyField returns null when not found", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]));

    const field = await fetchPropertyField(999);

    expect(field).toBeNull();
  });

  it("createPropertyField sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleField]));

    const { id, ...insertData } = sampleField;
    const result = await createPropertyField(insertData);

    expect(result).toEqual(sampleField);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/property_fields");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual(insertData);
  });

  it("updatePropertyField sends PATCH", async () => {
    const updated = { ...sampleField, label: "Updated Name" };
    mockFetch.mockResolvedValueOnce(mockResponse([updated]));

    const result = await updatePropertyField(1, { label: "Updated Name" });

    expect(result.label).toBe("Updated Name");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("id=eq.1");
    expect(init.method).toBe("PATCH");
  });

  it("deletePropertyField sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve([]) });

    await deletePropertyField(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("id=eq.1");
    expect(init.method).toBe("DELETE");
  });
});

// ─── Properties API ───────────────────────────────────────────────────────

describe("Properties API", () => {
  it("fetchProperties returns all properties", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleProperty]));

    const props = await fetchProperties();

    expect(props).toEqual([sampleProperty]);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/properties?order=created_at.desc");
  });

  it("fetchProperty returns single property", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleProperty]));

    const prop = await fetchProperty(1);

    expect(prop).toEqual(sampleProperty);
  });

  it("fetchProperty returns null when not found", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]));

    const prop = await fetchProperty(999);

    expect(prop).toBeNull();
  });

  it("fetchPropertyByHouseId queries by house_id", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleProperty]));

    const prop = await fetchPropertyByHouseId("PT60");

    expect(prop).toEqual(sampleProperty);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("house_id=eq.PT60");
  });

  it("createProperty sends POST", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleProperty]));

    const result = await createProperty({
      house_id: "PT60",
      data: { house_name: "PT60 Pattaya" },
    });

    expect(result.house_id).toBe("PT60");
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe("POST");
  });

  it("updateProperty sends PATCH", async () => {
    const updated = { ...sampleProperty, data: { house_name: "Updated" } };
    mockFetch.mockResolvedValueOnce(mockResponse([updated]));

    const result = await updateProperty(1, { data: { house_name: "Updated" } });

    expect(result.data.house_name).toBe("Updated");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("id=eq.1");
    expect(init.method).toBe("PATCH");
  });

  it("deleteProperty sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve([]) });

    await deleteProperty(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("id=eq.1");
    expect(init.method).toBe("DELETE");
  });

  it("searchProperties encodes query in URL", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([sampleProperty]));

    await searchProperties("PT60");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("PT60");
    expect(url).toContain("house_id.ilike");
    expect(url).toContain("house_name.ilike");
  });
});

// ─── Error handling ────────────────────────────────────────────────────────

describe("API Error Handling", () => {
  it("throws Error with message from API response", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: "Unique constraint violated" }, 409)
    );

    await expect(fetchProperties()).rejects.toThrow("Unique constraint violated");
  });

  it("throws generic error when no message in body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(fetchProperties()).rejects.toThrow("Request failed: 500");
  });

  it("sends correct headers including Prefer", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]));

    await fetchProperties();

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["Prefer"]).toBe("return=representation");
  });
});
