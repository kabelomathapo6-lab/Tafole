import { describe, expect, it } from "vitest";
import {
  addToCart,
  cartCount,
  cartTotal,
  reconcileCart,
  setLineNote,
  setLineQuantity,
  toOrderItems,
  type CartLine,
} from "./cart";
import type { MenuItem } from "./menu";

const chips = { id: "chips", name: "Chips", price_cents: 3900 };
const burger = { id: "burger", name: "Beef burger", price_cents: 12900 };

const menuItem = (over: Partial<MenuItem>): MenuItem => ({
  id: "chips",
  category_id: null,
  name: "Chips",
  description: null,
  price_cents: 3900,
  available: true,
  sort_order: 0,
  ...over,
});

describe("cart", () => {
  it("adds a new line, then increases its quantity", () => {
    const once = addToCart([], chips);
    expect(once).toEqual([
      {
        itemId: "chips",
        name: "Chips",
        price_cents: 3900,
        quantity: 1,
        note: "",
      },
    ]);
    expect(addToCart(once, chips)[0].quantity).toBe(2);
  });

  it("removes a line when the quantity reaches zero and caps at 20", () => {
    const lines = addToCart([], chips);
    expect(setLineQuantity(lines, "chips", 0)).toEqual([]);
    expect(setLineQuantity(lines, "chips", 99)[0].quantity).toBe(20);
  });

  it("totals count and price in cents", () => {
    let lines = addToCart([], chips);
    lines = addToCart(addToCart(lines, burger), burger);
    expect(cartCount(lines)).toBe(3);
    expect(cartTotal(lines)).toBe(3900 + 2 * 12900);
  });

  it("limits and trims notes when building the order", () => {
    let lines = addToCart([], chips);
    lines = setLineNote(lines, "chips", "  extra salt  ");
    expect(toOrderItems(lines)).toEqual([
      { menu_item_id: "chips", quantity: 1, note: "extra salt" },
    ]);
    expect(setLineNote(lines, "chips", "x".repeat(500))[0].note).toHaveLength(
      200,
    );
    expect(toOrderItems(addToCart([], chips))[0].note).toBeNull();
  });

  it("never sends prices to the server", () => {
    expect(Object.keys(toOrderItems(addToCart([], chips))[0])).toEqual([
      "menu_item_id",
      "quantity",
      "note",
    ]);
  });

  it("drops unavailable or removed items and refreshes prices on reconcile", () => {
    const lines: CartLine[] = [
      {
        itemId: "chips",
        name: "Old name",
        price_cents: 100,
        quantity: 2,
        note: "",
      },
      { itemId: "gone", name: "Gone", price_cents: 500, quantity: 1, note: "" },
      {
        itemId: "soldout",
        name: "Soldout",
        price_cents: 500,
        quantity: 1,
        note: "",
      },
    ];
    const result = reconcileCart(lines, [
      menuItem({ id: "chips", price_cents: 4200 }),
      menuItem({ id: "soldout", available: false }),
    ]);
    expect(result).toEqual([
      {
        itemId: "chips",
        name: "Chips",
        price_cents: 4200,
        quantity: 2,
        note: "",
      },
    ]);
  });
});
