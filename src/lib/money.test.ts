import { describe, expect, it } from "vitest";
import { formatRand, parseRandToCents } from "./money";

describe("formatRand", () => {
  it("formats cents as rand with two decimals", () => {
    expect(formatRand(12500)).toBe("R125.00");
    expect(formatRand(5)).toBe("R0.05");
    expect(formatRand(3950)).toBe("R39.50");
  });

  it("adds thousands separators", () => {
    expect(formatRand(125000)).toBe("R1,250.00");
  });
});

describe("parseRandToCents", () => {
  it("accepts common ways of typing a price", () => {
    expect(parseRandToCents("125")).toBe(12500);
    expect(parseRandToCents("125.5")).toBe(12550);
    expect(parseRandToCents("125,50")).toBe(12550);
    expect(parseRandToCents("R 39.90")).toBe(3990);
    expect(parseRandToCents("  0.99 ")).toBe(99);
  });

  it("rejects invalid or unreasonable amounts", () => {
    expect(parseRandToCents("")).toBeNull();
    expect(parseRandToCents("abc")).toBeNull();
    expect(parseRandToCents("-5")).toBeNull();
    expect(parseRandToCents("1.234")).toBeNull();
    expect(parseRandToCents("12.5.0")).toBeNull();
    expect(parseRandToCents("999999999")).toBeNull();
  });
});
