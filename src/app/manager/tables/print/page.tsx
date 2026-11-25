import type { Metadata } from "next";
import { PrintSheet } from "@/components/manager/print-sheet";

export const metadata: Metadata = { title: "Print QR codes | Tafole" };

export default function PrintQrPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] leading-8 font-bold print:hidden">
        Print QR codes
      </h1>
      <PrintSheet />
    </main>
  );
}
