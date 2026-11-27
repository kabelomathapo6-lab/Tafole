import { Button } from "@/components/ui";
import { minutesSince, type FloorTable, type StaffRequest } from "@/lib/floor";

export interface RequestsListProps {
  requests: StaffRequest[];
  tables: FloorTable[];
  now: number;
  busy: boolean;
  onAcknowledge: (request: StaffRequest) => void;
  onResolve: (request: StaffRequest) => void;
}

/** Guests asking for the waiter or the bill, longest wait first. */
export function RequestsList({
  requests,
  tables,
  now,
  busy,
  onAcknowledge,
  onResolve,
}: RequestsListProps) {
  const ordered = [...requests].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  return (
    <section aria-label="Requests" className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold">
        Requests{" "}
        <span className="text-olive tabular-nums">({ordered.length})</span>
      </h2>
      {ordered.length === 0 ? (
        <p className="text-sm text-muted">No guests are asking for you.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((request) => {
            const label =
              tables.find((t) => t.id === request.table_id)?.label ?? "Table";
            const minutes = minutesSince(request.created_at, now);
            return (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-terracotta-soft px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="font-display font-semibold">
                    {label}: {request.type === "bill" ? "Bill" : "Call waiter"}
                  </span>
                  <span className="text-sm text-terracotta-ink tabular-nums">
                    waiting {minutes} min
                    {request.status === "acknowledged" ? " · on the way" : ""}
                  </span>
                </div>
                <div className="flex gap-2">
                  {request.status === "open" ? (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      aria-label={`On my way to ${label}`}
                      onClick={() => onAcknowledge(request)}
                    >
                      On my way
                    </Button>
                  ) : null}
                  <Button
                    disabled={busy}
                    aria-label={`Done with ${label} ${request.type}`}
                    onClick={() => onResolve(request)}
                  >
                    Done
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
