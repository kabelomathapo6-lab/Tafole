import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Tier 2 surface (drawers, modals, sticky headers) instead of a resting card. */
  elevated?: boolean;
}

export function Card({ elevated = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-porcelain border border-line md:rounded-card-lg",
        elevated ? "shadow-raised" : "shadow-card",
        className,
      )}
      {...props}
    />
  );
}
