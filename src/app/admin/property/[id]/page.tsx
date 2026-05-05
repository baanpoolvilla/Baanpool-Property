"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Save,
  Loader2,
  Info,
  MapPin,
  Users,
  Building,
  Shield,
  Car,
  Waves,
  Zap,
  Phone,
  Bed,
  Wrench,
  Clock,
} from "lucide-react";
import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { DynamicField } from "@/components/dynamic-field";
import { CompletenessScore } from "@/components/completeness-score";
import { BedroomEditor } from "@/components/bedroom-editor";
import type { BedroomRoom } from "@/components/bedroom-editor";
import { BathroomEditor } from "@/components/bathroom-editor";
import type { BathroomDetail } from "@/components/bathroom-editor";
import { NearbyPlacesEditor } from "@/components/nearby-places-editor";
import type { NearbyPlace } from "@/components/nearby-places-editor";
import { usePropertyFields } from "@/hooks/use-property-fields";
import { useAutoSave } from "@/hooks/use-auto-save";
import {
  createProperty,
  fetchProperty,
  updateProperty,
} from "@/lib/api";
import { SECTIONS } from "@/lib/constants";
import type { Property, PropertyChangeField, PropertyField } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const sectionIcons: Record<string, React.ReactNode> = {
  basic_info: <Info className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  rooms: <Bed className="h-4 w-4" />,
  capacity: <Users className="h-4 w-4" />,
  pool: <Waves className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  facilities: <Building className="h-4 w-4" />,
  equipment: <Wrench className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  rules: <Shield className="h-4 w-4" />,
  time_rules: <Clock className="h-4 w-4" />,
  contact: <Phone className="h-4 w-4" />,
};

function areValuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export default function PropertyFormPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string | undefined;
  const isNew = rawId === "new";
  const propertyId = isNew ? null : Number(rawId);

  const { fields, loading: fieldsLoading } = usePropertyFields(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [houseId, setHouseId] = useState("");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loadingProp, setLoadingProp] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(SECTIONS.map((s) => s.key))
  );
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const lastPersistedRef = useRef<{ house_id: string; data: Record<string, unknown> } | null>(
    isNew ? { house_id: "", data: {} } : null
  );

  // Load existing property
  useEffect(() => {
    if (isNew || !propertyId) return;

    (async () => {
      setLoadingProp(true);
      try {
        const p = await fetchProperty(propertyId);
        if (p) {
          setProperty(p);
          setHouseId(p.house_id);
          setData(p.data ?? {});
          lastPersistedRef.current = { house_id: p.house_id, data: p.data ?? {} };
          // enable auto-save after initial load
          setTimeout(() => setAutoSaveEnabled(true), 1000);
        } else {
          toast.error("ไม่พบที่พัก");
          router.push("/admin");
        }
      } catch {
        toast.error("ไม่สามารถโหลดที่พักได้");
      } finally {
        setLoadingProp(false);
      }
    })();
  }, [isNew, propertyId, router]);

  // Group fields by section
  const sectionGroups = useMemo(() => {
    const map = new Map<string, PropertyField[]>();
    for (const f of fields) {
      const arr = map.get(f.section) ?? [];
      arr.push(f);
      map.set(f.section, arr);
    }
    // Keep SECTIONS ordering, then any extra sections
    const ordered: { section: string; label: string; fields: PropertyField[] }[] = [];
    for (const sec of SECTIONS) {
      if (map.has(sec.key)) {
        ordered.push({
          section: sec.key,
          label: sec.label,
          fields: map.get(sec.key)!,
        });
        map.delete(sec.key);
      }
    }
    // Remaining sections not in SECTIONS constant
    for (const [key, flds] of map) {
      ordered.push({
        section: key,
        label: key
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        fields: flds,
      });
    }
    return ordered;
  }, [fields]);

  const fieldLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const field of fields) {
      map.set(field.field_key, field.label);
    }
    return map;
  }, [fields]);

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buildChangedFields = useCallback(
    (
      before: { house_id: string; data: Record<string, unknown> },
      after: { house_id: string; data: Record<string, unknown> }
    ): PropertyChangeField[] => {
      const changedFields: PropertyChangeField[] = [];

      if (before.house_id !== after.house_id) {
        changedFields.push({
          field_key: "house_id",
          label: "รหัสบ้าน",
          old_value: before.house_id || null,
          new_value: after.house_id || null,
        });
      }

      const allKeys = new Set([
        ...Object.keys(before.data),
        ...Object.keys(after.data),
      ]);

      for (const key of allKeys) {
        const oldValue = before.data[key];
        const newValue = after.data[key];

        if (areValuesEqual(oldValue, newValue)) continue;

        changedFields.push({
          field_key: key,
          label: fieldLabelMap.get(key) ?? key,
          old_value: oldValue ?? null,
          new_value: newValue ?? null,
        });
      }

      return changedFields;
    },
    [fieldLabelMap]
  );

  const recordChangeLog = useCallback(
    async (payload: {
      propertyId: number;
      houseId: string;
      action: "create" | "update";
      changedFields: PropertyChangeField[];
    }) => {
      if (payload.action === "update" && payload.changedFields.length === 0) {
        return;
      }

      try {
        await fetch("/api/admin/property-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Failed to record property change log", error);
      }
    },
    []
  );

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Auto-save callback
  const handleAutoSave = useCallback(
    async (formData: Record<string, unknown>) => {
      if (!propertyId) return;

      const beforeSnapshot =
        lastPersistedRef.current ??
        ({ house_id: houseId.trim() || property?.house_id || "", data: {} } as const);
      const afterSnapshot = {
        house_id: beforeSnapshot.house_id,
        data: formData,
      };

      await updateProperty(propertyId, { data: formData });

      await recordChangeLog({
        propertyId,
        houseId: afterSnapshot.house_id,
        action: "update",
        changedFields: buildChangedFields(beforeSnapshot, afterSnapshot),
      });

      lastPersistedRef.current = afterSnapshot;
    },
    [buildChangedFields, houseId, property?.house_id, propertyId, recordChangeLog]
  );

  const { saving: autoSaving, lastSaved } = useAutoSave(
    data,
    handleAutoSave,
    3000,
    autoSaveEnabled && !isNew && !!propertyId
  );

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const missing = fields.filter(
      (f) =>
        f.required &&
        (data[f.field_key] === undefined ||
          data[f.field_key] === null ||
          data[f.field_key] === "")
    );
    if (missing.length > 0) {
      toast.error(
        `กรุณากรอกข้อมูลที่จำเป็น: ${missing.map((f) => f.label).join(", ")}`
      );
      return;
    }

    if (!houseId.trim()) {
      toast.error("กรุณากรอกรหัสบ้าน");
      return;
    }

    setSubmitting(true);
    try {
      if (isNew) {
        const created = await createProperty({
          house_id: houseId.trim(),
          data,
        });

        const createdSnapshot = {
          house_id: created.house_id,
          data: created.data ?? {},
        };

        await recordChangeLog({
          propertyId: created.id,
          houseId: created.house_id,
          action: "create",
          changedFields: buildChangedFields(
            { house_id: "", data: {} },
            createdSnapshot
          ),
        });

        lastPersistedRef.current = createdSnapshot;
        toast.success("สร้างที่พักเรียบร้อย!");
        router.push("/admin");
      } else if (propertyId) {
        const beforeSnapshot =
          lastPersistedRef.current ??
          ({ house_id: property?.house_id || "", data: property?.data ?? {} } as const);
        const afterSnapshot = {
          house_id: houseId.trim(),
          data,
        };

        await updateProperty(propertyId, {
          house_id: houseId.trim(),
          data,
        });

        await recordChangeLog({
          propertyId,
          houseId: afterSnapshot.house_id,
          action: "update",
          changedFields: buildChangedFields(beforeSnapshot, afterSnapshot),
        });

        lastPersistedRef.current = afterSnapshot;
        toast.success("บันทึกเรียบร้อย!");
        router.push("/admin");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ไม่สามารถบันทึกได้"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = fieldsLoading || loadingProp;

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "เพิ่มที่พักใหม่" : `แก้ไข ${houseId || "ที่พัก"}`}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isNew
                ? "กรอกรายละเอียดที่พักเพื่อสร้างรายการใหม่"
                : "แก้ไขรายละเอียดที่พัก"}
            </p>
          </div>
          {/* Auto-save indicator */}
          {!isNew && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              {autoSaving && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  กำลังบันทึก…
                </span>
              )}
              {lastSaved && !autoSaving && (
                <span>บันทึกล่าสุด {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Completeness */}
            <Card>
              <CardContent className="pt-6">
                <CompletenessScore fields={fields} data={data} />
              </CardContent>
            </Card>

            {/* House ID */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ข้อมูลระบุตัวตน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="house_id">
                    รหัสบ้าน
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="house_id"
                    value={houseId}
                    onChange={(e) => setHouseId(e.target.value)}
                    placeholder="เช่น PT60"
                    className="max-w-xs font-mono"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dynamic sections */}
            {sectionGroups.map(({ section, label, fields: sectionFields }) => (
              <Card key={section}>
                <Collapsible
                  open={openSections.has(section)}
                  onOpenChange={() => toggleSection(section)}
                >
                  <CollapsibleTrigger
                    render={
                      <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg" />
                    }
                  >
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {sectionIcons[section] ?? (
                            <Info className="h-4 w-4" />
                          )}
                          {label}
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {sectionFields.length}
                          </Badge>
                        </span>
                        {openSections.has(section) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CardTitle>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Separator />
                    <CardContent className="pt-6 space-y-6">
                      {/* capacity: BedroomEditor + BathroomEditor */}
                      {section === "capacity" && (
                        <>
                          <BedroomEditor
                            value={(data.bedroom_details as BedroomRoom[]) ?? []}
                            onChange={(rooms) => handleFieldChange("bedroom_details", rooms)}
                          />
                          <BathroomEditor
                            value={(data.bathroom_details as BathroomDetail[]) ?? []}
                            onChange={(baths) => handleFieldChange("bathroom_details", baths)}
                          />
                        </>
                      )}

                      {/* Regular dynamic fields (conditional hiding) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sectionFields
                          .filter((f) => {
                            if (f.field_key === "ev_charger_details" && !data.ev_charger_available) return false;
                            if (f.field_key === "extra_bed_details" && !data.extra_bed_available) return false;
                            return true;
                          })
                          .map((field) => (
                            <div
                              key={field.id}
                              className={
                                field.type === "textarea" ? "md:col-span-2" : undefined
                              }
                            >
                              <DynamicField
                                field={field}
                                value={data[field.field_key]}
                                onChange={handleFieldChange}
                              />
                            </div>
                          ))}
                      </div>

                      {/* location: NearbyPlacesEditor */}
                      {section === "location" && (
                        <NearbyPlacesEditor
                          value={(data.nearby_places as NearbyPlace[]) ?? []}
                          onChange={(places) => handleFieldChange("nearby_places", places)}
                        />
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/admin">
                <Button type="button" variant="outline">
                  ยกเลิก
                </Button>
              </Link>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isNew ? "สร้างที่พัก" : "บันทึก"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  );
}
