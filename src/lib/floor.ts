import type { OrderStatus } from "./order-status";

export type StaffOrderItem = {
  id: string;
  name_snapshot: string;
  price_cents_snapshot: number;
  quantity: number;
  note: string | null;
};

export type StaffOrder = {
  id: string;
  table_id: string;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  ready_at: string | null;
  order_items: StaffOrderItem[];
};

export type FloorTable = {
  id: string;
  label: string;
  area: string | null;
  seats: number;
};

export type TableState = "empty" | "ordered" | "waiting" | "ready";

/**
 * What a waiter should see on a table tile. New orders (needing confirmation) come first, then
 * food ready to serve, then orders in the kitchen.
 */
export function tableState(orders: StaffOrder[]): TableState {
  if (orders.some((o) => o.status === "placed")) return "ordered";
  if (orders.some((o) => o.status === "ready")) return "ready";
  if (orders.some((o) => o.status === "confirmed" || o.status === "preparing"))
    return "waiting";
  return "empty";
}

export function ordersByTable(orders: StaffOrder[]): Map<string, StaffOrder[]> {
  const map = new Map<string, StaffOrder[]>();
  for (const order of [...orders].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  )) {
    map.set(order.table_id, [...(map.get(order.table_id) ?? []), order]);
  }
  return map;
}

/** Whole minutes between an ISO timestamp and now (never negative). */
export function minutesSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

export type TicketTone = "normal" | "warn" | "late";

/** Kitchen ticket colour: under 8 minutes normal, 8 to 15 amber, over 15 late. */
export function ticketTone(minutes: number): TicketTone {
  if (minutes > 15) return "late";
  if (minutes >= 8) return "warn";
  return "normal";
}

export function orderTotal(order: StaffOrder): number {
  return order.order_items.reduce(
    (sum, item) => sum + item.quantity * item.price_cents_snapshot,
    0,
  );
}
