import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "@/hooks/use-auto-save";

beforeEach(() => {
  vi.useFakeTimers();
});

describe("useAutoSave Hook", () => {
  it("does not save immediately", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutoSave({ name: "test" }, onSave, 1000, true));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves after delay", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutoSave({ name: "test" }, onSave, 1000, true));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ name: "test" });
  });

  it("does not save when disabled", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutoSave({ name: "test" }, onSave, 1000, false));

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("debounces multiple data changes", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    let data = { name: "first" };

    const { rerender } = renderHook(() =>
      useAutoSave(data, onSave, 1000, true)
    );

    // Change data before delay elapses
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    data = { name: "second" };
    rerender();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should only save once with latest data
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ name: "second" });
  });

  it("sets lastSaved after successful save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({ name: "test" }, onSave, 500, true)
    );

    expect(result.current.lastSaved).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.lastSaved).toBeInstanceOf(Date);
  });

  it("handles save errors silently", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Save failed"));
    const { result } = renderHook(() =>
      useAutoSave({ x: 1 }, onSave, 500, true)
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should not throw; lastSaved stays null
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.saving).toBe(false);
  });
});
