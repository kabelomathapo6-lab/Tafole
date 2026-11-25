import { Card, StatusPill } from "@/components/ui";
import { formatRand } from "@/lib/money";
import { PROGRESS_STEPS, statusMessage, stepIndex } from "@/lib/order-status";
import type { GuestOrder } from "@/lib/guest-api";

function sentAt(iso: string) {
  return new Date(iso).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Progress({ order }: { order: GuestOrder }) {
  const current = stepIndex(order.status);
  return (
    <ol aria-label="Order progress" className="grid grid-cols-4 gap-1">
      {PROGRESS_STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <li
            key={step.status}
            aria-current={index === current ? "step" : undefined}
            className="flex flex-col items-center gap-1 text-center"
          >
            <span
              className={`h-1.5 w-full rounded-full ${done ? "bg-status-ready" : "bg-line"}`}
            />
            <span
              className={`text-xs ${done ? "font-semibold text-pine" : "text-muted"}`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrdersView({
  orders,
  justOrdered,
}: {
  orders: GuestOrder[];
  justOrdered: boolean;
}) {
  if (orders.length === 0) {
    return (
      <Card className="p-5 text-olive">
        You have not ordered yet. Pick something from the menu.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {justOrdered ? (
        <p
          role="status"
          className="rounded-control bg-status-ready-soft px-4 py-3 text-sm font-semibold text-status-ready"
        >
          Order sent! Your waiter will confirm it shortly.
        </p>
      ) : null}
      {orders.map((order) => (
        <Card key={order.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display font-semibold">
              Sent at {sentAt(order.created_at)}
            </p>
            {order.status === "cancelled" ? (
              <StatusPill status="error">Cancelled</StatusPill>
            ) : null}
          </div>
          {order.status !== "cancelled" ? <Progress order={order} /> : null}
          <p className="text-sm text-olive">{statusMessage(order.status)}</p>
          <ul className="flex flex-col gap-1 border-t border-line pt-3">
            {order.order_items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span>
                  {item.quantity} × {item.name_snapshot}
                  {item.note ? (
                    <span className="block text-xs text-muted">
                      {item.note}
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums">
                  {formatRand(item.quantity * item.price_cents_snapshot)}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between border-t border-line pt-3 font-display font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {formatRand(
                order.order_items.reduce(
                  (sum, i) => sum + i.quantity * i.price_cents_snapshot,
                  0,
                ),
              )}
            </span>
          </p>
        </Card>
      ))}
    </div>
  );
}
