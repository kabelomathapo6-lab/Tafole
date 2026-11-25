"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Switch } from "@/components/ui";
import type { ItemValues } from "@/lib/menu-api";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import { formatRand, parseRandToCents } from "@/lib/money";

export interface ItemFormProps {
  categories: MenuCategory[];
  /** The item being edited, or null when adding a new one. */
  item: MenuItem | null;
  defaultCategoryId: string | null;
  saving: boolean;
  error: string | null;
  onSubmit: (values: ItemValues) => void;
  onDelete?: () => void;
}

const fieldClasses =
  "rounded-control border-[1.5px] border-line bg-porcelain px-4 py-3 text-base text-pine focus:border-forest focus:outline-none focus:ring-[3px] focus:ring-forest-soft";

export function ItemForm({
  categories,
  item,
  defaultCategoryId,
  saving,
  error,
  onSubmit,
  onDelete,
}: ItemFormProps) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(
    item ? (item.price_cents / 100).toFixed(2) : "",
  );
  const [categoryId, setCategoryId] = useState(
    item ? (item.category_id ?? "") : (defaultCategoryId ?? ""),
  );
  const [available, setAvailable] = useState(item?.available ?? true);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { name?: string; price?: string } = {};
    const trimmedName = name.trim();
    if (!trimmedName) nextErrors.name = "Enter a name for the item.";
    else if (trimmedName.length > 120)
      nextErrors.name = "Keep the name under 120 characters.";

    const cents = parseRandToCents(price);
    if (cents === null || cents === 0)
      nextErrors.price = "Enter a price in rand, like 125 or 39.90.";

    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.price || cents === null) return;

    onSubmit({
      name: trimmedName,
      description: description.trim() || null,
      price_cents: cents,
      category_id: categoryId || null,
      available,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        maxLength={120}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="item-description"
          className="font-display text-[13px] font-semibold tracking-wide"
        >
          Description
        </label>
        <textarea
          id="item-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldClasses}
        />
      </div>

      <Input
        label="Price (rand)"
        inputMode="decimal"
        placeholder="125.00"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={errors.price}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="item-category"
          className="font-display text-[13px] font-semibold tracking-wide"
        >
          Category
        </label>
        <select
          id="item-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={`${fieldClasses} min-h-12`}
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-[13px] font-semibold tracking-wide">
          {available ? "Available to order" : "Sold out"}
        </span>
        <Switch
          checked={available}
          onCheckedChange={setAvailable}
          label="Available"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-control bg-status-error-soft px-4 py-3 text-sm text-status-error"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? "Saving…" : item ? "Save changes" : "Add item"}
      </Button>

      {item && onDelete ? (
        confirmingDelete ? (
          <div className="flex flex-col gap-2 rounded-control bg-status-error-soft p-4">
            <p className="text-sm text-status-error">
              Delete {item.name} ({formatRand(item.price_cents)}) from the menu?
              Past orders keep their record.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="urgent"
                onClick={onDelete}
                disabled={saving}
              >
                Yes, delete
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmingDelete(false)}
              >
                Keep it
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirmingDelete(true)}
          >
            Delete item
          </Button>
        )
      ) : null}
    </form>
  );
}
