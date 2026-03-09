import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompletenessScore } from "@/components/completeness-score";
import type { PropertyField } from "@/lib/types";

function makeField(
  key: string,
  overrides: Partial<PropertyField> = {}
): PropertyField {
  return {
    id: 1,
    field_key: key,
    label: key,
    type: "text",
    section: "basic_info",
    required: false,
    options: null,
    order_index: 1,
    is_active: true,
    ...overrides,
  };
}

describe("CompletenessScore Component", () => {
  it("returns null when no active fields", () => {
    const fields = [makeField("a", { is_active: false })];
    const { container } = render(
      <CompletenessScore fields={fields} data={{}} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows 0% when no fields are filled", () => {
    const fields = [makeField("a"), makeField("b", { id: 2, field_key: "b" })];
    render(<CompletenessScore fields={fields} data={{}} />);

    expect(screen.getByText("0% สมบูรณ์")).toBeInTheDocument();
    expect(screen.getByText("กรอกแล้ว 0/2 รายการ")).toBeInTheDocument();
  });

  it("shows 50% when half fields are filled", () => {
    const fields = [
      makeField("a"),
      makeField("b", { id: 2, field_key: "b" }),
    ];
    const data = { a: "filled" };
    render(<CompletenessScore fields={fields} data={data} />);

    expect(screen.getByText("50% สมบูรณ์")).toBeInTheDocument();
    expect(screen.getByText("กรอกแล้ว 1/2 รายการ")).toBeInTheDocument();
  });

  it("shows 100% when all fields are filled", () => {
    const fields = [
      makeField("a"),
      makeField("b", { id: 2, field_key: "b" }),
    ];
    const data = { a: "val1", b: "val2" };
    render(<CompletenessScore fields={fields} data={data} />);

    expect(screen.getByText("100% สมบูรณ์")).toBeInTheDocument();
    expect(screen.getByText("กรอกแล้ว 2/2 รายการ")).toBeInTheDocument();
  });

  it("treats empty string as not filled", () => {
    const fields = [makeField("a")];
    render(<CompletenessScore fields={fields} data={{ a: "" }} />);

    expect(screen.getByText("0% สมบูรณ์")).toBeInTheDocument();
  });

  it("treats null as not filled", () => {
    const fields = [makeField("a")];
    render(<CompletenessScore fields={fields} data={{ a: null }} />);

    expect(screen.getByText("0% สมบูรณ์")).toBeInTheDocument();
  });

  it("treats empty array as not filled", () => {
    const fields = [makeField("a", { type: "multiselect" })];
    render(<CompletenessScore fields={fields} data={{ a: [] }} />);

    expect(screen.getByText("0% สมบูรณ์")).toBeInTheDocument();
  });

  it("treats non-empty array as filled", () => {
    const fields = [makeField("a", { type: "multiselect" })];
    render(<CompletenessScore fields={fields} data={{ a: ["TV"] }} />);

    expect(screen.getByText("100% สมบูรณ์")).toBeInTheDocument();
  });

  it("treats boolean false as filled", () => {
    const fields = [makeField("a", { type: "boolean" })];
    render(<CompletenessScore fields={fields} data={{ a: false }} />);

    // false is a valid value, so should count as filled
    expect(screen.getByText("100% สมบูรณ์")).toBeInTheDocument();
  });

  it("treats number 0 as filled", () => {
    const fields = [makeField("a", { type: "number" })];
    render(<CompletenessScore fields={fields} data={{ a: 0 }} />);

    expect(screen.getByText("100% สมบูรณ์")).toBeInTheDocument();
  });

  it("ignores inactive fields", () => {
    const fields = [
      makeField("a"),
      makeField("b", { id: 2, field_key: "b", is_active: false }),
    ];
    const data = { a: "filled" };
    render(<CompletenessScore fields={fields} data={data} />);

    // only 1 active field, and it's filled = 100%
    expect(screen.getByText("100% สมบูรณ์")).toBeInTheDocument();
    expect(screen.getByText("กรอกแล้ว 1/1 รายการ")).toBeInTheDocument();
  });

  it("rounds percentage correctly", () => {
    const fields = [
      makeField("a"),
      makeField("b", { id: 2, field_key: "b" }),
      makeField("c", { id: 3, field_key: "c" }),
    ];
    const data = { a: "filled" };
    render(<CompletenessScore fields={fields} data={data} />);

    // 1/3 = 33.33... → Math.round → 33%
    expect(screen.getByText("33% สมบูรณ์")).toBeInTheDocument();
  });

  it("applies green color for >= 80%", () => {
    const fields = [makeField("a")];
    render(<CompletenessScore fields={fields} data={{ a: "filled" }} />);

    const badge = screen.getByText("100% สมบูรณ์");
    expect(badge.className).toContain("text-green-600");
  });

  it("applies yellow color for >= 50% and < 80%", () => {
    const fields = [
      makeField("a"),
      makeField("b", { id: 2, field_key: "b" }),
      makeField("c", { id: 3, field_key: "c" }),
    ];
    // 2/3 ≈ 67%
    render(
      <CompletenessScore fields={fields} data={{ a: "x", b: "y" }} />
    );

    const badge = screen.getByText("67% สมบูรณ์");
    expect(badge.className).toContain("text-yellow-600");
  });

  it("applies red color for < 50%", () => {
    const fields = [
      makeField("a"),
      makeField("b", { id: 2, field_key: "b" }),
      makeField("c", { id: 3, field_key: "c" }),
    ];
    // 1/3 ≈ 33%
    render(
      <CompletenessScore fields={fields} data={{ a: "x" }} />
    );

    const badge = screen.getByText("33% สมบูรณ์");
    expect(badge.className).toContain("text-red-600");
  });
});
