import { describe, expect, it } from "vitest";
import { CATEGORIES, MENU, RESTAURANT, STAFF, TABLES } from "./seed-data.mjs";

describe("seed data", () => {
  it("uses a valid restaurant slug", () => {
    expect(RESTAURANT.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("has one manager, one waiter and one kitchen account with unique emails", () => {
    expect(STAFF.map((s) => s.role).sort()).toEqual([
      "kitchen",
      "manager",
      "waiter",
    ]);
    expect(new Set(STAFF.map((s) => s.email)).size).toBe(STAFF.length);
  });

  it("has unique table labels with sensible seat counts", () => {
    expect(new Set(TABLES.map((t) => t.label)).size).toBe(TABLES.length);
    for (const t of TABLES) expect(t.seats).toBeGreaterThanOrEqual(1);
  });

  it("gives every menu item a known category, a unique name and a positive price", () => {
    expect(new Set(MENU.map((m) => m.name)).size).toBe(MENU.length);
    for (const item of MENU) {
      expect(CATEGORIES).toContain(item.category);
      expect(Number.isInteger(item.price_cents)).toBe(true);
      expect(item.price_cents).toBeGreaterThan(0);
    }
  });

  it("fills every category and keeps at least one item sold out to show availability", () => {
    for (const category of CATEGORIES) {
      expect(MENU.some((m) => m.category === category)).toBe(true);
    }
    expect(MENU.some((m) => m.available === false)).toBe(true);
  });
});
