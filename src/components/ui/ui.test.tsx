import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Chip, Input, StatusPill, TableBadge } from "./index";

describe("Button", () => {
  it("renders as type=button by default so it never submits a form by accident", () => {
    render(<Button>Add</Button>);
    expect(screen.getByRole("button", { name: "Add" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("calls onClick, and not when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses the terracotta style for the urgent variant", () => {
    render(<Button variant="urgent">Call waiter</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-terracotta");
  });
});

describe("Chip", () => {
  it("exposes its active state to assistive tech", () => {
    render(<Chip active>Starters</Chip>);
    expect(screen.getByRole("button", { name: "Starters" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("Input", () => {
  it("links the label to the input", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("marks the input invalid and shows the error message", () => {
    render(<Input label="Email" error="Enter a valid email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email");
  });
});

describe("StatusPill and TableBadge", () => {
  it("shows a default label for each status", () => {
    render(<StatusPill status="bill" />);
    expect(screen.getByText("Bill requested")).toBeInTheDocument();
  });

  it("allows a custom label", () => {
    render(<StatusPill status="ready">Delivered</StatusPill>);
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("renders the table badge text", () => {
    render(<TableBadge>Table 7</TableBadge>);
    expect(screen.getByText("Table 7")).toBeInTheDocument();
  });
});
