import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Kitchen | Tafole" };

export default function KitchenPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-10 md:px-8">
      <h1 className="font-display text-[26px] leading-8 font-bold">Kitchen</h1>
      <p className="text-olive">
        Signed in. This screen is built in a later phase.
      </p>
      <div>
        <SignOutButton />
      </div>
    </main>
  );
}
