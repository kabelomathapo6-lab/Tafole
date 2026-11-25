import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ManagerNav } from "@/components/manager/manager-nav";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col lg:flex-row">
      <aside className="flex flex-col gap-4 border-b border-line bg-oat px-4 py-4 lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-5 lg:py-8">
        <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start">
          <p className="font-display text-lg font-bold">Tafole</p>
          <p className="text-sm text-olive">Manager</p>
        </div>
        <ManagerNav />
        <div className="lg:mt-auto">
          <SignOutButton />
        </div>
      </aside>
      <div className="flex-1 px-4 py-6 md:px-8 lg:py-10">{children}</div>
    </div>
  );
}
