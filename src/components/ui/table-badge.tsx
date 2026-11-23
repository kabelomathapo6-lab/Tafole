import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Context badge shown in headers, e.g. "Table 7". */
export function TableBadge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full bg-forest-soft px-3 font-display text-[13px] font-semibold tabular-nums text-forest-ink",
        className,
      )}
      {...props}
    />
  );
}
