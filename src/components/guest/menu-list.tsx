import { Card, Chip, StatusPill } from "@/components/ui";
import type { CartLine } from "@/lib/cart";
import { groupMenu, type MenuCategory, type MenuItem } from "@/lib/menu";
import { formatRand } from "@/lib/money";

export interface MenuListProps {
  categories: MenuCategory[];
  items: MenuItem[];
  cart: CartLine[];
  activeCategory: string | null;
  onCategoryChange: (id: string | null) => void;
  onAdd: (item: MenuItem) => void;
  onQuantity: (itemId: string, quantity: number) => void;
}

const stepButton =
  "inline-flex h-11 w-11 items-center justify-center rounded-full bg-forest text-xl font-semibold text-porcelain transition active:scale-95";

export function MenuList({
  categories,
  items,
  cart,
  activeCategory,
  onCategoryChange,
  onAdd,
  onQuantity,
}: MenuListProps) {
  const sections = groupMenu(categories, items).filter(
    (section) =>
      section.items.length > 0 &&
      (activeCategory === null || section.id === activeCategory),
  );
  const chipCategories = groupMenu(categories, items).filter(
    (s) => s.id && s.items.length > 0,
  );

  return (
    <div className="flex flex-col gap-5">
      <div
        role="group"
        aria-label="Categories"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        <Chip
          active={activeCategory === null}
          onClick={() => onCategoryChange(null)}
        >
          All
        </Chip>
        {chipCategories.map((section) => (
          <Chip
            key={section.id}
            active={activeCategory === section.id}
            onClick={() => onCategoryChange(section.id)}
          >
            {section.name}
          </Chip>
        ))}
      </div>

      {sections.map((section) => (
        <section
          key={section.id ?? "none"}
          aria-label={section.name}
          className="flex flex-col gap-3"
        >
          <h2 className="font-display text-lg font-semibold">{section.name}</h2>
          <ul className="flex flex-col gap-3">
            {section.items.map((item) => {
              const line = cart.find((entry) => entry.itemId === item.id);
              return (
                <li key={item.id}>
                  <Card
                    className={`flex items-center gap-3 p-4 ${item.available ? "" : "opacity-60"}`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold">
                          {item.name}
                        </span>
                        {!item.available ? <StatusPill status="error" /> : null}
                      </span>
                      {item.description ? (
                        <span className="line-clamp-2 text-sm text-olive">
                          {item.description}
                        </span>
                      ) : null}
                      <span className="font-display font-semibold tabular-nums">
                        {formatRand(item.price_cents)}
                      </span>
                    </div>
                    {item.available ? (
                      line ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={stepButton}
                            aria-label={`Remove one ${item.name}`}
                            onClick={() =>
                              onQuantity(item.id, line.quantity - 1)
                            }
                          >
                            −
                          </button>
                          <span
                            className="w-5 text-center font-semibold tabular-nums"
                            aria-label={`${line.quantity} in your order`}
                          >
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className={stepButton}
                            aria-label={`Add one more ${item.name}`}
                            onClick={() =>
                              onQuantity(item.id, line.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={stepButton}
                          aria-label={`Add ${item.name}`}
                          onClick={() => onAdd(item)}
                        >
                          +
                        </button>
                      )
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
