// Seeds the Tafole Demo Kitchen: restaurant, staff accounts, tables and menu.
// Safe to run more than once. It never deletes anything.
//
//   Preview only (no network, no key needed):
//     npm run seed -- --dry-run
//   Real run (PowerShell):
//     $env:SUPABASE_SERVICE_ROLE_KEY = Read-Host "Secret key"
//     $env:SEED_PASSWORD = "<password for the three demo logins>"
//     npm run seed
//
// The secret key bypasses Row Level Security. Keep it in your terminal session only:
// never commit it and never put it in .env.local.

import { createClient } from "@supabase/supabase-js";
import { CATEGORIES, MENU, RESTAURANT, STAFF, TABLES } from "./seed-data.mjs";

class SeedError extends Error {}

function fail(message) {
  throw new SeedError(message);
}

function check(result, what) {
  if (result.error) fail(`Could not ${what}: ${result.error.message}`);
  return result.data;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password = process.env.SEED_PASSWORD;

  if (dryRun) {
    console.log("DRY RUN: nothing will be written.\n");
    console.log(`Restaurant: ${RESTAURANT.name} (${RESTAURANT.slug})`);
    console.log(
      `Staff accounts: ${STAFF.map((s) => `${s.email} (${s.role})`).join(", ")}`,
    );
    console.log(`Tables: ${TABLES.length}`);
    console.log(
      `Menu: ${MENU.length} items in ${CATEGORIES.length} categories`,
    );
    return;
  }

  if (!url)
    fail(
      "NEXT_PUBLIC_SUPABASE_URL is missing. Run with: npm run seed (it reads .env.local).",
    );
  if (!key)
    fail(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Set it in this terminal session only (see the top of this file).",
    );
  if (!password || password.length < 8)
    fail("SEED_PASSWORD is missing or shorter than 8 characters.");
  const looksLikeSecretKey =
    key.startsWith("sb_secret_") || key.startsWith("eyJ");
  if (!looksLikeSecretKey) {
    fail(
      "That does not look like a secret key. Use the Secret key (sb_secret_...) or the legacy service_role key, not the publishable key.",
    );
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  console.log(`Seeding ${url}\n`);

  // Restaurant
  const restaurant = check(
    await supabase
      .from("restaurants")
      .upsert(RESTAURANT, { onConflict: "slug" })
      .select()
      .single(),
    "create the restaurant",
  );
  console.log(`Restaurant: ${restaurant.name}`);

  // Staff accounts (created confirmed; passwords are reset to SEED_PASSWORD on every run)
  const listed = check(
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    "list users",
  );
  for (const member of STAFF) {
    const existing = listed.users.find((u) => u.email === member.email);
    let userId;
    if (existing) {
      check(
        await supabase.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
        }),
        `update ${member.email}`,
      );
      userId = existing.id;
    } else {
      const created = check(
        await supabase.auth.admin.createUser({
          email: member.email,
          password,
          email_confirm: true,
        }),
        `create ${member.email}`,
      );
      userId = created.user.id;
    }
    check(
      await supabase
        .from("staff_profiles")
        .upsert(
          {
            user_id: userId,
            restaurant_id: restaurant.id,
            role: member.role,
            full_name: member.full_name,
          },
          { onConflict: "user_id" },
        ),
      `link ${member.email}`,
    );
    console.log(`Staff: ${member.email} (${member.role})`);
  }

  // Tables (existing tables keep their QR tokens)
  check(
    await supabase.from("tables").upsert(
      TABLES.map((t) => ({ ...t, restaurant_id: restaurant.id })),
      { onConflict: "restaurant_id,label" },
    ),
    "create tables",
  );
  console.log(`Tables: ${TABLES.length}`);

  // Menu categories, then items (matched by name so reruns update instead of duplicating)
  const existingCategories = check(
    await supabase
      .from("menu_categories")
      .select("id,name")
      .eq("restaurant_id", restaurant.id),
    "read categories",
  );
  const categoryIds = new Map(existingCategories.map((c) => [c.name, c.id]));
  for (const [index, name] of CATEGORIES.entries()) {
    if (categoryIds.has(name)) continue;
    const created = check(
      await supabase
        .from("menu_categories")
        .insert({ restaurant_id: restaurant.id, name, sort_order: index })
        .select()
        .single(),
      `create category ${name}`,
    );
    categoryIds.set(name, created.id);
  }

  const existingItems = check(
    await supabase
      .from("menu_items")
      .select("id,name")
      .eq("restaurant_id", restaurant.id),
    "read menu items",
  );
  const itemIds = new Map(existingItems.map((i) => [i.name, i.id]));
  for (const [index, item] of MENU.entries()) {
    const row = {
      restaurant_id: restaurant.id,
      category_id: categoryIds.get(item.category),
      name: item.name,
      description: item.description,
      price_cents: item.price_cents,
      available: item.available ?? true,
      sort_order: index,
    };
    const id = itemIds.get(item.name);
    if (id)
      check(
        await supabase.from("menu_items").update(row).eq("id", id),
        `update ${item.name}`,
      );
    else
      check(
        await supabase.from("menu_items").insert(row),
        `create ${item.name}`,
      );
  }
  console.log(`Menu: ${MENU.length} items`);

  console.log(
    "\nDone. Sign in at /login with any of the demo emails above and your SEED_PASSWORD.",
  );
}

// Set the exit code instead of calling process.exit(), which crashes on Windows with open handles.
main().catch((error) => {
  console.error(error instanceof SeedError ? `\n${error.message}\n` : error);
  process.exitCode = 1;
});
