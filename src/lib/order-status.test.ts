import { describe, expect, it } from "vitest";
import { statusMessage, stepIndex, type OrderStatus } from "./order-status";

describe("order status", () => {
  it("maps each status to a step in order", () => {
    expect(stepIndex("placed")).toBe(0);
    expect(stepIndex("confirmed")).toBe(1);
    expect(stepIndex("preparing")).toBe(2);
    expect(stepIndex("ready")).toBe(3);
  });

  it("treats served as complete and cancelled as outside the flow", () => {
    expect(stepIndex("served")).toBe(4);
    expect(stepIndex("cancelled")).toBe(-1);
  });

  it("has a guest-friendly message for every status", () => {
    const all: OrderStatus[] = [
      "placed",
      "confirmed",
      "preparing",
      "ready",
      "served",
      "cancelled",
    ];
    for (const status of all)
      expect(statusMessage(status).length).toBeGreaterThan(10);
  });
});
