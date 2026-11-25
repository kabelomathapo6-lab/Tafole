import { describe, expect, it } from "vitest";
import { groupMenu, type MenuCategory, type MenuItem } from "./menu";

const item = (over: Partial<MenuItem>): MenuItem => ({
  id: "i",
  category_id: null,
  name: "Item",
  description: null,
  price_cents: 1000,
  available: true,
  sort_order: 0,
  ...over,
});

const categories: MenuCategory[] = [
  { id: "mains", name: "Mains", sort_order: 1 },
  { id: "starters", name: "Starters", sort_order: 0 },
];

describe("groupMenu", () => {
  it("orders categories and items by sort order", () => {
    const sections = groupMenu(categories, [
      item({ id: "b", name: "B", category_id: "mains", sort_order: 2 }),
      item({ id: "a", name: "A", category_id: "mains", sort_order: 1 }),
      item({ id: "s", name: "S", category_id: "starters" }),
    ]);
    expect(sections.map((s) => s.name)).toEqual(["Starters", "Mains"]);
    expect(sections[1].items.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("keeps empty categories so a manager can add items to them", () => {
    const sections = groupMenu(categories, []);
    expect(sections).toHaveLength(2);
    expect(sections[0].items).toEqual([]);
  });

  it("puts items without a known category in a final 'No category' section", () => {
    const sections = groupMenu(categories, [
      item({ id: "x", category_id: null }),
      item({ id: "y", category_id: "deleted-category" }),
    ]);
    const last = sections[sections.length - 1];
    expect(last.name).toBe("No category");
    expect(last.items.map((i) => i.id).sort()).toEqual(["x", "y"]);
  });
});
