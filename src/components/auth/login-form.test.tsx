import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

const signInWithPassword = vi.fn();
const signOut = vi.fn();
const maybeSingle = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword, signOut },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "waiter@tafole.test");
  await user.type(screen.getByLabelText("Password"), "secret-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

beforeEach(() => vi.clearAllMocks());

describe("LoginForm", () => {
  it("asks for both fields before calling Supabase", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter your email and password.",
    );
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("shows a friendly message for wrong credentials", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: {
        code: "invalid_credentials",
        message: "Invalid login credentials",
      },
    });
    render(<LoginForm />);
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wrong email or password.",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("tells the user when the email is not confirmed", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "email_not_confirmed", message: "Email not confirmed" },
    });
    render(<LoginForm />);
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("not confirmed");
  });

  it("shows the real message for other failures such as a bad API key", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "invalid_api_key", message: "Invalid API key" },
    });
    render(<LoginForm />);
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not sign in: Invalid API key",
    );
  });

  it("sends each role to its own screen", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({ data: { role: "kitchen" } });
    render(<LoginForm />);
    await fillAndSubmit();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/kitchen"));
  });

  it("signs out accounts that have no staff profile", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: { id: "guest" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({ data: null });
    render(<LoginForm />);
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "not linked to a restaurant",
    );
    expect(signOut).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
