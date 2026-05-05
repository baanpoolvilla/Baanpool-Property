import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { PropertyChangeField } from "@/lib/types";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token || null);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      propertyId?: number;
      houseId?: string;
      action?: "create" | "update";
      changedFields?: PropertyChangeField[];
    };

    if (!body.propertyId || !body.houseId || !body.action) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const changedFields = body.changedFields ?? [];

    // De-dup guard: auto-save and manual save can fire almost simultaneously.
    // If the latest log has the same action + payload within 15 seconds, skip insert.
    const { data: latestLogs } = await supabase
      .from("property_change_logs")
      .select("action, changed_fields, created_at")
      .eq("property_id", body.propertyId)
      .order("created_at", { ascending: false })
      .limit(1);

    const latest = latestLogs?.[0] as
      | { action?: string; changed_fields?: unknown; created_at?: string }
      | undefined;
    if (latest?.created_at && latest.action === body.action) {
      const samePayload = JSON.stringify(latest.changed_fields ?? []) === JSON.stringify(changedFields);
      const elapsedMs = Date.now() - new Date(latest.created_at).getTime();
      if (samePayload && elapsedMs >= 0 && elapsedMs <= 15_000) {
        return NextResponse.json({ ok: true, deduped: true });
      }
    }

    // Try new schema first (actor_user_id + actor_username_snapshot).
    const primary = await supabase
      .from("property_change_logs")
      .insert({
        property_id: body.propertyId,
        house_id: body.houseId,
        actor_user_id: session.userId,
        actor_username_snapshot: session.username,
        action: body.action,
        changed_fields: changedFields,
      });

    if (primary.error) {
      // Backward-compat with legacy schema that requires actor_username.
      const fallback = await supabase
        .from("property_change_logs")
        .insert({
          property_id: body.propertyId,
          house_id: body.houseId,
          actor_username: session.username,
          action: body.action,
          changed_fields: changedFields,
        });

      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึก log ได้" }, { status: 500 });
  }
}