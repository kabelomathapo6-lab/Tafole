"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button, Card, Drawer, StatusPill, Switch } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { groupMenu, type MenuCategory, type MenuItem } from "@/lib/menu";
import {
  createCategory,
  createItem,
  deleteItem,
  loadMenu,
  setItemAvailable,
  updateItem,
  type ItemValues,
} from "@/lib/menu-api";
import { formatRand } from "@/lib/money";
import { ItemForm } from "./item-form";

type Dialog =
  | { mode: "new"; categoryId: string | null }
  | { mode: "edit"; item: MenuItem }
  | null;

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Try again.";
}

export function MenuManager() {
  const clientRef = useRef<SupabaseClient | null>(null);
  const getClient = useCallback(
    () => (clientRef.current ??= createClient()),
    [],
  );

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadMenu(getClient())
      .then((data) => {
        if (cancelled) return;
        setRestaurantId(data.restaurantId);
        setCategories(data.categories);
        setItems(data.items);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(messageOf(error));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [getClient, reloadKey]);

  const sections = useMemo(
    () => groupMenu(categories, items),
    [categories, items],
  );
  const nextSort = (list: { sort_order: number }[]) =>
    Math.max(-1, ...list.map((entry) => entry.sort_order)) + 1;

  function closeDialog() {
    setDialog(null);
    setDialogError(null);
  }

  async function toggleAvailable(item: MenuItem, available: boolean) {
    setNotice(null);
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, available } : entry,
      ),
    );
    try {
      await setItemAvailable(getClient(), item.id, available);
    } catch (error) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, available: item.available }
            : entry,
        ),
      );
      setNotice(messageOf(error));
    }
  }

  async function saveItem(values: ItemValues) {
    if (!dialog) return;
    setSaving(true);
    setDialogError(null);
    try {
      if (dialog.mode === "edit") {
        const saved = await updateItem(getClient(), dialog.item.id, values);
        setItems((current) =>
          current.map((entry) => (entry.id === saved.id ? saved : entry)),
        );
      } else {
        const saved = await createItem(
          getClient(),
          restaurantId,
          values,
          nextSort(items),
        );
        setItems((current) => [...current, saved]);
      }
      closeDialog();
    } catch (error) {
      setDialogError(messageOf(error));
    } finally {
      setSaving(false);
    }
  }

  async function removeItem() {
    if (!dialog || dialog.mode !== "edit") return;
    setSaving(true);
    setDialogError(null);
    try {
      await deleteItem(getClient(), dialog.item.id);
      const removedId = dialog.item.id;
      setItems((current) => current.filter((entry) => entry.id !== removedId));
      closeDialog();
    } catch (error) {
      setDialogError(messageOf(error));
    } finally {
      setSaving(false);
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    setNotice(null);
    try {
      const created = await createCategory(
        getClient(),
        restaurantId,
        name,
        nextSort(categories),
      );
      setCategories((current) => [...current, created]);
      setNewCategory("");
    } catch (error) {
      setNotice(messageOf(error));
    }
  }

  if (status === "loading") {
    return <p className="text-olive">Loading your menu…</p>;
  }

  if (status === "error") {
    return (
      <Card className="flex flex-col items-start gap-3 p-5">
        <p role="alert" className="text-status-error">
          {loadError}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setStatus("loading");
            setReloadKey((key) => key + 1);
          }}
        >
          Try again
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-olive">
          {items.length} {items.length === 1 ? "item" : "items"} in{" "}
          {categories.length}{" "}
          {categories.length === 1 ? "category" : "categories"}
        </p>
        <Button onClick={() => setDialog({ mode: "new", categoryId: null })}>
          Add item
        </Button>
      </div>

      {notice ? (
        <p
          role="alert"
          className="rounded-control bg-status-error-soft px-4 py-3 text-sm text-status-error"
        >
          {notice}
        </p>
      ) : null}

      {items.length === 0 ? (
        <Card className="p-5 text-olive">
          Your menu is empty. Add your first item to get started.
        </Card>
      ) : null}

      {sections.map((section) => (
        <section
          key={section.id ?? "none"}
          aria-label={section.name}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">
              {section.name}
            </h2>
            {section.id ? (
              <Button
                variant="secondary"
                onClick={() =>
                  setDialog({ mode: "new", categoryId: section.id })
                }
              >
                Add to {section.name}
              </Button>
            ) : null}
          </div>
          {section.items.length === 0 ? (
            <p className="text-sm text-muted">No items in this category yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {section.items.map((item) => (
                <li key={item.id}>
                  <Card className="flex items-center gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => setDialog({ mode: "edit", item })}
                      className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                      aria-label={`Edit ${item.name}`}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold">
                          {item.name}
                        </span>
                        {!item.available ? <StatusPill status="error" /> : null}
                      </span>
                      {item.description ? (
                        <span className="line-clamp-2 text-sm text-olive">
                          {item.description}
                        </span>
                      ) : null}
                    </button>
                    <span className="font-display font-semibold tabular-nums">
                      {formatRand(item.price_cents)}
                    </span>
                    <Switch
                      checked={item.available}
                      onCheckedChange={(next) =>
                        void toggleAvailable(item, next)
                      }
                      label={`Available: ${item.name}`}
                    />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <form onSubmit={addCategory} className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
          <label
            htmlFor="new-category"
            className="font-display text-[13px] font-semibold tracking-wide"
          >
            New category
          </label>
          <input
            id="new-category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            maxLength={80}
            placeholder="Desserts"
            className="min-h-12 rounded-control border-[1.5px] border-line bg-porcelain px-4 py-3 text-base text-pine focus:border-forest focus:outline-none focus:ring-[3px] focus:ring-forest-soft"
          />
        </div>
        <Button type="submit" variant="secondary" size="lg">
          Add category
        </Button>
      </form>

      <Drawer
        open={dialog !== null}
        onClose={closeDialog}
        title={dialog?.mode === "edit" ? "Edit item" : "Add item"}
      >
        {dialog ? (
          <ItemForm
            key={
              dialog.mode === "edit"
                ? dialog.item.id
                : `new-${dialog.categoryId ?? "none"}`
            }
            categories={categories}
            item={dialog.mode === "edit" ? dialog.item : null}
            defaultCategoryId={dialog.mode === "new" ? dialog.categoryId : null}
            saving={saving}
            error={dialogError}
            onSubmit={(values) => void saveItem(values)}
            onDelete={
              dialog.mode === "edit" ? () => void removeItem() : undefined
            }
          />
        ) : null}
      </Drawer>
    </div>
  );
}
