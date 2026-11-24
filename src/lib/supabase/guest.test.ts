import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureGuestSession } from "./guest";

function fakeClient(opts: {
  session?: { user: { id: string } } | null;
  anon?: unknown;
}) {
  const signInAnonymously = vi
    .fn()
    .mockResolvedValue(
      opts.anon ?? { data: { user: { id: "new" } }, error: null },
    );
  const client = {
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: opts.session ?? null } }),
      signInAnonymously,
    },
  } as unknown as SupabaseClient;
  return { client, signInAnonymously };
}

describe("ensureGuestSession", () => {
  it("re-uses an existing session", async () => {
    const { client, signInAnonymously } = fakeClient({
      session: { user: { id: "existing" } },
    });
    await expect(ensureGuestSession(client)).resolves.toEqual({
      id: "existing",
    });
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("signs in anonymously when there is no session", async () => {
    const { client, signInAnonymously } = fakeClient({});
    await expect(ensureGuestSession(client)).resolves.toEqual({ id: "new" });
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it("throws a readable error when anonymous sign-in fails", async () => {
    const { client } = fakeClient({
      anon: {
        data: { user: null },
        error: { message: "Anonymous sign-ins are disabled" },
      },
    });
    await expect(ensureGuestSession(client)).rejects.toThrow(
      "Anonymous sign-ins are disabled",
    );
  });
});
