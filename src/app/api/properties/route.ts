import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const houseId = searchParams.get("house_id");
  const format = searchParams.get("format") ?? "json";

  try {
    let query = supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (houseId) {
      query = query.eq("house_id", houseId);
    }

    const { data: properties, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten data for export
    const flattened = properties.map(
      (p: { house_id: string; data: Record<string, unknown>; created_at: string; updated_at: string }) => ({
        house_id: p.house_id,
        ...p.data,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })
    );

    if (format === "csv") {
      // Build CSV
      const allKeys = new Set<string>();
      for (const item of flattened) {
        Object.keys(item).forEach((k) => allKeys.add(k));
      }
      const headers = Array.from(allKeys);
      const rows = flattened.map((item: Record<string, unknown>) =>
        headers
          .map((h) => {
            const val = item[h];
            if (val === null || val === undefined) return "";
            if (Array.isArray(val)) return `"${val.join("; ")}"`;
            if (typeof val === "boolean") return val ? "Yes" : "No";
            const s = String(val);
            return s.includes(",") || s.includes('"') || s.includes("\n")
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");

      return new NextResponse("\uFEFF" + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=properties.csv",
        },
      });
    }

    // Default: JSON
    return NextResponse.json(flattened, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
