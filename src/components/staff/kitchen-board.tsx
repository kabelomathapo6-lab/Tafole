"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import {
  minutesSince,
  ticketTone,
  type StaffOrder,
  type FloorTable,
} from "@/lib/floor";
import type { OrderStatus } from "@/lib/order-status";
import { setOrderStatus } from "@/lib/staff-api";
import { StaffHeader } from "./staff-header";
import { useFloor } from "./use-floor";
import { useNow } from "./use-now";

const STATUSES: OrderStatus[] = ["confirmed", "preparing", "ready"];

const COLUMNS: {
  status: OrderStatus;
  title: string;
  action?: { label: string; next: OrderStatus };
}[] = [
  {
    status: "confirmed",
    title: "New",
    action: { label: "Start preparing", next: "preparing" },
  },
  {
    status: "preparing",
    title: "Preparing",
    action: { label: "Mark ready", next: "ready" },
  },
  { status: "ready", title: "Ready for pass" },
];

const toneClasses = {
  normal: "bg-stone text-olive",
  warn: "bg-status-waiting-soft text-status-waiting-ink",
  late: "bg-terracotta text-porcelain",
} as const;

function Ticket({
  order,
  table,
  now,
  action,
  busy,
  onAction,
}: {
  order: StaffOrder;
  table: FloorTable | undefined;
  now: number;
  action?: { label: string; next: OrderStatus };
  busy: boolean;
  onAction: (order: StaffOrder, next: OrderStatus) => void;
}) {
  const since =
    order.status === "ready"
      ? (order.ready_at ?? order.created_at)
      : (order.confirmed_at ?? order.created_at);
  const minutes = minutesSince(since, now);
  const tone = order.status === "ready" ? "normal" : ticketTone(minutes);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-bold">
          {table?.label ?? "Table"}
        </h3>
        <span
          className={`inline-flex h-7 items-center rounded-full px-3 font-display text-[13px] font-semibold tabular-nums ${toneClasses[tone]}`}
        >
          {minutes} min
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {order.order_items.map((item) => (
          <li key={item.id} className="text-base">
            <span className="font-display font-bold tabular-nums">
              {item.quantity} ×
            </span>{" "}
            {item.name_snapshot}
            {item.note ? (
              <span className="block text-sm font-semibold text-terracotta-ink">
                {item.note}
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
      {action ? (
        <Button
          size="lg"
          className="w-full"
          disabled={busy}
          onClick={() => onAction(order, action.next)}
        >
          {action.label}
        </Button>
      ) : (
        <p className="text-sm text-olive">
          Waiting for the waiter to collect it.
        </p>
      )}
    </Card>
  );
}

export function KitchenBoard() {
  const { data, error, refresh, getClient } = useFloor(STATUSES);
  const now = useNow();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function advance(order: StaffOrder, next: OrderStatus) {
    setBusyId(order.id);
    setNotice(null);
    try {
      await setOrderStatus(getClient(), order.id, next);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Could not update the order.",
      );
    } finally {
      setBusyId(null);
      refresh();
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-5 px-4 py-6 md:px-6">
      <StaffHeader
        title="Kitchen"
        subtitle="Orders appear here once the waiter confirms them."
      />

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
      {!data && !error ? <p className="text-olive">Loading orders…</p> : null}

      {data ? (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => {
            const orders = data.orders
              .filter((o) => o.status === column.status)
              .sort((a, b) =>
                (a.confirmed_at ?? a.created_at).localeCompare(
                  b.confirmed_at ?? b.created_at,
                ),
              );
            return (
              <section
                key={column.status}
                aria-label={column.title}
                className="flex flex-col gap-3 md:max-h-[calc(100dvh-10rem)] md:overflow-y-auto"
              >
                <h2 className="sticky top-0 z-10 flex items-center justify-between rounded-control bg-oat px-4 py-3 font-display text-lg font-bold">
                  {column.title}
                  <span className="tabular-nums text-olive">
                    {orders.length}
                  </span>
                </h2>
                {orders.length === 0 ? (
                  <p className="px-1 text-sm text-muted">Nothing here.</p>
                ) : null}
                {orders.map((order) => (
                  <Ticket
                    key={order.id}
                    order={order}
                    table={data.tables.find((t) => t.id === order.table_id)}
                    now={now}
                    action={column.action}
                    busy={busyId === order.id}
                    onAction={(o, next) => void advance(o, next)}
                  />
                ))}
              </section>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
