import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TablesManager } from "./tables-manager";
import { PrintSheet } from "./print-sheet";
import type { RestaurantTable } from "@/lib/tables";

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

const api = vi.hoisted(() => ({
  loadTables: vi.fn(),
  createTable: vi.fn(),
  updateTable: vi.fn(),
  resetQrToken: vi.fn(),
  deleteTable: vi.fn(),
}));
vi.mock("@/lib/tables-api", () => api);

const t1: RestaurantTable = {
  id: "t1",
  label: "Table 1",
  area: "Main dining",
  seats: 2,
  qr_token: "tok-1",
};
const t10: RestaurantTable = {
  id: "t10",
  label: "Table 10",
  area: "Main dining",
  seats: 6,
  qr_token: "tok-10",
};
const c1: RestaurantTable = {
  id: "c1",
  label: "Courtyard 1",
  area: "Courtyard",
  seats: 4,
  qr_token: "tok-c1",
};

function loaded(tables: RestaurantTable[] = [t10, t1, c1]) {
  api.loadTables.mockResolvedValue({
    restaurantId: "r1",
    restaurantName: "Tafole Demo Kitchen",
    tables,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("TablesManager", () => {
  it("groups tables by area with seat counts", async () => {
    loaded();
    render(<TablesManager />);
    expect(screen.getByText("Loading your tables…")).toBeInTheDocument();

    const main = await screen.findByRole("region", { name: "Main dining" });
    const buttons = within(main).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Open Table 1",
      "Open Table 10",
    ]);
    expect(within(main).getByText("6 seats")).toBeInTheDocument();
    expect(screen.getByText("3 tables")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Print QR codes" }),
    ).toHaveAttribute("href", "/manager/tables/print");
  });

  it("shows an empty state without a print link, and a retryable error", async () => {
    loaded([]);
    const { unmount } = render(<TablesManager />);
    expect(await screen.findByText(/No tables yet/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Print QR codes" }),
    ).not.toBeInTheDocument();
    unmount();

    api.loadTables.mockRejectedValueOnce(
      new Error("Could not load tables: offline"),
    );
    loaded();
    const user = userEvent.setup();
    render(<TablesManager />);
    expect(await screen.findByRole("alert")).toHaveTextContent("offline");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("region", { name: "Courtyard" }),
    ).toBeInTheDocument();
  });

  it("validates the form, then creates a table", async () => {
    loaded();
    const created: RestaurantTable = {
      id: "n",
      label: "Patio 1",
      area: "Patio",
      seats: 4,
      qr_token: "tok-n",
    };
    api.createTable.mockResolvedValue(created);
    const user = userEvent.setup();
    render(<TablesManager />);

    await user.click(await screen.findByRole("button", { name: "Add table" }));
    const dialog = screen.getByRole("dialog", { name: "Add table" });
    await user.clear(within(dialog).getByLabelText("Seats"));
    await user.type(within(dialog).getByLabelText("Seats"), "99");
    await user.click(within(dialog).getByRole("button", { name: "Add table" }));
    expect(
      within(dialog).getByText("Enter a name, like Table 7."),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/from 1 to 50/)).toBeInTheDocument();
    expect(api.createTable).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("Name"), "Patio 1");
    await user.type(within(dialog).getByLabelText("Area"), "Patio");
    await user.clear(within(dialog).getByLabelText("Seats"));
    await user.type(within(dialog).getByLabelText("Seats"), "4");
    await user.click(within(dialog).getByRole("button", { name: "Add table" }));

    await waitFor(() =>
      expect(api.createTable).toHaveBeenCalledWith({}, "r1", {
        label: "Patio 1",
        area: "Patio",
        seats: 4,
      }),
    );
    expect(
      await screen.findByRole("region", { name: "Patio" }),
    ).toBeInTheDocument();
  });

  it("shows a duplicate-name error inside the drawer", async () => {
    loaded();
    api.createTable.mockRejectedValue(
      new Error("A table with that name already exists."),
    );
    const user = userEvent.setup();
    render(<TablesManager />);

    await user.click(await screen.findByRole("button", { name: "Add table" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "Table 1");
    await user.click(within(dialog).getByRole("button", { name: "Add table" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "already exists",
    );
  });

  it("shows the table's scan address and QR code when opened", async () => {
    loaded();
    const user = userEvent.setup();
    render(<TablesManager />);

    await user.click(
      await screen.findByRole("button", { name: "Open Table 1" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Table 1" });
    expect(within(dialog).getByText(/\/t\/tok-1$/)).toBeInTheDocument();
    expect(
      within(dialog).getByTitle("QR code for Table 1"),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Name")).toHaveValue("Table 1");
  });

  it("resets the QR code only after confirmation and shows the new address", async () => {
    loaded();
    api.resetQrToken.mockResolvedValue({ ...t1, qr_token: "tok-new" });
    const user = userEvent.setup();
    render(<TablesManager />);

    await user.click(
      await screen.findByRole("button", { name: "Open Table 1" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Reset QR code" }),
    );
    expect(api.resetQrToken).not.toHaveBeenCalled();
    await user.click(
      within(dialog).getByRole("button", { name: "Yes, reset" }),
    );

    await waitFor(() =>
      expect(api.resetQrToken).toHaveBeenCalledWith({}, "t1"),
    );
    expect(
      await within(screen.getByRole("dialog")).findByText(/\/t\/tok-new$/),
    ).toBeInTheDocument();
  });

  it("deletes a table only after confirmation", async () => {
    loaded();
    api.deleteTable.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TablesManager />);

    await user.click(
      await screen.findByRole("button", { name: "Open Table 1" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Delete table" }),
    );
    expect(api.deleteTable).not.toHaveBeenCalled();
    await user.click(
      within(dialog).getByRole("button", { name: "Yes, delete" }),
    );

    await waitFor(() => expect(api.deleteTable).toHaveBeenCalledWith({}, "t1"));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Open Table 1" }),
      ).not.toBeInTheDocument(),
    );
  });
});

describe("PrintSheet", () => {
  it("renders one QR code per table and prints on request", async () => {
    loaded();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<PrintSheet />);

    expect(
      await screen.findByText(
        "3 QR codes. Choose Save as PDF in the print window to export them.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Scan to order")).toHaveLength(3);
    expect(screen.getAllByText("Tafole Demo Kitchen")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Print" }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("tells the manager to add tables first when there are none", async () => {
    loaded([]);
    render(<PrintSheet />);
    expect(await screen.findByText(/Add tables first/)).toBeInTheDocument();
  });
});
