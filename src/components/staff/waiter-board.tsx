"use client";

import { useMemo, useState } from "react";
import { Button, Card, Drawer, StatusPill } from "@/components/ui";
import {
  minutesSince,
  orderTotal,
  ordersByTable,
  tableState,
  type StaffOrder,
  type TableState,
} from "@/lib/floor";
import { formatRand } from "@/lib/money";
import { statusMessage } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/order-status";
import { groupTables } from "@/lib/tables";
import { removeItem, setItemQuantity, setOrderStatus } from "@/lib/staff-api";
import { StaffHeader } from "./staff-header";
import { useFloor } from "./use-floor";
import { useNow } from "./use-now";

const STATUSES: OrderStatus[] = ["placed", "confirmed", "preparing", "ready"];

const STATE_LABEL: Record<TableState, string> = {
  empty: "Empty",
  ordered: "New order",
  waiting: "In kitchen",
  ready: "Ready to serve",
};
const STATE_PILL: Record<
  TableState,
  "empty" | "ordered" | "waiting" | "ready"
> = {
  empty: "empty",
  ordered: "ordered",
  waiting: "waiting",
  ready: "ready",
};
const STATE_BAR: Record<TableState, string> = {
  empty: "bg-status-empty-soft",
  ordered: "bg-status-ordered",
  waiting: "bg-status-waiting",
  ready: "bg-status-ready",
};

const stepButton =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-line bg-porcelain text-lg font-semibold text-pine disabled:opacity-50";

function OrderCard({
  order,
  now,
  busy,
  onStatus,
  onQuantity,
  onRemove,
}: {
  order: StaffOrder;
  now: number;
  busy: boolean;
  onStatus: (order: StaffOrder, status: OrderStatus) => void;
  onQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const editable = order.status === "placed";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display font-semibold">
          Sent {minutesSince(order.created_at, now)} min ago
        </p>
        <StatusPill
          status={
            order.status === "ready"
              ? "ready"
              : order.status === "placed"
                ? "ordered"
                : "waiting"
          }
        >
          {
            {
              placed: "New",
              confirmed: "Confirmed",
              preparing: "Preparing",
              ready: "Ready",
              served: "Served",
              cancelled: "Cancelled",
            }[order.status]
          }
        </StatusPill>
      </div>
      <p className="text-sm text-olive">{statusMessage(order.status)}</p>

      <ul className="flex flex-col gap-3 border-t border-line pt-3">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0 text-sm">
              <span className="font-semibold tabular-nums">
                {item.quantity} ×
              </span>{" "}
              {item.name_snapshot}
              {item.note ? (
                <span className="block text-xs text-muted">{item.note}</span>
              ) : null}
            </span>
            {editable ? (
              <span className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className={stepButton}
                  aria-label={`Remove one ${item.name_snapshot}`}
                  disabled={busy || item.quantity <= 1}
                  onClick={() => onQuantity(item.id, item.quantity - 1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className={stepButton}
                  aria-label={`Add one more ${item.name_snapshot}`}
                  disabled={busy || item.quantity >= 20}
                  onClick={() => onQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className={stepButton}
                  aria-label={`Delete ${item.name_snapshot}`}
                  disabled={busy}
                  onClick={() => onRemove(item.id)}
                >
                  ×
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {order.notes ? (
        <p className="rounded-control bg-status-waiting-soft px-3 py-2 text-sm font-semibold text-status-waiting-ink">
          {order.notes}
        </p>
      ) : null}
      <p className="flex justify-between border-t border-line pt-3 font-display font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatRand(orderTotal(order))}</span>
      </p>

      {order.status === "placed" ? (
        <Button
          size="lg"
          disabled={busy || order.order_items.length === 0}
          onClick={() => onStatus(order, "confirmed")}
        >
          Confirm and send to kitchen
        </Button>
      ) : null}
      {order.status === "ready" ? (
        <Button
          size="lg"
          disabled={busy}
          onClick={() => onStatus(order, "served")}
        >
          Mark served
        </Button>
      ) : null}
      {order.status === "placed" || order.status === "confirmed" ? (
        confirmingCancel ? (
          <div className="flex flex-col gap-2 rounded-control bg-status-error-soft p-3">
            <p className="text-sm text-status-error">
              Cancel this order? The guest will see it as cancelled.
            </p>
            <div className="flex gap-2">
              <Button
                variant="urgent"
                disabled={busy}
                onClick={() => onStatus(order, "cancelled")}
              >
                Yes, cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmingCancel(false)}
              >
                Keep it
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setConfirmingCancel(true)}
          >
            Cancel order
          </Button>
        )
      ) : null}
    </Card>
  );
}

export function WaiterBoard() {
  const { data, error, refresh, getClient } = useFloor(STATUSES);
  const now = useNow();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const byTable = useMemo(() => ordersByTable(data?.orders ?? []), [data]);
  const sections = useMemo(() => groupTables(data?.tables ?? []), [data]);
  const newOrders = useMemo(
    () => (data?.orders ?? []).filter((o) => o.status === "placed"),
    [data],
  );

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(false);
      refresh();
    }
  }

  const client = getClient;
  const table = data?.tables.find((t) => t.id === selected) ?? null;
  const tableOrders = selected ? (byTable.get(selected) ?? []) : [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <StaffHeader title="Floor" subtitle="Tap a table to see its orders." />

      {error && !data ? (
        <p role="alert" className="text-status-error">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="alert"
          className="rounded-control bg-status-error-soft px-4 py-3 text-sm text-status-error"
        >
          {notice}
        </p>
      ) : null}
      {!data && !error ? (
        <p className="text-olive">Loading the floor…</p>
      ) : null}

      {data ? (
        <>
          <section aria-label="New orders" className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold">
              New orders{" "}
              <span className="tabular-nums text-olive">
                ({newOrders.length})
              </span>
            </h2>
            {newOrders.length === 0 ? (
              <p className="text-sm text-muted">No new orders waiting.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {newOrders.map((order) => (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(order.table_id)}
                      aria-label={`Open new order for ${data.tables.find((t) => t.id === order.table_id)?.label ?? "table"}`}
                      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-card border border-line bg-status-ordered-soft px-4 py-3 text-left"
                    >
                      <span className="font-display font-semibold">
                        {data.tables.find((t) => t.id === order.table_id)
                          ?.label ?? "Table"}
                      </span>
                      <span className="text-sm text-olive tabular-nums">
                        {order.order_items.reduce((n, i) => n + i.quantity, 0)}{" "}
                        items · waiting {minutesSince(order.created_at, now)}{" "}
                        min
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {sections.map((section) => (
            <section
              key={section.area ?? "none"}
              aria-label={section.name}
              className="flex flex-col gap-3"
            >
              <h2 className="font-display text-lg font-semibold">
                {section.name}
              </h2>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {section.tables.map((t) => {
                  const state = tableState(byTable.get(t.id) ?? []);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(t.id)}
                        aria-label={`${t.label}, ${STATE_LABEL[state]}`}
                        className="relative flex w-full flex-col items-start gap-2 overflow-hidden rounded-card border border-line bg-porcelain p-4 pt-5 text-left shadow-card transition hover:bg-oat"
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute inset-x-0 top-0 h-1 ${STATE_BAR[state]}`}
                        />
                        <span className="font-display text-lg font-bold">
                          {t.label}
                        </span>
                        <span className="text-sm text-olive">
                          {t.seats} seats
                        </span>
                        <StatusPill status={STATE_PILL[state]}>
                          {STATE_LABEL[state]}
                        </StatusPill>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </>
      ) : null}

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={table?.label ?? "Table"}
      >
        {tableOrders.length === 0 ? (
          <p className="text-olive">No active orders for this table.</p>
        ) : (
          tableOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              now={now}
              busy={busy}
              onStatus={(o, status) =>
                void act(() => setOrderStatus(client(), o.id, status))
              }
              onQuantity={(itemId, quantity) =>
                void act(() => setItemQuantity(client(), itemId, quantity))
              }
              onRemove={(itemId) =>
                void act(() => removeItem(client(), itemId))
              }
            />
          ))
        )}
        {notice ? (
          <p
            role="alert"
            className="rounded-control bg-status-error-soft px-4 py-3 text-sm text-status-error"
          >
            {notice}
          </p>
        ) : null}
      </Drawer>
    </main>
  );
}
