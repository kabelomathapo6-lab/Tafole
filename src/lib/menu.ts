export type MenuCategory = { id: string; name: string; sort_order: number };

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  available: boolean;
  sort_order: number;
};

export type MenuSection = {
  id: string | null;
  name: string;
  items: MenuItem[];
};

const bySortThenName = <T extends { sort_order: number; name: string }>(
  a: T,
  b: T,
) => a.sort_order - b.sort_order || a.name.localeCompare(b.name);

/** Group items under their categories in display order. Items without a category go last. */
export function groupMenu(
  categories: MenuCategory[],
  items: MenuItem[],
): MenuSection[] {
  const sections: MenuSection[] = [...categories]
    .sort(bySortThenName)
    .map((category) => ({
      id: category.id,
      name: category.name,
      items: items
        .filter((item) => item.category_id === category.id)
        .sort(bySortThenName),
    }));

  const known = new Set(categories.map((c) => c.id));
  const loose = items.filter(
    (item) => !item.category_id || !known.has(item.category_id),
  );
  if (loose.length > 0)
    sections.push({
      id: null,
      name: "No category",
      items: loose.sort(bySortThenName),
    });
  return sections;
}
