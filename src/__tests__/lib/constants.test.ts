import { describe, it, expect } from "vitest";
import { SECTIONS, FIELD_TYPES, POSTGREST_URL } from "@/lib/constants";

describe("Constants", () => {
  describe("POSTGREST_URL", () => {
    it("defaults to localhost:3001", () => {
      expect(POSTGREST_URL).toBe("http://localhost:3001");
    });
  });

  describe("SECTIONS", () => {
    it("has 6 sections", () => {
      expect(SECTIONS).toHaveLength(6);
    });

    it("has unique keys", () => {
      const keys = SECTIONS.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("is ordered by order field", () => {
      for (let i = 1; i < SECTIONS.length; i++) {
        expect(SECTIONS[i].order).toBeGreaterThan(SECTIONS[i - 1].order);
      }
    });

    it("contains expected sections", () => {
      const keys = SECTIONS.map((s) => s.key);
      expect(keys).toContain("basic_info");
      expect(keys).toContain("location");
      expect(keys).toContain("capacity");
      expect(keys).toContain("facilities");
      expect(keys).toContain("pricing");
      expect(keys).toContain("rules");
    });

    it("each section has required properties", () => {
      for (const s of SECTIONS) {
        expect(s).toHaveProperty("key");
        expect(s).toHaveProperty("label");
        expect(s).toHaveProperty("icon");
        expect(s).toHaveProperty("order");
        expect(typeof s.key).toBe("string");
        expect(typeof s.label).toBe("string");
        expect(typeof s.order).toBe("number");
      }
    });
  });

  describe("FIELD_TYPES", () => {
    it("has 6 field types", () => {
      expect(FIELD_TYPES).toHaveLength(6);
    });

    it("has unique values", () => {
      const values = FIELD_TYPES.map((t) => t.value);
      expect(new Set(values).size).toBe(values.length);
    });

    it("contains all supported types", () => {
      const values = FIELD_TYPES.map((t) => t.value);
      expect(values).toContain("text");
      expect(values).toContain("number");
      expect(values).toContain("boolean");
      expect(values).toContain("select");
      expect(values).toContain("textarea");
      expect(values).toContain("multiselect");
    });

    it("each type has value and label", () => {
      for (const t of FIELD_TYPES) {
        expect(t).toHaveProperty("value");
        expect(t).toHaveProperty("label");
        expect(typeof t.value).toBe("string");
        expect(typeof t.label).toBe("string");
        expect(t.label.length).toBeGreaterThan(0);
      }
    });
  });
});
