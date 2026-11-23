import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="font-display text-[13px] font-semibold tracking-wide text-pine"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-12 rounded-control border-[1.5px] bg-porcelain px-4 py-3 text-base text-pine",
          "placeholder:text-muted focus:border-forest focus:outline-none focus:ring-[3px] focus:ring-forest-soft",
          error ? "border-status-error" : "border-line",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
