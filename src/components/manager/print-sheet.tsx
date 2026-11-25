"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { groupTables, qrUrl, type RestaurantTable } from "@/lib/tables";
import { loadTables } from "@/lib/tables-api";
import { useOrigin } from "@/lib/use-origin";
import { QrCard } from "./qr-card";

/** One QR card per table, laid out for printing (use the browser's Save as PDF to export). */
export function PrintSheet() {
  const clientRef = useRef<SupabaseClient | null>(null);
  const origin = useOrigin();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; name: string; tables: RestaurantTable[] }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    clientRef.current ??= createClient();
    loadTables(clientRef.current)
      .then((data) => {
        if (!cancelled)
          setState({
            status: "ready",
            name: data.restaurantName,
            tables: data.tables,
          });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Could not load tables.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading")
    return <p className="text-olive">Preparing QR codes…</p>;
  if (state.status === "error") {
    return (
      <p role="alert" className="text-status-error">
        {state.message}
      </p>
    );
  }
  if (state.tables.length === 0)
    return (
      <Card className="p-5 text-olive">
        Add tables first, then print their QR codes.
      </Card>
    );

  const ordered = groupTables(state.tables).flatMap(
    (section) => section.tables,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-olive">
          {ordered.length} QR codes. Choose Save as PDF in the print window to
          export them.
        </p>
        <Button onClick={() => window.print()}>Print</Button>
      </div>
      <ul className="grid grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
        {ordered.map((table) => (
          <li
            key={table.id}
            className="break-inside-avoid rounded-card border border-line p-4"
          >
            <QrCard
              url={qrUrl(origin, table.qr_token)}
              title={table.label}
              subtitle={state.name}
              size={160}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
