import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Staff sign in | Tafole" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <p className="font-display text-sm font-semibold tracking-wide text-terracotta">
          Tafole
        </p>
        <h1 className="font-display text-[26px] leading-8 font-bold">
          Staff sign in
        </h1>
        <p className="text-olive">
          Sign in to manage tables, orders and the menu.
        </p>
      </div>
      <Card className="p-5 md:p-6">
        <LoginForm />
      </Card>
    </main>
  );
}
