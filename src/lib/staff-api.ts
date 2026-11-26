import type { SupabaseClient } from "@supabase/supabase-js";
import type { FloorTable, StaffOrder } from "./floor";
import type { OrderStatus } from "./order-status";

const ORDER_COLUMNS =
  "id,table_id,status,notes,created_at,confirmed_at,ready_at,order_items(id,name_snapshot,price_cents_snapshot,quantity,note)";

/** Tables and the orders in the given statuses. Row Level Security limits both to the staff member's restaurant. */
export async function loadFloor(
  supabase: SupabaseClient,
  statuses: OrderStatus[],
) {
  const [tables, orders] = await Promise.all([
    supabase.from("tables").select("id,label,area,seats").order("label"),
    supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .in("status", statuses)
      .order("created_at"),
  ]);
  if (tables.error)
    throw new Error(`Could not load tables: ${tables.error.message}`);
  if (orders.error)
    throw new Error(`Could not load orders: ${orders.error.message}`);
  return {
    tables: (tables.data ?? []) as FloorTable[],
    orders: (orders.data ?? []) as unknown as StaffOrder[],
  };
}

const CONFLICT =
  "That order was just changed by someone else. The list has been refreshed.";

export async function setOrderStatus(
  supabase: SupabaseClient,
  id: string,
  status: OrderStatus,
) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.code === "23514") throw new Error(CONFLICT);
    throw new Error(`Could not update the order: ${error.message}`);
  }
  // Row Level Security hides rows the staff member may no longer change, so no row back means a conflict.
  if (!data) throw new Error(CONFLICT);
}

export async function setItemQuantity(
  supabase: SupabaseClient,
  itemId: string,
  quantity: number,
) {
  const { data, error } = await supabase
    .from("order_items")
    .update({ quantity })
    .eq("id", itemId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Could not change the quantity: ${error.message}`);
  if (!data)
    throw new Error(
      "This order has already been confirmed, so its items can no longer be changed.",
    );
}

export async function removeItem(supabase: SupabaseClient, itemId: string) {
  const { data, error } = await supabase
    .from("order_items")
    .delete()
    .eq("id", itemId)
    .select("id");
  if (error) throw new Error(`Could not remove the item: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(
      "This order has already been confirmed, so its items can no longer be changed.",
    );
  }
}

/** Calls onChange whenever an order or order item in the staff member's restaurant changes. */
export function subscribeToFloor(
  supabase: SupabaseClient,
  onChange: () => void,
) {
  const channel = supabase
    .channel(`floor-${crypto.randomUUID()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "order_items" },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
