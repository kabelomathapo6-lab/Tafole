import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuestApp } from "./guest-app";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import type { GuestOrder } from "@/lib/guest-api";

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));
vi.mock("@/lib/supabase/guest", () => ({
  ensureGuestSession: vi.fn().mockResolvedValue({ id: "guest" }),
}));

const api = vi.hoisted(() => {
  class InvalidTableError extends Error {}
  return {
    InvalidTableError,
    startSession: vi.fn(),
    loadGuestMenu: vi.fn(),
    loadOrders: vi.fn(),
    placeOrder: vi.fn(),
    subscribeToOrders: vi.fn(),
  };
});
vi.mock("@/lib/guest-api", () => api);

const TOKEN = "11111111-2222-3333-4444-555555555555";

const categories: MenuCategory[] = [
  { id: "starters", name: "Starters", sort_order: 0 },
  { id: "mains", name: "Mains", sort_order: 1 },
];
const item = (over: Partial<MenuItem>): MenuItem => ({
  id: "x",
  category_id: "mains",
  name: "Item",
  description: null,
  price_cents: 1000,
  available: true,
  sort_order: 0,
  ...over,
});
const soup = item({
  id: "soup",
  category_id: "starters",
  name: "Butternut soup",
  price_cents: 5900,
});
const burger = item({
  id: "burger",
  name: "Beef burger",
  description: "180g patty",
  price_cents: 12900,
});
const lamb = item({
  id: "lamb",
  name: "Lamb shank",
  price_cents: 19500,
  available: false,
  sort_order: 1,
});

const order = (over: Partial<GuestOrder> = {}): GuestOrder => ({
  id: "o1",
  status: "placed",
  notes: null,
  created_at: "2026-11-25T12:00:00Z",
  order_items: [
    {
      id: "oi1",
      name_snapshot: "Beef burger",
      price_cents_snapshot: 12900,
      quantity: 1,
      note: null,
    },
  ],
  ...over,
});

let onOrderChange: () => void;

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  api.startSession.mockResolvedValue({
    id: "s1",
    restaurantId: "r1",
    tableId: "t1",
  });
  api.loadGuestMenu.mockResolvedValue({
    restaurantName: "Tafole Demo Kitchen",
    tableLabel: "Table 7",
    categories,
    items: [soup, burger, lamb],
  });
  api.loadOrders.mockResolvedValue([]);
  api.subscribeToOrders.mockImplementation(
    (_client: unknown, _id: string, cb: () => void) => {
      onOrderChange = cb;
      return () => {};
    },
  );
});

describe("GuestApp", () => {
  it("shows a friendly message for a malformed code without calling the server", () => {
    render(<GuestApp token="not-a-real-code" />);
    expect(
      screen.getByRole("heading", { name: /isn.t working/ }),
    ).toBeInTheDocument();
    expect(api.startSession).not.toHaveBeenCalled();
  });

  it("shows the same message when the table is unknown or its code was reset", async () => {
    api.startSession.mockRejectedValue(new api.InvalidTableError());
    render(<GuestApp token={TOKEN} />);
    expect(
      await screen.findByRole("heading", { name: /isn.t working/ }),
    ).toBeInTheDocument();
  });

  it("shows an error with a retry when the session cannot start", async () => {
    api.startSession.mockRejectedValueOnce(
      new Error("Could not start your table session: offline"),
    );
    const user = userEvent.setup();
    render(<GuestApp token={TOKEN} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("offline");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Tafole Demo Kitchen")).toBeInTheDocument();
  });

  it("shows the restaurant, the table and the menu with prices", async () => {
    render(<GuestApp token={TOKEN} />);
    expect(screen.getByText("Opening your table…")).toBeInTheDocument();

    expect(await screen.findByText("Tafole Demo Kitchen")).toBeInTheDocument();
    expect(screen.getByText("Table 7")).toBeInTheDocument();
    const mains = screen.getByRole("region", { name: "Mains" });
    expect(within(mains).getByText("R129.00")).toBeInTheDocument();
    expect(within(mains).getByText("Sold out")).toBeInTheDocument();
    expect(
      within(mains).queryByRole("button", { name: "Add Lamb shank" }),
    ).not.toBeInTheDocument();
  });

  it("filters the menu by category", async () => {
    const user = userEvent.setup();
    render(<GuestApp token={TOKEN} />);
    await screen.findByText("Tafole Demo Kitchen");

    await user.click(screen.getByRole("button", { name: "Starters" }));
    expect(
      screen.getByRole("region", { name: "Starters" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Mains" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByRole("region", { name: "Mains" })).toBeInTheDocument();
  });

  it("builds a cart with a running total and quantity steppers", async () => {
    const user = userEvent.setup();
    render(<GuestApp token={TOKEN} />);
    await screen.findByText("Tafole Demo Kitchen");

    await user.click(screen.getByRole("button", { name: "Add Beef burger" }));
    await user.click(
      screen.getByRole("button", { name: "Add one more Beef burger" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Add Butternut soup" }),
    );

    const bar = screen.getByRole("button", { name: /View order/ });
    expect(bar).toHaveTextContent("3");
    expect(bar).toHaveTextContent("R317.00");

    await user.click(
      screen.getByRole("button", { name: "Remove one Butternut soup" }),
    );
    expect(
      screen.getByRole("button", { name: /View order/ }),
    ).toHaveTextContent("R258.00");
  });

  it("sends the order without prices, then shows it as sent", async () => {
    api.placeOrder.mockResolvedValue("o1");
    api.loadOrders.mockResolvedValueOnce([]).mockResolvedValue([order()]);
    const user = userEvent.setup();
    render(<GuestApp token={TOKEN} />);
    await screen.findByText("Tafole Demo Kitchen");

    await user.click(screen.getByRole("button", { name: "Add Beef burger" }));
    await user.click(screen.getByRole("button", { name: /View order/ }));
    const sheet = screen.getByRole("dialog", { name: "Your order" });
    await user.type(
      within(sheet).getByLabelText("Note for Beef burger"),
      "no onions",
    );
    await user.type(
      within(sheet).getByLabelText("Allergies or other notes"),
      "nut allergy",
    );
    await user.click(
      within(sheet).getByRole("button", { name: "Place order" }),
    );

    await waitFor(() => expect(api.placeOrder).toHaveBeenCalledTimes(1));
    expect(api.placeOrder).toHaveBeenCalledWith(
      {},
      "s1",
      [{ menu_item_id: "burger", quantity: 1, note: "no onions" }],
      "nut allergy",
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Order sent!");
    expect(
      screen.getByRole("list", { name: "Order progress" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /View order/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps the cart and shows the message when the order fails", async () => {
    api.placeOrder.mockRejectedValue(
      new Error(
        "One of the items just sold out. Please check your order and try again.",
      ),
    );
    const user = userEvent.setup();
    render(<GuestApp token={TOKEN} />);
    await screen.findByText("Tafole Demo Kitchen");

    await user.click(screen.getByRole("button", { name: "Add Beef burger" }));
    await user.click(screen.getByRole("button", { name: /View order/ }));
    const sheet = screen.getByRole("dialog", { name: "Your order" });
    await user.click(
      within(sheet).getByRole("button", { name: "Place order" }),
    );

    expect(await within(sheet).findByRole("alert")).toHaveTextContent(
      "just sold out",
    );
    expect(
      within(sheet).getByRole("button", { name: "Place order" }),
    ).toBeEnabled();
    expect(within(sheet).getByText("Beef burger")).toBeInTheDocument();
  });

  it("restores the cart after a page refresh and drops items that sold out meanwhile", async () => {
    window.sessionStorage.setItem(
      `tafole-cart-${TOKEN}`,
      JSON.stringify([
        {
          itemId: "burger",
          name: "Beef burger",
          price_cents: 12900,
          quantity: 2,
          note: "",
        },
        {
          itemId: "lamb",
          name: "Lamb shank",
          price_cents: 19500,
          quantity: 1,
          note: "",
        },
      ]),
    );
    render(<GuestApp token={TOKEN} />);
    const bar = await screen.findByRole("button", { name: /View order/ });
    expect(bar).toHaveTextContent("2");
    expect(bar).toHaveTextContent("R258.00");
  });

  it("updates the order status when the kitchen moves it along", async () => {
    api.loadOrders.mockResolvedValue([order({ status: "placed" })]);
    const user = userEvent.setup();
    render(<GuestApp token={TOKEN} />);
    await user.click(await screen.findByRole("button", { name: /My orders/ }));
    expect(
      screen.getByText("Order sent. Your waiter will confirm it shortly."),
    ).toBeInTheDocument();

    api.loadOrders.mockResolvedValue([order({ status: "preparing" })]);
    await act(async () => onOrderChange());
    expect(
      await screen.findByText("The kitchen is preparing your order."),
    ).toBeInTheDocument();
  });

  it("shows cancelled orders clearly", async () => {
    api.loadOrders.mockResolvedValue([order({ status: "cancelled" })]);
    const user = userEvent.setup();
    render(<GuestApp token={TOKEN} />);
    await user.click(await screen.findByRole("button", { name: /My orders/ }));
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Order progress" }),
    ).not.toBeInTheDocument();
  });
});
