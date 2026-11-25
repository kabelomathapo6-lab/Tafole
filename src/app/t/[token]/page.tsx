import type { Metadata } from "next";
import { Suspense } from "react";
import { GuestApp } from "@/components/guest/guest-app";

export const metadata: Metadata = {
  title: "Order at your table | Tafole",
  robots: { index: false },
};

async function GuestEntry({ params }: PageProps<"/t/[token]">) {
  const { token } = await params;
  return <GuestApp token={token} />;
}

export default function GuestPage(props: PageProps<"/t/[token]">) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
          <p className="text-olive">Opening your table…</p>
        </main>
      }
    >
      <GuestEntry {...props} />
    </Suspense>
  );
}
