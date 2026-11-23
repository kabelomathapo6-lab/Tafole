import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Category filter chip (menu categories). */
export function Chip({
  active = false,
  type = "button",
  className,
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center rounded-full px-4 font-display text-sm font-semibold transition",
        active
          ? "bg-forest text-porcelain"
          : "bg-stone text-olive hover:bg-line",
        className,
      )}
      {...props}
    />
  );
}
