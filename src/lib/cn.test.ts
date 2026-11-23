import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins class names and skips falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });

  it("lets the last conflicting Tailwind utility win", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
