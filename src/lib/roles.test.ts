import { describe, expect, it } from "vitest";
import { canAccess, decideRoute, isStaffRole } from "./roles";

describe("isStaffRole", () => {
  it("accepts the three staff roles and nothing else", () => {
    expect(isStaffRole("waiter")).toBe(true);
    expect(isStaffRole("kitchen")).toBe(true);
    expect(isStaffRole("manager")).toBe(true);
    expect(isStaffRole("guest")).toBe(false);
    expect(isStaffRole(null)).toBe(false);
  });
});

describe("canAccess", () => {
  it("keeps waiters and kitchen in their own area", () => {
    expect(canAccess("waiter", "/waiter")).toBe(true);
    expect(canAccess("waiter", "/kitchen")).toBe(false);
    expect(canAccess("kitchen", "/kitchen/orders")).toBe(true);
    expect(canAccess("kitchen", "/manager")).toBe(false);
  });

  it("lets managers open every area", () => {
    expect(canAccess("manager", "/waiter")).toBe(true);
    expect(canAccess("manager", "/kitchen")).toBe(true);
    expect(canAccess("manager", "/manager/menu")).toBe(true);
  });

  it("does not treat a similar prefix as the same area", () => {
    expect(canAccess("waiter", "/waiters-union")).toBe(false);
  });
});

describe("decideRoute", () => {
  it("sends signed-out visitors from staff areas to the login page", () => {
    expect(
      decideRoute({ pathname: "/manager", signedIn: false, role: null }),
    ).toBe("/login");
  });

  it("sends signed-in users without a staff profile (such as guests) to login", () => {
    expect(
      decideRoute({ pathname: "/waiter", signedIn: true, role: null }),
    ).toBe("/login");
  });

  it("sends a staff member to their own home when they open another area", () => {
    expect(
      decideRoute({ pathname: "/manager", signedIn: true, role: "waiter" }),
    ).toBe("/waiter");
  });

  it("lets the right role through", () => {
    expect(
      decideRoute({ pathname: "/kitchen", signedIn: true, role: "kitchen" }),
    ).toBeNull();
  });

  it("skips the login page for signed-in staff", () => {
    expect(
      decideRoute({ pathname: "/login", signedIn: true, role: "kitchen" }),
    ).toBe("/kitchen");
    expect(
      decideRoute({ pathname: "/login", signedIn: false, role: null }),
    ).toBeNull();
  });

  it("ignores public pages", () => {
    expect(
      decideRoute({ pathname: "/", signedIn: false, role: null }),
    ).toBeNull();
  });
});
