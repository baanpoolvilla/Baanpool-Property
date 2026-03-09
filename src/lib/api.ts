import { POSTGREST_URL } from "./constants";
import type {
  Property,
  PropertyField,
  PropertyFieldInsert,
  PropertyFieldUpdate,
  PropertyInsert,
  PropertyUpdate,
} from "./types";

// ─── Generic helpers ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${POSTGREST_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return [] as unknown as T;

  return res.json();
}

// ─── Property Fields ───────────────────────────────────────────────────────

export async function fetchPropertyFields(
  activeOnly = false
): Promise<PropertyField[]> {
  const filter = activeOnly ? "&is_active=eq.true" : "";
  return request<PropertyField[]>(
    `/property_fields?order=order_index.asc${filter}`
  );
}

export async function fetchPropertyField(
  id: number
): Promise<PropertyField | null> {
  const rows = await request<PropertyField[]>(
    `/property_fields?id=eq.${id}`
  );
  return rows[0] ?? null;
}

export async function createPropertyField(
  data: PropertyFieldInsert
): Promise<PropertyField> {
  const rows = await request<PropertyField[]>("/property_fields", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return rows[0];
}

export async function updatePropertyField(
  id: number,
  data: PropertyFieldUpdate
): Promise<PropertyField> {
  const rows = await request<PropertyField[]>(
    `/property_fields?id=eq.${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return rows[0];
}

export async function deletePropertyField(id: number): Promise<void> {
  await request(`/property_fields?id=eq.${id}`, { method: "DELETE" });
}

// ─── Properties ────────────────────────────────────────────────────────────

export async function fetchProperties(): Promise<Property[]> {
  return request<Property[]>("/properties?order=created_at.desc");
}

export async function fetchProperty(id: number): Promise<Property | null> {
  const rows = await request<Property[]>(`/properties?id=eq.${id}`);
  return rows[0] ?? null;
}

export async function fetchPropertyByHouseId(
  houseId: string
): Promise<Property | null> {
  const rows = await request<Property[]>(
    `/properties?house_id=eq.${houseId}`
  );
  return rows[0] ?? null;
}

export async function createProperty(
  data: PropertyInsert
): Promise<Property> {
  const rows = await request<Property[]>("/properties", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return rows[0];
}

export async function updateProperty(
  id: number,
  data: PropertyUpdate
): Promise<Property> {
  const rows = await request<Property[]>(`/properties?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return rows[0];
}

export async function deleteProperty(id: number): Promise<void> {
  await request(`/properties?id=eq.${id}`, { method: "DELETE" });
}

export async function searchProperties(
  query: string
): Promise<Property[]> {
  // Search by house_id or within JSONB data
  return request<Property[]>(
    `/properties?or=(house_id.ilike.*${encodeURIComponent(query)}*,data->>house_name.ilike.*${encodeURIComponent(query)}*)&order=created_at.desc`
  );
}
