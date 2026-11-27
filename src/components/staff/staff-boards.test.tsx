import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaiterBoard } from "./waiter-board";
import { KitchenBoard } from "./kitchen-board";
import type { FloorTable, StaffOrder, StaffRequest } from "@/lib/floor";

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

const api = vi.hoisted(() => ({
  loadFloor: vi.fn(),
  setOrderStatus: vi.fn(),
  setItemQuantity: vi.fn(),
  removeItem: vi.fn(),
  setRequestStatus: vi.fn(),
  subscribeToFloor: vi.fn(),
}));
vi.mock("@/lib/staff-api", () => api);

const tables: FloorTable[] = [
  { id: "t1", label: "Table 1", area: "Main dining", seats: 2 },
  { id: "t2", label: "Table 2", area: "Main dining", seats: 4 },
  { id: "c1", label: "Courtyard 1", area: "Courtyard", seats: 4 },
];

const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

const order = (over: Partial<StaffOrder>): StaffOrder => ({
  id: "o1",
  table_id: "t1",
  status: "placed",
  notes: null,
  created_at: minutesAgo(3),
  confirmed_at: null,
  ready_at: null,
  order_items: [
    {
      id: "i1",
      name_snapshot: "Beef burger",
      price_cents_snapshot: 12900,
      quantity: 2,
      note: "no onions",
    },
  ],
  ...over,
});

let onChange: () => void;

const request = (over: Partial<StaffRequest> = {}): StaffRequest => ({
  id: "r1",
  table_id: "t1",
  type: "waiter",
  status: "open",
  created_at: minutesAgo(4),
  acknowledged_at: null,
  ...over,
});

function floor(orders: StaffOrder[], requests: StaffRequest[] = []) {
  api.loadFloor.mockResolvedValue({ tables, orders, requests });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.setOrderStatus.mockResolvedValue(undefined);
  api.setItemQuantity.mockResolvedValue(undefined);
  api.removeItem.mockResolvedValue(undefined);
  api.setRequestStatus.mockResolvedValue(undefined);
  api.subscribeToFloor.mockImplementation(
    (_client: unknown, cb: () => void) => {
      onChange = cb;
      return () => {};
    },
  );
});

describe("WaiterBoard", () => {
  it("shows tables by area with their state, and lists new orders first", async () => {
    floor([
      order({}),
      order({ id: "o2", table_id: "t2", status: "ready" }),
      order({ id: "o3", table_id: "c1", status: "preparing" }),
    ]);
    render(<WaiterBoard />);
    expect(screen.getByText("Loading the floor…")).toBeInTheDocument();

    expect(
      await screen.findByRole("button", { name: "Table 1, New order" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Table 2, Ready to serve" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Courtyard 1, In kitchen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "New orders" }),
    ).toHaveTextContent("Table 1");
    expect(
      screen.getByRole("region", { name: "New orders" }),
    ).toHaveTextContent("2 items");
  });

  it("shows an empty table and 'no new orders' when quiet", async () => {
    floor([]);
    render(<WaiterBoard />);
    expect(
      await screen.findByRole("button", { name: "Table 1, Empty" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No new orders waiting.")).toBeInTheDocument();
  });

  it("confirms a new order and sends it to the kitchen", async () => {
    floor([order({})]);
    const user = userEvent.setup();
    render(<WaiterBoard />);

    await user.click(
      await screen.findByRole("button", { name: "Table 1, New order" }),
    );
    const drawer = screen.getByRole("dialog", { name: "Table 1" });
    expect(within(drawer).getByText("no onions")).toBeInTheDocument();
    expect(within(drawer).getByText("R258.00")).toBeInTheDocument();
    await user.click(
      within(drawer).getByRole("button", {
        name: "Confirm and send to kitchen",
      }),
    );

    await waitFor(() =>
      expect(api.setOrderStatus).toHaveBeenCalledWith({}, "o1", "confirmed"),
    );
  });

  it("lets the waiter change quantities and delete items before the order is confirmed", async () => {
    floor([order({})]);
    const user = userEvent.setup();
    render(<WaiterBoard />);
    await user.click(
      await screen.findByRole("button", { name: "Table 1, New order" }),
    );
    const drawer = screen.getByRole("dialog");

    await user.click(
      within(drawer).getByRole("button", { name: "Remove one Beef burger" }),
    );
    expect(api.setItemQuantity).toHaveBeenCalledWith({}, "i1", 1);
    await user.click(
      within(drawer).getByRole("button", { name: "Delete Beef burger" }),
    );
    expect(api.removeItem).toHaveBeenCalledWith({}, "i1");
  });

  it("does not offer item editing once an order is confirmed", async () => {
    floor([order({ status: "confirmed" })]);
    const user = userEvent.setup();
    render(<WaiterBoard />);
    await user.click(
      await screen.findByRole("button", { name: "Table 1, In kitchen" }),
    );
    const drawer = screen.getByRole("dialog");
    expect(
      within(drawer).queryByRole("button", { name: /Delete Beef burger/ }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: "Cancel order" }),
    ).toBeInTheDocument();
  });

  it("cancels only after confirmation", async () => {
    floor([order({})]);
    const user = userEvent.setup();
    render(<WaiterBoard />);
    await user.click(
      await screen.findByRole("button", { name: "Table 1, New order" }),
    );
    const drawer = screen.getByRole("dialog");

    await user.click(
      within(drawer).getByRole("button", { name: "Cancel order" }),
    );
    expect(api.setOrderStatus).not.toHaveBeenCalled();
    await user.click(
      within(drawer).getByRole("button", { name: "Yes, cancel" }),
    );
    await waitFor(() =>
      expect(api.setOrderStatus).toHaveBeenCalledWith({}, "o1", "cancelled"),
    );
  });

  it("marks ready food as served", async () => {
    floor([order({ status: "ready" })]);
    const user = userEvent.setup();
    render(<WaiterBoard />);
    await user.click(
      await screen.findByRole("button", { name: "Table 1, Ready to serve" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Mark served",
      }),
    );
    await waitFor(() =>
      expect(api.setOrderStatus).toHaveBeenCalledWith({}, "o1", "served"),
    );
  });

  it("shows a message when someone else already changed the order", async () => {
    floor([order({})]);
    api.setOrderStatus.mockRejectedValue(
      new Error(
        "That order was just changed by someone else. The list has been refreshed.",
      ),
    );
    const user = userEvent.setup();
    render(<WaiterBoard />);
    await user.click(
      await screen.findByRole("button", { name: "Table 1, New order" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirm and send to kitchen",
      }),
    );
    expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent(
      "changed by someone else",
    );
  });

  it("reloads when a live update arrives", async () => {
    floor([]);
    render(<WaiterBoard />);
    await screen.findByRole("button", { name: "Table 1, Empty" });

    floor([order({})]);
    await act(async () => onChange());
    expect(
      await screen.findByRole("button", { name: "Table 1, New order" }),
    ).toBeInTheDocument();
  });
});

describe("WaiterBoard requests", () => {
  it("lists guest requests with how long they have waited", async () => {
    floor(
      [],
      [
        request({ type: "waiter" }),
        request({
          id: "r2",
          table_id: "t2",
          type: "bill",
          created_at: minutesAgo(9),
        }),
      ],
    );
    render(<WaiterBoard />);

    const list = await screen.findByRole("region", { name: "Requests" });
    const items = within(list).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Table 2: Bill");
    expect(items[0]).toHaveTextContent("waiting 9 min");
    expect(items[1]).toHaveTextContent("Table 1: Call waiter");
  });

  it("shows an empty message when nobody needs the waiter", async () => {
    floor([]);
    render(<WaiterBoard />);
    expect(
      await screen.findByText("No guests are asking for you."),
    ).toBeInTheDocument();
  });

  it("acknowledges a request, then resolves it", async () => {
    floor([], [request()]);
    const user = userEvent.setup();
    render(<WaiterBoard />);

    await user.click(
      await screen.findByRole("button", { name: "On my way to Table 1" }),
    );
    expect(api.setRequestStatus).toHaveBeenCalledWith({}, "r1", "acknowledged");
    await user.click(
      screen.getByRole("button", { name: "Done with Table 1 waiter" }),
    );
    expect(api.setRequestStatus).toHaveBeenCalledWith({}, "r1", "resolved");
  });

  it("does not offer 'On my way' once a request is acknowledged", async () => {
    floor(
      [],
      [request({ status: "acknowledged", acknowledged_at: minutesAgo(1) })],
    );
    render(<WaiterBoard />);
    const list = await screen.findByRole("region", { name: "Requests" });
    expect(
      within(list).queryByRole("button", { name: /On my way/ }),
    ).not.toBeInTheDocument();
    expect(within(list).getByText(/on the way/)).toBeInTheDocument();
  });

  it("marks tables on the floor as needing the waiter or asking for the bill", async () => {
    floor(
      [],
      [
        request({ table_id: "t1", type: "waiter" }),
        request({ id: "r2", table_id: "t2", type: "bill" }),
      ],
    );
    render(<WaiterBoard />);
    expect(
      await screen.findByRole("button", { name: "Table 1, Needs waiter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Table 2, Bill requested" }),
    ).toBeInTheDocument();
  });

  it("shows a message when someone else already handled the request", async () => {
    floor([], [request()]);
    api.setRequestStatus.mockRejectedValue(
      new Error(
        "That request was just handled by someone else. The list has been refreshed.",
      ),
    );
    const user = userEvent.setup();
    render(<WaiterBoard />);
    await user.click(
      await screen.findByRole("button", { name: "Done with Table 1 waiter" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "handled by someone else",
    );
  });
});

describe("KitchenBoard", () => {
  it("shows confirmed orders as New, with notes, and ignores unconfirmed orders", async () => {
    floor([
      order({
        id: "n",
        status: "confirmed",
        confirmed_at: minutesAgo(2),
        notes: "nut allergy",
      }),
      order({ id: "p", table_id: "t2", status: "placed" }),
    ]);
    render(<KitchenBoard />);

    const column = await screen.findByRole("region", { name: "New" });
    expect(within(column).getByText("Table 1")).toBeInTheDocument();
    expect(within(column).getByText(/Beef burger/)).toBeInTheDocument();
    expect(within(column).getByText("no onions")).toBeInTheDocument();
    expect(within(column).getByText("nut allergy")).toBeInTheDocument();
    expect(within(column).getByText("2 min")).toBeInTheDocument();
    expect(screen.queryByText("Table 2")).not.toBeInTheDocument();
  });

  it("moves a ticket from New to Preparing to Ready", async () => {
    floor([
      order({ id: "a", status: "confirmed", confirmed_at: minutesAgo(1) }),
      order({
        id: "b",
        table_id: "t2",
        status: "preparing",
        confirmed_at: minutesAgo(5),
      }),
    ]);
    const user = userEvent.setup();
    render(<KitchenBoard />);

    await user.click(
      await screen.findByRole("button", { name: "Start preparing" }),
    );
    expect(api.setOrderStatus).toHaveBeenCalledWith({}, "a", "preparing");
    await user.click(screen.getByRole("button", { name: "Mark ready" }));
    expect(api.setOrderStatus).toHaveBeenCalledWith({}, "b", "ready");
  });

  it("highlights late tickets and gives ready tickets no kitchen action", async () => {
    floor([
      order({ id: "late", status: "preparing", confirmed_at: minutesAgo(20) }),
      order({
        id: "done",
        table_id: "t2",
        status: "ready",
        ready_at: minutesAgo(1),
      }),
    ]);
    render(<KitchenBoard />);

    const preparing = await screen.findByRole("region", { name: "Preparing" });
    expect(within(preparing).getByText("20 min")).toHaveClass("bg-terracotta");
    const ready = screen.getByRole("region", { name: "Ready for pass" });
    expect(within(ready).queryByRole("button")).not.toBeInTheDocument();
    expect(
      within(ready).getByText(/Waiting for the waiter/),
    ).toBeInTheDocument();
  });

  it("shows the conflict message when the waiter cancelled the order first", async () => {
    floor([order({ status: "confirmed", confirmed_at: minutesAgo(1) })]);
    api.setOrderStatus.mockRejectedValue(
      new Error(
        "That order was just changed by someone else. The list has been refreshed.",
      ),
    );
    const user = userEvent.setup();
    render(<KitchenBoard />);
    await user.click(
      await screen.findByRole("button", { name: "Start preparing" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "changed by someone else",
    );
  });
});
