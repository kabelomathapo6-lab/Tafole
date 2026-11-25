import type { Metadata } from "next";
import { TablesManager } from "@/components/manager/tables-manager";

export const metadata: Metadata = { title: "Tables | Tafole" };

export default function TablesPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] leading-8 font-bold">Tables</h1>
      <TablesManager />
    </main>
  );
}
