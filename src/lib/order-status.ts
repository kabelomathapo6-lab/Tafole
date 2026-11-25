export type OrderStatus =
  "placed" | "confirmed" | "preparing" | "ready" | "served" | "cancelled";

export const PROGRESS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "placed", label: "Sent" },
  { status: "confirmed", label: "Confirmed" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
];

/** Index of the step the order has reached; served counts as past the last step. -1 when cancelled. */
export function stepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  if (status === "served") return PROGRESS_STEPS.length;
  return PROGRESS_STEPS.findIndex((step) => step.status === status);
}

export function statusMessage(status: OrderStatus): string {
  switch (status) {
    case "placed":
      return "Order sent. Your waiter will confirm it shortly.";
    case "confirmed":
      return "Confirmed and sent to the kitchen.";
    case "preparing":
      return "The kitchen is preparing your order.";
    case "ready":
      return "Ready! Your waiter is bringing it over.";
    case "served":
      return "Served. Enjoy your meal!";
    case "cancelled":
      return "This order was cancelled. Your waiter can help you.";
  }
}
