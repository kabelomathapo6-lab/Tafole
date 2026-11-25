import type { SupabaseClient } from "@supabase/supabase-js";
import type { RestaurantTable } from "./tables";

export type TableValues = { label: string; area: string | null; seats: number };

const COLUMNS = "id,label,area,seats,qr_token";

type Failure = { message: string; code?: string } | null;

function fail(what: string, error: Failure): never {
  if (error?.code === "23505")
    throw new Error("A table with that name already exists.");
  throw new Error(`Could not ${what}${error ? `: ${error.message}` : ""}`);
}

/** The manager's restaurant and its tables. Row Level Security limits both to their restaurant. */
export async function loadTables(supabase: SupabaseClient) {
  const restaurant = await supabase
    .from("restaurants")
    .select("id,name")
    .single();
  if (restaurant.error || !restaurant.data)
    fail("load your restaurant", restaurant.error);

  const tables = await supabase.from("tables").select(COLUMNS).order("label");
  if (tables.error || !tables.data) fail("load tables", tables.error);

  return {
    restaurantId: restaurant.data.id as string,
    restaurantName: restaurant.data.name as string,
    tables: tables.data as RestaurantTable[],
  };
}

export async function createTable(
  supabase: SupabaseClient,
  restaurantId: string,
  values: TableValues,
) {
  const { data, error } = await supabase
    .from("tables")
    .insert({ ...values, restaurant_id: restaurantId })
    .select(COLUMNS)
    .single();
  if (error || !data) fail("save the table", error);
  return data as RestaurantTable;
}

export async function updateTable(
  supabase: SupabaseClient,
  id: string,
  values: TableValues,
) {
  const { data, error } = await supabase
    .from("tables")
    .update(values)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error || !data) fail("save the table", error);
  return data as RestaurantTable;
}

/** Issues a new QR token. The old printed code stops working straight away. */
export async function resetQrToken(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("tables")
    .update({ qr_token: crypto.randomUUID() })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error || !data) fail("reset the QR code", error);
  return data as RestaurantTable;
}

export async function deleteTable(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("tables").delete().eq("id", id);
  if (error) fail("delete the table", error);
}
