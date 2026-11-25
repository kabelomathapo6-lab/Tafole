import type { SupabaseClient } from "@supabase/supabase-js";
import type { MenuCategory, MenuItem } from "./menu";

export type ItemValues = {
  name: string;
  description: string | null;
  price_cents: number;
  category_id: string | null;
  available: boolean;
};

const ITEM_COLUMNS =
  "id,category_id,name,description,price_cents,available,sort_order";

function ok<T>(
  result: { data: T | null; error: { message: string } | null },
  what: string,
): T {
  if (result.error || result.data === null) {
    throw new Error(
      `Could not ${what}${result.error ? `: ${result.error.message}` : ""}`,
    );
  }
  return result.data;
}

/** Everything the manager menu screen needs. Row Level Security limits it to their restaurant. */
export async function loadMenu(supabase: SupabaseClient) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You are signed out. Sign in again.");

  const profile = ok<{ restaurant_id: string }>(
    await supabase
      .from("staff_profiles")
      .select("restaurant_id")
      .eq("user_id", auth.user.id)
      .single(),
    "load your restaurant",
  );
  const categories = ok(
    await supabase
      .from("menu_categories")
      .select("id,name,sort_order")
      .order("sort_order"),
    "load categories",
  ) as MenuCategory[];
  const items = ok(
    await supabase.from("menu_items").select(ITEM_COLUMNS).order("sort_order"),
    "load menu items",
  ) as MenuItem[];

  return { restaurantId: profile.restaurant_id, categories, items };
}

export async function createItem(
  supabase: SupabaseClient,
  restaurantId: string,
  values: ItemValues,
  sortOrder: number,
): Promise<MenuItem> {
  return ok(
    await supabase
      .from("menu_items")
      .insert({ ...values, restaurant_id: restaurantId, sort_order: sortOrder })
      .select(ITEM_COLUMNS)
      .single(),
    "save the item",
  ) as MenuItem;
}

export async function updateItem(
  supabase: SupabaseClient,
  id: string,
  values: ItemValues,
): Promise<MenuItem> {
  return ok(
    await supabase
      .from("menu_items")
      .update(values)
      .eq("id", id)
      .select(ITEM_COLUMNS)
      .single(),
    "save the item",
  ) as MenuItem;
}

export async function setItemAvailable(
  supabase: SupabaseClient,
  id: string,
  available: boolean,
) {
  ok(
    await supabase
      .from("menu_items")
      .update({ available })
      .eq("id", id)
      .select("id")
      .single(),
    "update availability",
  );
}

export async function deleteItem(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw new Error(`Could not delete the item: ${error.message}`);
}

export async function createCategory(
  supabase: SupabaseClient,
  restaurantId: string,
  name: string,
  sortOrder: number,
): Promise<MenuCategory> {
  return ok(
    await supabase
      .from("menu_categories")
      .insert({ restaurant_id: restaurantId, name, sort_order: sortOrder })
      .select("id,name,sort_order")
      .single(),
    "add the category",
  ) as MenuCategory;
}
