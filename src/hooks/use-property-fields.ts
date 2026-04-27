"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PropertyField } from "@/lib/types";
import { fetchPropertyFields } from "@/lib/api";

/**
 * Caches active property field definitions in React state.
 * Re-fetches when `refresh` is called.
 */
export function usePropertyFields(activeOnly = true) {
  const [fields, setFields] = useState<PropertyField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<PropertyField[] | null>(null);

  const load = useCallback(async () => {
    // Return cached if available
    if (cache.current) {
      setFields(cache.current);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPropertyFields(activeOnly);
      cache.current = data;
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fields");
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  const refresh = useCallback(async () => {
    cache.current = null;
    await load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { fields, loading, error, refresh };
}
