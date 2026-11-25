import type { Metadata } from "next";
import { MenuManager } from "@/components/manager/menu-manager";

export const metadata: Metadata = { title: "Menu | Tafole" };

export default function MenuPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] leading-8 font-bold">Menu</h1>
      <MenuManager />
    </main>
  );
}
