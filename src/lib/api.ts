import { supabase } from "./supabase";
import type {
  Property,
  PropertyField,
  PropertyFieldInsert,
  PropertyFieldUpdate,
  PropertyInsert,
  PropertyUpdate,
  PropertyChangeLog,
  PropertyNote,
  PropertyNoteInsert,
  PropertyNoteUpdate,
  NegativeDispute,
  NegativeDisputeInsert,
  NegativeDisputeUpdate,
} from "./types";

// ─── Property Fields ───────────────────────────────────────────────────────

export async function fetchPropertyFields(
  activeOnly = false
): Promise<PropertyField[]> {
  let query = supabase
    .from("property_fields")
    .select("*")
    .order("order_index", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as PropertyField[];
}

export async function fetchPropertyField(
  id: number
): Promise<PropertyField | null> {
  const { data, error } = await supabase
    .from("property_fields")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PropertyField | null;
}

export async function createPropertyField(
  data: PropertyFieldInsert
): Promise<PropertyField> {
  const { data: result, error } = await supabase
    .from("property_fields")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as PropertyField;
}

export async function updatePropertyField(
  id: number,
  data: PropertyFieldUpdate
): Promise<PropertyField> {
  const { data: result, error } = await supabase
    .from("property_fields")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as PropertyField;
}

export async function deletePropertyField(id: number): Promise<void> {
  const { error } = await supabase
    .from("property_fields")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ─── Properties ────────────────────────────────────────────────────────────

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Property[];
}

export async function fetchProperty(id: number): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Property | null;
}

export async function fetchPropertyByHouseId(
  houseId: string
): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("house_id", houseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Property | null;
}

export async function createProperty(
  data: PropertyInsert
): Promise<Property> {
  const { data: result, error } = await supabase
    .from("properties")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as Property;
}

export async function updateProperty(
  id: number,
  data: PropertyUpdate
): Promise<Property> {
  const { data: result, error } = await supabase
    .from("properties")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as Property;
}

export async function deleteProperty(id: number): Promise<void> {
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function searchProperties(
  query: string
): Promise<Property[]> {
  const pattern = `%${query}%`;

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .or(`house_id.ilike.${pattern},data->>house_name.ilike.${pattern}`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Property[];
}

export async function fetchPropertyChangeLogs(
  propertyId: number
): Promise<PropertyChangeLog[]> {
  const { data, error } = await supabase
    .from("property_change_logs")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as PropertyChangeLog[];
}

// ─── Property Notes ────────────────────────────────────────────────────────

export async function fetchAllPropertyNotes(): Promise<PropertyNote[]> {
  const { data, error } = await supabase
    .from("property_notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as PropertyNote[];
}

export async function fetchPropertyNotes(
  propertyId: number
): Promise<PropertyNote[]> {
  const { data, error } = await supabase
    .from("property_notes")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as PropertyNote[];
}

export async function createPropertyNote(
  data: PropertyNoteInsert
): Promise<PropertyNote> {
  const { data: result, error } = await supabase
    .from("property_notes")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as PropertyNote;
}

export async function updatePropertyNote(
  id: number,
  data: PropertyNoteUpdate
): Promise<PropertyNote> {
  const { data: result, error } = await supabase
    .from("property_notes")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as PropertyNote;
}

export async function deletePropertyNote(id: number): Promise<void> {
  const { error } = await supabase
    .from("property_notes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ─── Negative Disputes ─────────────────────────────────────────────────────

export async function fetchNegativeDisputes(
  propertyId: number
): Promise<NegativeDispute[]> {
  const { data, error } = await supabase
    .from("property_disputes")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as NegativeDispute[];
}

export async function createNegativeDispute(
  data: NegativeDisputeInsert
): Promise<NegativeDispute> {
  const { data: result, error } = await supabase
    .from("property_disputes")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as NegativeDispute;
}

export async function updateNegativeDispute(
  id: number,
  data: NegativeDisputeUpdate
): Promise<NegativeDispute> {
  const { data: result, error } = await supabase
    .from("property_disputes")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as NegativeDispute;
}

export async function deleteNegativeDispute(id: number): Promise<void> {
  const { error } = await supabase
    .from("property_disputes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
