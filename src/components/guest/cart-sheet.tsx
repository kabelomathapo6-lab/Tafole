import { Button, Drawer } from "@/components/ui";
import { cartTotal, type CartLine } from "@/lib/cart";
import { formatRand } from "@/lib/money";

export interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  notes: string;
  placing: boolean;
  error: string | null;
  onQuantity: (itemId: string, quantity: number) => void;
  onLineNote: (itemId: string, note: string) => void;
  onNotes: (notes: string) => void;
  onPlace: () => void;
}

const stepButton =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-line bg-porcelain text-lg font-semibold text-pine";

const fieldClasses =
  "rounded-control border-[1.5px] border-line bg-porcelain px-3 py-2 text-base text-pine focus:border-forest focus:outline-none focus:ring-[3px] focus:ring-forest-soft";

export function CartSheet({
  open,
  onClose,
  lines,
  notes,
  placing,
  error,
  onQuantity,
  onLineNote,
  onNotes,
  onPlace,
}: CartSheetProps) {
  return (
    <Drawer open={open} onClose={onClose} title="Your order">
      {lines.length === 0 ? (
        <p className="text-olive">
          Your order is empty. Add something from the menu.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {lines.map((line) => (
              <li
                key={line.itemId}
                className="flex flex-col gap-2 border-b border-line pb-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display font-semibold">
                    {line.name}
                  </span>
                  <span className="font-display font-semibold tabular-nums">
                    {formatRand(line.quantity * line.price_cents)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={stepButton}
                    aria-label={`Remove one ${line.name}`}
                    onClick={() => onQuantity(line.itemId, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className={stepButton}
                    aria-label={`Add one more ${line.name}`}
                    onClick={() => onQuantity(line.itemId, line.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <input
                  aria-label={`Note for ${line.name}`}
                  placeholder="Note for the kitchen (optional)"
                  value={line.note}
                  maxLength={200}
                  onChange={(e) => onLineNote(line.itemId, e.target.value)}
                  className={fieldClasses}
                />
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="order-notes"
              className="font-display text-[13px] font-semibold tracking-wide"
            >
              Allergies or other notes
            </label>
            <textarea
              id="order-notes"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => onNotes(e.target.value)}
              className={fieldClasses}
            />
          </div>

          <p className="flex justify-between font-display text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatRand(cartTotal(lines))}</span>
          </p>

          {error ? (
            <p
              role="alert"
              className="rounded-control bg-status-error-soft px-4 py-3 text-sm text-status-error"
            >
              {error}
            </p>
          ) : null}

          <Button size="lg" onClick={onPlace} disabled={placing}>
            {placing ? "Sending…" : "Place order"}
          </Button>
        </>
      )}
    </Drawer>
  );
}
