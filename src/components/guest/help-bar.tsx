import { Button } from "@/components/ui";
import type { GuestRequest } from "@/lib/guest-api";

export interface HelpBarProps {
  requests: GuestRequest[];
  busy: boolean;
  error: string | null;
  onRequest: (type: "waiter" | "bill") => void;
}

function statusLine(requests: GuestRequest[]): string | null {
  const waiter = requests.find((r) => r.type === "waiter");
  const bill = requests.find((r) => r.type === "bill");
  if (waiter?.status === "acknowledged") return "Your waiter is on the way.";
  if (bill?.status === "acknowledged")
    return "Your waiter is bringing the bill.";
  if (waiter) return "Your waiter has been notified.";
  if (bill) return "Bill requested. Your waiter will bring it.";
  return null;
}

/** Two always-available buttons: call the waiter, ask for the bill. */
export function HelpBar({ requests, busy, error, onRequest }: HelpBarProps) {
  const waiter = requests.find((r) => r.type === "waiter");
  const bill = requests.find((r) => r.type === "bill");
  const line = statusLine(requests);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="urgent"
          pill
          disabled={busy || !!waiter}
          onClick={() => onRequest("waiter")}
          className="min-h-11"
        >
          {waiter ? "Waiter called" : "Call waiter"}
        </Button>
        <Button
          variant="secondary"
          pill
          disabled={busy || !!bill}
          onClick={() => onRequest("bill")}
          className="min-h-11"
        >
          {bill ? "Bill requested" : "Request bill"}
        </Button>
      </div>
      {line ? (
        <p
          role="status"
          className="text-center text-sm font-semibold text-terracotta-ink"
        >
          {line}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-center text-sm text-status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
