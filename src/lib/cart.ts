import type { MenuItem } from "./menu";

export type CartLine = {
  itemId: string;
  name: string;
  price_cents: number;
  quantity: number;
  note: string;
};

export const MAX_QUANTITY = 20;

type Orderable = Pick<MenuItem, "id" | "name" | "price_cents">;

export function addToCart(lines: CartLine[], item: Orderable): CartLine[] {
  const existing = lines.find((line) => line.itemId === item.id);
  if (!existing) {
    return [
      ...lines,
      {
        itemId: item.id,
        name: item.name,
        price_cents: item.price_cents,
        quantity: 1,
        note: "",
      },
    ];
  }
  return setLineQuantity(lines, item.id, existing.quantity + 1);
}

/** A quantity of zero or less removes the line; it never goes above the per-item limit. */
export function setLineQuantity(
  lines: CartLine[],
  itemId: string,
  quantity: number,
): CartLine[] {
  if (quantity <= 0) return lines.filter((line) => line.itemId !== itemId);
  const capped = Math.min(quantity, MAX_QUANTITY);
  return lines.map((line) =>
    line.itemId === itemId ? { ...line, quantity: capped } : line,
  );
}

export function setLineNote(
  lines: CartLine[],
  itemId: string,
  note: string,
): CartLine[] {
  return lines.map((line) =>
    line.itemId === itemId ? { ...line, note: note.slice(0, 200) } : line,
  );
}

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + line.quantity, 0);

export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + line.quantity * line.price_cents, 0);

/** Shape the database function expects. Prices are not sent: the server looks them up. */
export function toOrderItems(lines: CartLine[]) {
  return lines.map((line) => ({
    menu_item_id: line.itemId,
    quantity: line.quantity,
    note: line.note.trim() || null,
  }));
}

/**
 * The menu can change while a guest is browsing (an item sells out, a price changes).
 * Drop lines that are no longer available and refresh names and prices from the latest menu.
 */
export function reconcileCart(
  lines: CartLine[],
  items: MenuItem[],
): CartLine[] {
  return lines.flatMap((line) => {
    const current = items.find((item) => item.id === line.itemId);
    if (!current || !current.available) return [];
    return [{ ...line, name: current.name, price_cents: current.price_cents }];
  });
}
