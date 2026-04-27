"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Auto-save hook — debounces writes by `delay` ms.
 * Calls `onSave` whenever `data` changes after the debounce period.
 */
export function useAutoSave<T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  delay = 3000,
  enabled = true
) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestData = useRef(data);

  latestData.current = data;

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(latestData.current);
      setLastSaved(new Date());
    } catch {
      // silent — caller handles errors via toast
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  useEffect(() => {
    if (!enabled) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, delay, enabled]);

  return { saving, lastSaved };
}
