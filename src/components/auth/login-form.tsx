"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { isStaffRole, STAFF_HOME } from "@/lib/roles";

function messageForSignInError(
  error: { code?: string; message?: string } | null,
) {
  switch (error?.code) {
    case "invalid_credentials":
      return "Wrong email or password.";
    case "email_not_confirmed":
      return "This account's email is not confirmed yet. Ask your manager to confirm it.";
    default:
      return error?.message
        ? `Could not sign in: ${error.message}`
        : "Something went wrong. Try again.";
  }
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      if (signInError || !data.user) {
        setError(messageForSignInError(signInError));
        return;
      }

      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!isStaffRole(profile?.role)) {
        await supabase.auth.signOut();
        setError(
          "This account is not linked to a restaurant. Ask your manager for access.",
        );
        return;
      }

      router.replace(STAFF_HOME[profile.role]);
      router.refresh();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? (
        <p
          role="alert"
          className="rounded-control bg-status-error-soft px-4 py-3 text-sm text-status-error"
        >
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
