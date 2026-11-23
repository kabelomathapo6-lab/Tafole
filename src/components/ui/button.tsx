import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "urgent" | "secondary";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** md = 44px touch target, lg = 52px (kitchen and service-critical actions) */
  size?: ButtonSize;
  pill?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-forest text-porcelain hover:bg-forest-ink",
  urgent: "bg-terracotta text-porcelain hover:bg-terracotta-sunlit",
  secondary: "bg-porcelain text-pine border-[1.5px] border-line hover:bg-oat",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-base",
  lg: "min-h-[52px] px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  pill = false,
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-display font-semibold",
        "transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        pill ? "rounded-full" : "rounded-control",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
