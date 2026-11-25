"use client";

import { useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import type { TableValues } from "@/lib/tables-api";
import type { RestaurantTable } from "@/lib/tables";

export interface TableFormProps {
  table: RestaurantTable | null;
  areas: string[];
  saving: boolean;
  error: string | null;
  onSubmit: (values: TableValues) => void;
  onDelete?: () => void;
}

export function TableForm({
  table,
  areas,
  saving,
  error,
  onSubmit,
  onDelete,
}: TableFormProps) {
  const [label, setLabel] = useState(table?.label ?? "");
  const [area, setArea] = useState(table?.area ?? "");
  const [seats, setSeats] = useState(String(table?.seats ?? 2));
  const [errors, setErrors] = useState<{ label?: string; seats?: string }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: { label?: string; seats?: string } = {};
    const trimmed = label.trim();
    if (!trimmed) next.label = "Enter a name, like Table 7.";
    else if (trimmed.length > 40)
      next.label = "Keep the name under 40 characters.";

    const count = Number(seats);
    if (!/^\d+$/.test(seats.trim()) || count < 1 || count > 50)
      next.seats = "Enter a number of seats from 1 to 50.";

    setErrors(next);
    if (next.label || next.seats) return;
    onSubmit({ label: trimmed, area: area.trim() || null, seats: count });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Name"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        error={errors.label}
        maxLength={40}
      />
      <div className="flex flex-col gap-1.5">
        <Input
          label="Area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          list="table-areas"
          placeholder="Main dining"
        />
        <datalist id="table-areas">
          {areas.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>
      <Input
        label="Seats"
        inputMode="numeric"
        value={seats}
        onChange={(e) => setSeats(e.target.value)}
        error={errors.seats}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-control bg-status-error-soft px-4 py-3 text-sm text-status-error"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? "Saving…" : table ? "Save changes" : "Add table"}
      </Button>

      {table && onDelete ? (
        confirmingDelete ? (
          <div className="flex flex-col gap-2 rounded-control bg-status-error-soft p-4">
            <p className="text-sm text-status-error">
              Delete {table.label}? This also removes its orders and requests,
              and its printed QR code stops working.
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
            Delete table
          </Button>
        )
      ) : null}
    </form>
  );
}
