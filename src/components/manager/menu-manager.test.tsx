import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuManager } from "./menu-manager";
import type { MenuCategory, MenuItem } from "@/lib/menu";

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

const api = vi.hoisted(() => ({
  loadMenu: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  setItemAvailable: vi.fn(),
  deleteItem: vi.fn(),
  createCategory: vi.fn(),
}));
vi.mock("@/lib/menu-api", () => api);

const categories: MenuCategory[] = [
  { id: "starters", name: "Starters", sort_order: 0 },
  { id: "mains", name: "Mains", sort_order: 1 },
];

const chips: MenuItem = {
  id: "chips",
  category_id: "mains",
  name: "Chips",
  description: "Hand-cut chips",
  price_cents: 3900,
  available: true,
  sort_order: 0,
};
const soup: MenuItem = {
  id: "soup",
  category_id: "starters",
  name: "Butternut soup",
  description: null,
  price_cents: 5900,
  available: false,
  sort_order: 0,
};

function loaded(
  items: MenuItem[] = [chips, soup],
  cats: MenuCategory[] = categories,
) {
  api.loadMenu.mockResolvedValue({
    restaurantId: "r1",
    categories: cats,
    items,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MenuManager", () => {
  it("shows a loading message, then the menu grouped by category with rand prices", async () => {
    loaded();
    render(<MenuManager />);
    expect(screen.getByText("Loading your menu…")).toBeInTheDocument();

    const starters = await screen.findByRole("region", { name: "Starters" });
    expect(within(starters).getByText("Butternut soup")).toBeInTheDocument();
    expect(within(starters).getByText("R59.00")).toBeInTheDocument();
    expect(within(starters).getByText("Sold out")).toBeInTheDocument();

    const mains = screen.getByRole("region", { name: "Mains" });
    expect(within(mains).getByText("R39.00")).toBeInTheDocument();
    expect(screen.getByText("2 items in 2 categories")).toBeInTheDocument();
  });

  it("shows an empty state and a retryable error", async () => {
    loaded([], []);
    const { unmount } = render(<MenuManager />);
    expect(await screen.findByText(/menu is empty/i)).toBeInTheDocument();
    unmount();

    api.loadMenu.mockRejectedValueOnce(
      new Error("Could not load menu items: network down"),
    );
    loaded();
    const user = userEvent.setup();
    render(<MenuManager />);
    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("region", { name: "Mains" }),
    ).toBeInTheDocument();
  });

  it("toggles availability and saves it", async () => {
    loaded();
    api.setItemAvailable.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MenuManager />);

    const toggle = await screen.findByRole("switch", {
      name: "Available: Chips",
    });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await user.click(toggle);

    expect(api.setItemAvailable).toHaveBeenCalledWith({}, "chips", false);
    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "Available: Chips" }),
      ).toHaveAttribute("aria-checked", "false"),
    );
  });

  it("puts the switch back and shows a message when saving availability fails", async () => {
    loaded();
    api.setItemAvailable.mockRejectedValue(
      new Error("Could not update availability: offline"),
    );
    const user = userEvent.setup();
    render(<MenuManager />);

    await user.click(
      await screen.findByRole("switch", { name: "Available: Chips" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("offline");
    expect(
      screen.getByRole("switch", { name: "Available: Chips" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("validates the form before saving a new item", async () => {
    loaded();
    const user = userEvent.setup();
    render(<MenuManager />);

    await user.click(await screen.findByRole("button", { name: "Add item" }));
    const dialog = screen.getByRole("dialog", { name: "Add item" });
    await user.click(within(dialog).getByRole("button", { name: "Add item" }));

    expect(
      within(dialog).getByText("Enter a name for the item."),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Enter a price in rand/),
    ).toBeInTheDocument();
    expect(api.createItem).not.toHaveBeenCalled();
  });

  it("creates an item with the price in cents and shows it in its category", async () => {
    loaded();
    const created: MenuItem = {
      ...chips,
      id: "new",
      name: "Malva pudding",
      price_cents: 6550,
      category_id: "mains",
      sort_order: 1,
    };
    api.createItem.mockResolvedValue(created);
    const user = userEvent.setup();
    render(<MenuManager />);

    await user.click(
      await screen.findByRole("button", { name: "Add to Mains" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Add item" });
    expect(within(dialog).getByLabelText("Category")).toHaveValue("mains");
    await user.type(within(dialog).getByLabelText("Name"), "Malva pudding");
    await user.type(within(dialog).getByLabelText("Price (rand)"), "65,50");
    await user.click(within(dialog).getByRole("button", { name: "Add item" }));

    await waitFor(() => expect(api.createItem).toHaveBeenCalledTimes(1));
    expect(api.createItem).toHaveBeenCalledWith(
      {},
      "r1",
      {
        name: "Malva pudding",
        description: null,
        price_cents: 6550,
        category_id: "mains",
        available: true,
      },
      1,
    );
    expect(await screen.findByText("Malva pudding")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens an existing item prefilled and saves edits", async () => {
    loaded();
    api.updateItem.mockResolvedValue({ ...chips, price_cents: 4200 });
    const user = userEvent.setup();
    render(<MenuManager />);

    await user.click(await screen.findByRole("button", { name: "Edit Chips" }));
    const dialog = screen.getByRole("dialog", { name: "Edit item" });
    expect(within(dialog).getByLabelText("Name")).toHaveValue("Chips");
    expect(within(dialog).getByLabelText("Price (rand)")).toHaveValue("39.00");

    const price = within(dialog).getByLabelText("Price (rand)");
    await user.clear(price);
    await user.type(price, "42");
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() => expect(api.updateItem).toHaveBeenCalled());
    expect(api.updateItem.mock.calls[0][1]).toBe("chips");
    expect(api.updateItem.mock.calls[0][2]).toMatchObject({
      price_cents: 4200,
    });
    expect(await screen.findByText("R42.00")).toBeInTheDocument();
  });

  it("asks for confirmation before deleting an item", async () => {
    loaded();
    api.deleteItem.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MenuManager />);

    await user.click(await screen.findByRole("button", { name: "Edit Chips" }));
    const dialog = screen.getByRole("dialog", { name: "Edit item" });
    await user.click(
      within(dialog).getByRole("button", { name: "Delete item" }),
    );
    expect(api.deleteItem).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", { name: "Yes, delete" }),
    );
    await waitFor(() =>
      expect(api.deleteItem).toHaveBeenCalledWith({}, "chips"),
    );
    await waitFor(() =>
      expect(screen.queryByText("Hand-cut chips")).not.toBeInTheDocument(),
    );
  });

  it("shows the error inside the drawer when saving fails and keeps it open", async () => {
    loaded();
    api.updateItem.mockRejectedValue(
      new Error("Could not save the item: permission denied"),
    );
    const user = userEvent.setup();
    render(<MenuManager />);

    await user.click(await screen.findByRole("button", { name: "Edit Chips" }));
    const dialog = screen.getByRole("dialog", { name: "Edit item" });
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "permission denied",
    );
    expect(
      screen.getByRole("dialog", { name: "Edit item" }),
    ).toBeInTheDocument();
  });

  it("closes the drawer with the Escape key", async () => {
    loaded();
    const user = userEvent.setup();
    render(<MenuManager />);
    await user.click(await screen.findByRole("button", { name: "Add item" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("adds a category", async () => {
    loaded();
    api.createCategory.mockResolvedValue({
      id: "desserts",
      name: "Desserts",
      sort_order: 2,
    });
    const user = userEvent.setup();
    render(<MenuManager />);

    await user.type(await screen.findByLabelText("New category"), "Desserts");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    await waitFor(() =>
      expect(api.createCategory).toHaveBeenCalledWith({}, "r1", "Desserts", 2),
    );
    expect(
      await screen.findByRole("region", { name: "Desserts" }),
    ).toBeInTheDocument();
  });
});
