import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Guests have no account. When a QR code is scanned we sign them in anonymously so the database
 * can tie orders to their table session. Re-uses the existing session when there is one.
 */
export async function ensureGuestSession(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;

  const { data: created, error } = await supabase.auth.signInAnonymously();
  if (error || !created.user) {
    throw new Error(error?.message ?? "Could not start a guest session");
  }
  return created.user;
}
