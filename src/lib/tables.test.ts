import { describe, expect, it } from "vitest";
import { groupTables, qrUrl, type RestaurantTable } from "./tables";

const table = (
  label: string,
  area: string | null,
  seats = 2,
): RestaurantTable => ({
  id: label,
  label,
  area,
  seats,
  qr_token: `token-${label}`,
});

describe("groupTables", () => {
  it("groups by area and sorts table names naturally", () => {
    const sections = groupTables([
      table("Table 10", "Main dining"),
      table("Table 2", "Main dining"),
      table("Courtyard 1", "Courtyard"),
    ]);
    expect(sections.map((s) => s.name)).toEqual(["Courtyard", "Main dining"]);
    expect(sections[1].tables.map((t) => t.label)).toEqual([
      "Table 2",
      "Table 10",
    ]);
  });

  it("puts tables without an area in a final section", () => {
    const sections = groupTables([
      table("Bar 1", null),
      table("Table 1", "Main dining"),
    ]);
    expect(sections[sections.length - 1]).toMatchObject({
      area: null,
      name: "No area",
    });
  });

  it("returns no sections for no tables", () => {
    expect(groupTables([])).toEqual([]);
  });
});

describe("qrUrl", () => {
  it("builds the guest scan address from the site origin and the table token", () => {
    expect(qrUrl("https://tafole.example.com", "abc")).toBe(
      "https://tafole.example.com/t/abc",
    );
  });

  it("ignores a trailing slash on the origin", () => {
    expect(qrUrl("https://tafole.example.com/", "abc")).toBe(
      "https://tafole.example.com/t/abc",
    );
  });
});
