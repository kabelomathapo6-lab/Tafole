import type { Metadata } from "next";
import { KitchenBoard } from "@/components/staff/kitchen-board";

export const metadata: Metadata = { title: "Kitchen | Tafole" };

export default function KitchenPage() {
  return <KitchenBoard />;
}
