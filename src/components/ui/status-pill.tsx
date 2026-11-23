import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type Status =
  "empty" | "ordered" | "waiting" | "bill" | "ready" | "error";

const styles: Record<Status, { label: string; classes: string }> = {
  empty: { label: "Empty", classes: "bg-status-empty-soft text-status-empty" },
  ordered: {
    label: "Ordered",
    classes: "bg-status-ordered-soft text-status-ordered",
  },
  waiting: {
    label: "Waiting",
    classes: "bg-status-waiting-soft text-status-waiting-ink",
  },
  bill: {
    label: "Bill requested",
    classes: "bg-status-bill-soft text-terracotta-ink",
  },
  ready: { label: "Ready", classes: "bg-status-ready-soft text-status-ready" },
  error: {
    label: "Sold out",
    classes: "bg-status-error-soft text-status-error",
  },
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  status: Status;
}

export function StatusPill({
  status,
  className,
  children,
  ...props
}: StatusPillProps) {
  const { label, classes } = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-display text-[13px] font-semibold tracking-wide",
        classes,
        className,
      )}
      {...props}
    >
      {children ?? label}
    </span>
  );
}
