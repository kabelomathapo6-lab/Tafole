import type { SupabaseClient } from "@supabase/supabase-js";
import type { MenuCategory, MenuItem } from "./menu";
import type { OrderStatus } from "./order-status";

export class InvalidTableError extends Error {
  constructor() {
    super("This QR code is not valid.");
  }
}

export type GuestSession = {
  id: string;
  restaurantId: string;
  tableId: string;
};

export type GuestOrderItem = {
  id: string;
  name_snapshot: string;
  price_cents_snapshot: number;
  quantity: number;
  note: string | null;
};

export type GuestOrder = {
  id: string;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  order_items: GuestOrderItem[];
};

export type OrderLine = {
  menu_item_id: string;
  quantity: number;
  note: string | null;
};

/** Opens (or re-opens) the guest's session for the table behind a scanned QR code. */
export async function startSession(
  supabase: SupabaseClient,
  token: string,
): Promise<GuestSession> {
  const { data, error } = await supabase.rpc("start_table_session", {
    p_qr_token: token,
  });
  if (error) {
    if (error.code === "P0002" || error.code === "22P02")
      throw new InvalidTableError();
    throw new Error(`Could not start your table session: ${error.message}`);
  }
  return {
    id: data.id,
    restaurantId: data.restaurant_id,
    tableId: data.table_id,
  };
}

export async function loadGuestMenu(
  supabase: SupabaseClient,
  session: GuestSession,
) {
  const [restaurant, table, categories, items] = await Promise.all([
    supabase
      .from("restaurants")
      .select("name")
      .eq("id", session.restaurantId)
      .single(),
    supabase.from("tables").select("label").eq("id", session.tableId).single(),
    supabase
      .from("menu_categories")
      .select("id,name,sort_order")
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select(
        "id,category_id,name,description,price_cents,available,sort_order",
      )
      .order("sort_order"),
  ]);

  for (const result of [restaurant, table, categories, items]) {
    if (result.error)
      throw new Error(`Could not load the menu: ${result.error.message}`);
  }

  return {
    restaurantName: restaurant.data?.name as string,
    tableLabel: table.data?.label as string,
    categories: (categories.data ?? []) as MenuCategory[],
    items: (items.data ?? []) as MenuItem[],
  };
}

export async function placeOrder(
  supabase: SupabaseClient,
  sessionId: string,
  lines: OrderLine[],
  notes: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc("place_order", {
    p_session_id: sessionId,
    p_items: lines,
    p_notes: notes,
  });
  if (error) {
    if (error.message.includes("not available")) {
      throw new Error(
        "One of the items just sold out. Please check your order and try again.",
      );
    }
    throw new Error(`Could not send your order: ${error.message}`);
  }
  return data as string;
}

export async function loadOrders(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<GuestOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,status,notes,created_at,order_items(id,name_snapshot,price_cents_snapshot,quantity,note)",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your orders: ${error.message}`);
  return (data ?? []) as unknown as GuestOrder[];
}

/** Calls onChange whenever one of this guest's orders (or its items) changes. Returns an unsubscribe function. */
export function subscribeToOrders(
  supabase: SupabaseClient,
  sessionId: string,
  onChange: () => void,
) {
  const channel = supabase
    .channel(`guest-orders-${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `session_id=eq.${sessionId}`,
      },
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
