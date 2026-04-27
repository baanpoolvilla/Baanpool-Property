import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePropertyFields } from "@/hooks/use-property-fields";
import type { PropertyField } from "@/lib/types";

// ─── Mock API ──────────────────────────────────────────────────────────────

const mockFetchPropertyFields = vi.fn();

vi.mock("@/lib/api", () => ({
  fetchPropertyFields: (...args: unknown[]) => mockFetchPropertyFields(...args),
}));

const sampleFields: PropertyField[] = [
  {
    id: 1,
    field_key: "house_name",
    label: "House Name",
    type: "text",
    section: "basic_info",
    required: true,
    options: null,
    order_index: 1,
    is_active: true,
  },
  {
    id: 2,
    field_key: "max_guests",
    label: "Max Guests",
    type: "number",
    section: "capacity",
    required: false,
    options: null,
    order_index: 2,
    is_active: true,
  },
];

beforeEach(() => {
  mockFetchPropertyFields.mockReset();
});

describe("usePropertyFields Hook", () => {
  it("loads fields on mount", async () => {
    mockFetchPropertyFields.mockResolvedValueOnce(sampleFields);

    const { result } = renderHook(() => usePropertyFields(true));

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fields).toEqual(sampleFields);
    expect(result.current.error).toBeNull();
    expect(mockFetchPropertyFields).toHaveBeenCalledWith(true);
  });

  it("passes activeOnly parameter", async () => {
    mockFetchPropertyFields.mockResolvedValueOnce(sampleFields);

    renderHook(() => usePropertyFields(false));

    await waitFor(() => {
      expect(mockFetchPropertyFields).toHaveBeenCalledWith(false);
    });
  });

  it("sets error on failure", async () => {
    mockFetchPropertyFields.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => usePropertyFields());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.fields).toEqual([]);
  });

  it("uses cache on subsequent calls", async () => {
    mockFetchPropertyFields.mockResolvedValueOnce(sampleFields);

    const { result, rerender } = renderHook(() => usePropertyFields(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Re-render — should use cache, NOT call fetch again
    rerender();

    expect(mockFetchPropertyFields).toHaveBeenCalledTimes(1);
    expect(result.current.fields).toEqual(sampleFields);
  });

  it("refresh clears cache and re-fetches", async () => {
    mockFetchPropertyFields.mockResolvedValue(sampleFields);

    const { result } = renderHook(() => usePropertyFields(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call refresh
    await act(async () => {
      await result.current.refresh();
    });

    // Should have called API twice (initial + refresh)
    expect(mockFetchPropertyFields).toHaveBeenCalledTimes(2);
  });

  it("handles non-Error exceptions", async () => {
    mockFetchPropertyFields.mockRejectedValueOnce("string error");

    const { result } = renderHook(() => usePropertyFields());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load fields");
  });
});
