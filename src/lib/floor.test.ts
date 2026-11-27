import { describe, expect, it } from "vitest";
import {
  minutesSince,
  orderTotal,
  ordersByTable,
  tableState,
  ticketTone,
  type StaffOrder,
  type StaffRequest,
} from "./floor";

const order = (over: Partial<StaffOrder>): StaffOrder => ({
  id: "o",
  table_id: "t1",
  status: "placed",
  notes: null,
  created_at: "2026-11-25T12:00:00Z",
  confirmed_at: null,
  ready_at: null,
  order_items: [],
  ...over,
});

describe("tableState", () => {
  it("is empty with no active orders", () => {
    expect(tableState([])).toBe("empty");
  });

  it("puts new orders first, then ready food, then the kitchen", () => {
    expect(
      tableState([order({ status: "preparing" }), order({ status: "placed" })]),
    ).toBe("ordered");
    expect(
      tableState([order({ status: "preparing" }), order({ status: "ready" })]),
    ).toBe("ready");
    expect(tableState([order({ status: "confirmed" })])).toBe("waiting");
    expect(tableState([order({ status: "preparing" })])).toBe("waiting");
  });
});

const request = (over: Partial<StaffRequest>): StaffRequest => ({
  id: "r",
  table_id: "t1",
  type: "waiter",
  status: "open",
  created_at: "2026-11-25T12:00:00Z",
  acknowledged_at: null,
  ...over,
});

describe("tableState with service requests", () => {
  it("shows a call for the waiter above everything else", () => {
    expect(
      tableState([order({ status: "placed" })], [request({ type: "waiter" })]),
    ).toBe("called");
  });

  it("shows a bill request above orders", () => {
    expect(
      tableState([order({ status: "ready" })], [request({ type: "bill" })]),
    ).toBe("bill");
  });

  it("puts a waiter call above a bill request", () => {
    expect(
      tableState(
        [],
        [request({ type: "bill" }), request({ id: "r2", type: "waiter" })],
      ),
    ).toBe("called");
  });

  it("is unchanged when there are no requests", () => {
    expect(tableState([order({ status: "placed" })], [])).toBe("ordered");
  });
});

describe("ordersByTable", () => {
  it("groups by table, oldest first", () => {
    const map = ordersByTable([
      order({ id: "b", table_id: "t1", created_at: "2026-11-25T12:10:00Z" }),
      order({ id: "a", table_id: "t1", created_at: "2026-11-25T12:00:00Z" }),
      order({ id: "c", table_id: "t2" }),
    ]);
    expect(map.get("t1")?.map((o) => o.id)).toEqual(["a", "b"]);
    expect(map.get("t2")).toHaveLength(1);
  });
});

describe("minutesSince and ticketTone", () => {
  it("counts whole minutes and never goes negative", () => {
    const now = new Date("2026-11-25T12:10:30Z").getTime();
    expect(minutesSince("2026-11-25T12:00:00Z", now)).toBe(10);
    expect(minutesSince("2026-11-25T12:30:00Z", now)).toBe(0);
  });

  it("shifts colour at 8 and 15 minutes", () => {
    expect(ticketTone(7)).toBe("normal");
    expect(ticketTone(8)).toBe("warn");
    expect(ticketTone(15)).toBe("warn");
    expect(ticketTone(16)).toBe("late");
  });
});

describe("orderTotal", () => {
  it("adds quantity times snapshot price", () => {
    const o = order({
      order_items: [
        {
          id: "1",
          name_snapshot: "Chips",
          price_cents_snapshot: 3900,
          quantity: 2,
          note: null,
        },
        {
          id: "2",
          name_snapshot: "Soup",
          price_cents_snapshot: 5900,
          quantity: 1,
          note: null,
        },
      ],
    });
    expect(orderTotal(o)).toBe(13700);
  });
});
