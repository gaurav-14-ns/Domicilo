import { describe, it, expect } from "vitest";
import { cn, uuid } from "../lib/utils";
import { monthKey, todayISO, monthsBetween, toCSV } from "../lib/format";

describe("utils", () => {
  it("cn merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("foo", false && "bar")).toBe("foo");
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("uuid generates a valid UUID v4", () => {
    const id = uuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("uuid generates unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uuid()));
    expect(ids.size).toBe(100);
  });
});

describe("format", () => {
  it("monthKey returns YYYY-MM format", () => {
    const d = new Date(2026, 4, 15);
    expect(monthKey(d)).toBe("2026-05");
  });

  it("monthKey handles string input", () => {
    expect(monthKey("2026-05-15")).toBe("2026-05");
  });

  it("todayISO returns YYYY-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("monthsBetween generates correct month range", () => {
    const result = monthsBetween("2026-01", "2026-03");
    expect(result).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("monthsBetween handles year boundary", () => {
    const result = monthsBetween("2025-11", "2026-02");
    expect(result).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("toCSV generates CSV with BOM", () => {
    const data = [{ name: "John", age: 30 }];
    const csv = toCSV(data, [
      { key: "name", header: "Name" },
      { key: "age", header: "Age" },
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Name,Age");
    expect(csv).toContain("John,30");
  });

  it("toCSV escapes commas and quotes", () => {
    const data = [{ name: 'John "Doe"', note: "Hello, world" }];
    const csv = toCSV(data, [
      { key: "name", header: "Name" },
      { key: "note", header: "Note" },
    ]);
    expect(csv).toContain('"John ""Doe"""');
    expect(csv).toContain('"Hello, world"');
  });
});
