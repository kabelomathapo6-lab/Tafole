import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("getSupabaseEnv", () => {
  it("returns the url and key when both are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
    expect(getSupabaseEnv()).toEqual({
      url: "https://x.supabase.co",
      key: "sb_publishable_abc",
    });
  });

  it("throws a helpful error when a value is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => getSupabaseEnv()).toThrow(/\.env\.local/);
  });
});
