import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Using Supabase client to connect to PostgREST
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

// Maps field keys to Thai label + section for AI-readable output
// Fetched from DB at runtime
async function getFieldMeta(): Promise<
  Record<string, { label: string; section: string }>
> {
  const { data } = await supabase
    .from("property_fields")
    .select("field_key, label, section")
    .eq("is_active", true);
  const map: Record<string, { label: string; section: string }> = {};
  for (const f of data ?? []) {
    map[f.field_key] = { label: f.label, section: f.section };
  }
  return map;
}

// Section display names in Thai for AI
const SECTION_LABELS: Record<string, string> = {
  basic_info: "ข้อมูลทั่วไป",
  location: "ที่ตั้ง / แผนที่",
  rooms: "ห้องนอน / ห้องน้ำ",
  capacity: "ความจุ / พื้นที่ใช้สอย",
  pool: "สระว่ายน้ำ",
  parking: "ที่จอดรถ",
  facilities: "สิ่งอำนวยความสะดวก",
  equipment: "เครื่องใช้ / อุปกรณ์เสริม",
  pricing: "ราคา / ค่าบริการ",
  utilities: "สาธารณูปโภค / ค่าใช้จ่าย",
  rules: "กฎ / ข้อปฏิบัติ",
  time_rules: "เวลา / เสียง / แสงไฟ",
  contact: "ผู้ดูแล / ติดต่อ",
};

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

    const fieldMeta = await getFieldMeta();

    if (format === "csv") {
      // Flat CSV for spreadsheet use
      const allKeys = new Set<string>();
      for (const p of properties) {
        Object.keys(p.data).forEach((k) => allKeys.add(k));
      }
      const dataKeys = Array.from(allKeys).sort();
      const headers = ["house_id", ...dataKeys, "created_at", "updated_at"];

      const rows = properties.map(
        (p: {
          house_id: string;
          data: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        }) =>
          headers
            .map((h) => {
              let val: unknown;
              if (h === "house_id") val = p.house_id;
              else if (h === "created_at") val = p.created_at;
              else if (h === "updated_at") val = p.updated_at;
              else val = p.data[h];

              if (val === null || val === undefined) return "";
              if (Array.isArray(val)) return `"${val.join("; ")}"`;
              if (typeof val === "boolean") return val ? "ใช่" : "ไม่ใช่";
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

    // ─── AI-friendly structured JSON ────────────────────────────────
    const structured = properties.map(
      (p: {
        house_id: string;
        data: Record<string, unknown>;
        created_at: string;
        updated_at: string;
      }) => {
        // Group data by section
        const sections: Record<
          string,
          { section_name: string; fields: Record<string, { label: string; value: unknown }> }
        > = {};

        for (const [key, value] of Object.entries(p.data)) {
          if (value === null || value === undefined || value === "") continue;

          const meta = fieldMeta[key];
          const sectionKey = meta?.section ?? "other";
          const label = meta?.label ?? key;

          if (!sections[sectionKey]) {
            sections[sectionKey] = {
              section_name: SECTION_LABELS[sectionKey] ?? sectionKey,
              fields: {},
            };
          }

          // Format boolean values to Thai
          const displayValue =
            typeof value === "boolean" ? (value ? "ใช่" : "ไม่ใช่") : value;

          sections[sectionKey].fields[key] = {
            label,
            value: displayValue,
          };
        }

        return {
          house_id: p.house_id,
          sections,
          metadata: {
            created_at: p.created_at,
            updated_at: p.updated_at,
          },
        };
      }
    );

    return NextResponse.json(
      {
        total: structured.length,
        description:
          "ข้อมูลที่พักสำหรับ Pool Villa — จัดกลุ่มตามหมวดหมู่ พร้อมป้ายกำกับภาษาไทย",
        properties: structured,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
