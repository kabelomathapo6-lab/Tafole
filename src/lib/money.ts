/** Format cents as South African rand, e.g. 12500 -> "R125.00", 125000 -> "R1,250.00". */
export function formatRand(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const rand = String(Math.floor(abs / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );
  return `${sign}R${rand}.${String(abs % 100).padStart(2, "0")}`;
}

const MAX_CENTS = 10_000_000; // R100,000: a sanity limit for a menu price

/**
 * Parse what a manager types into cents. Accepts "125", "125.5", "125,50" and "R125.00".
 * Returns null when it is not a valid, non-negative amount with at most two decimals.
 */
export function parseRandToCents(input: string): number | null {
  let text = input.trim().replace(/^r\s*/i, "").replace(/\s/g, "");
  if (/^\d+,\d{1,2}$/.test(text)) text = text.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents > MAX_CENTS ? null : cents;
}
