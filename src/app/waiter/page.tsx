import type { Metadata } from "next";
import { WaiterBoard } from "@/components/staff/waiter-board";

export const metadata: Metadata = { title: "Floor | Tafole" };

export default function WaiterPage() {
  return <WaiterBoard />;
}
