export type RestaurantTable = {
  id: string;
  label: string;
  area: string | null;
  seats: number;
  qr_token: string;
};

export type TableSection = {
  area: string | null;
  name: string;
  tables: RestaurantTable[];
};

const natural = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true });

/** Group tables by dining area (A to Z), tables with no area last. "Table 2" sorts before "Table 10". */
export function groupTables(tables: RestaurantTable[]): TableSection[] {
  const areas = [
    ...new Set(tables.map((t) => t.area).filter((a): a is string => !!a)),
  ].sort(natural);
  const sections: TableSection[] = areas.map((area) => ({
    area,
    name: area,
    tables: tables
      .filter((t) => t.area === area)
      .sort((a, b) => natural(a.label, b.label)),
  }));
  const loose = tables.filter((t) => !t.area);
  if (loose.length > 0) {
    sections.push({
      area: null,
      name: "No area",
      tables: loose.sort((a, b) => natural(a.label, b.label)),
    });
  }
  return sections;
}

/** The address a guest's phone opens when they scan a table's QR code. */
export function qrUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}/t/${token}`;
}
