import { NextRequest, NextResponse } from "next/server";

const POSTGREST_URL =
  process.env.POSTGREST_URL ?? "http://localhost:3001";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const houseId = searchParams.get("house_id");
  const format = searchParams.get("format") ?? "json";

  try {
    // Fetch properties from PostgREST
    const url = houseId
      ? `${POSTGREST_URL}/properties?house_id=eq.${encodeURIComponent(houseId)}`
      : `${POSTGREST_URL}/properties?order=created_at.desc`;

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch properties" },
        { status: res.status }
      );
    }

    const properties = await res.json();

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
