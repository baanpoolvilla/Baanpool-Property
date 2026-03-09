import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DynamicField } from "@/components/dynamic-field";
import type { PropertyField } from "@/lib/types";

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeField(overrides: Partial<PropertyField> = {}): PropertyField {
  return {
    id: 1,
    field_key: "test_field",
    label: "Test Field",
    type: "text",
    section: "basic_info",
    required: false,
    options: null,
    order_index: 1,
    is_active: true,
    ...overrides,
  };
}

describe("DynamicField Component", () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
  });

  // ─── Text ──────────────────────────────────────────────────────────────

  describe("type=text", () => {
    it("renders a text input with label", () => {
      const field = makeField({ label: "House Name", type: "text" });
      render(<DynamicField field={field} value="" onChange={onChange} />);

      expect(screen.getByLabelText("House Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("กรุณากรอกHouse Name")).toBeInTheDocument();
    });

    it("displays the value", () => {
      const field = makeField({ type: "text" });
      render(<DynamicField field={field} value="Hello" onChange={onChange} />);

      expect(screen.getByDisplayValue("Hello")).toBeInTheDocument();
    });

    it("calls onChange on input", () => {
      const field = makeField({ field_key: "name", type: "text" });
      render(<DynamicField field={field} value="" onChange={onChange} />);

      fireEvent.change(screen.getByRole("textbox"), { target: { value: "New" } });
      expect(onChange).toHaveBeenCalledWith("name", "New");
    });

    it("handles null value as empty string", () => {
      const field = makeField({ type: "text" });
      render(<DynamicField field={field} value={null} onChange={onChange} />);

      expect(screen.getByDisplayValue("")).toBeInTheDocument();
    });

    it("shows required indicator when required", () => {
      const field = makeField({ type: "text", required: true });
      render(<DynamicField field={field} value="" onChange={onChange} />);

      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("does not show required indicator when not required", () => {
      const field = makeField({ type: "text", required: false });
      render(<DynamicField field={field} value="" onChange={onChange} />);

      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });
  });

  // ─── Number ────────────────────────────────────────────────────────────

  describe("type=number", () => {
    it("renders a number input", () => {
      const field = makeField({ label: "Max Guests", type: "number" });
      render(<DynamicField field={field} value={10} onChange={onChange} />);

      const input = screen.getByDisplayValue("10");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "number");
    });

    it("calls onChange with Number type", () => {
      const field = makeField({ field_key: "guests", type: "number" });
      render(<DynamicField field={field} value={5} onChange={onChange} />);

      fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });
      expect(onChange).toHaveBeenCalledWith("guests", 12);
    });

    it("calls onChange with null for empty value", () => {
      const field = makeField({ field_key: "price", type: "number" });
      render(<DynamicField field={field} value={100} onChange={onChange} />);

      fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
      expect(onChange).toHaveBeenCalledWith("price", null);
    });

    it("handles null value as empty string display", () => {
      const field = makeField({ type: "number" });
      render(<DynamicField field={field} value={null} onChange={onChange} />);

      expect(screen.getByDisplayValue("")).toBeInTheDocument();
    });

    it("handles undefined value as empty string display", () => {
      const field = makeField({ type: "number" });
      render(<DynamicField field={field} value={undefined} onChange={onChange} />);

      expect(screen.getByDisplayValue("")).toBeInTheDocument();
    });
  });

  // ─── Boolean ───────────────────────────────────────────────────────────

  describe("type=boolean", () => {
    it("renders label", () => {
      const field = makeField({ label: "Private Pool", type: "boolean" });
      render(<DynamicField field={field} value={false} onChange={onChange} />);

      expect(screen.getByText("Private Pool")).toBeInTheDocument();
    });

    it("renders a switch element", () => {
      const field = makeField({ type: "boolean" });
      render(<DynamicField field={field} value={true} onChange={onChange} />);

      expect(screen.getByRole("switch")).toBeInTheDocument();
    });
  });

  // ─── Textarea ──────────────────────────────────────────────────────────

  describe("type=textarea", () => {
    it("renders a textarea", () => {
      const field = makeField({ label: "Description", type: "textarea" });
      render(<DynamicField field={field} value="Some text" onChange={onChange} />);

      expect(screen.getByDisplayValue("Some text")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("calls onChange on textarea input", () => {
      const field = makeField({ field_key: "desc", type: "textarea" });
      render(<DynamicField field={field} value="" onChange={onChange} />);

      fireEvent.change(screen.getByRole("textbox"), { target: { value: "Updated" } });
      expect(onChange).toHaveBeenCalledWith("desc", "Updated");
    });
  });

  // ─── Select ────────────────────────────────────────────────────────────

  describe("type=select", () => {
    it("renders the label", () => {
      const field = makeField({
        label: "Currency",
        type: "select",
        options: ["THB", "USD", "EUR"],
      });
      render(<DynamicField field={field} value="" onChange={onChange} />);

      expect(screen.getByText("Currency")).toBeInTheDocument();
    });
  });

  // ─── Multiselect ──────────────────────────────────────────────────────

  describe("type=multiselect", () => {
    it("renders options as checkboxes", () => {
      const field = makeField({
        label: "Amenities",
        type: "multiselect",
        options: ["TV", "WiFi", "Pool"],
      });
      render(<DynamicField field={field} value={[]} onChange={onChange} />);

      expect(screen.getByText("TV")).toBeInTheDocument();
      expect(screen.getByText("WiFi")).toBeInTheDocument();
      expect(screen.getByText("Pool")).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    });

    it("shows checked state for selected items", () => {
      const field = makeField({
        type: "multiselect",
        options: ["TV", "WiFi"],
      });
      render(<DynamicField field={field} value={["TV"]} onChange={onChange} />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it("handles non-array value gracefully", () => {
      const field = makeField({
        type: "multiselect",
        options: ["A", "B"],
      });
      // value is null instead of array
      render(<DynamicField field={field} value={null} onChange={onChange} />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  // ─── Unknown type ─────────────────────────────────────────────────────

  describe("unknown type", () => {
    it("returns null for unsupported type", () => {
      const field = makeField({ type: "unknown" as any });
      const { container } = render(
        <DynamicField field={field} value="" onChange={onChange} />
      );

      expect(container.innerHTML).toBe("");
    });
  });
});
