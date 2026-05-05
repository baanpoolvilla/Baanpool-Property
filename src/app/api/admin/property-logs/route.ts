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

    // Try new schema first (actor_user_id + actor_username_snapshot).
    const primary = await supabase
      .from("property_change_logs")
      .insert({
        property_id: body.propertyId,
        house_id: body.houseId,
        actor_user_id: session.userId,
        actor_username_snapshot: session.username,
        action: body.action,
        changed_fields: body.changedFields ?? [],
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
          changed_fields: body.changedFields ?? [],
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