"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { FloorTable, StaffOrder, StaffRequest } from "@/lib/floor";
import type { OrderStatus } from "@/lib/order-status";
import { loadFloor, subscribeToFloor } from "@/lib/staff-api";

const REFRESH_MS = 15_000;

/**
 * Live view of tables and active orders for staff screens. Updates through Supabase Realtime,
 * with a 15 second refresh as a backup if the live connection drops.
 */
export function useFloor(statuses: OrderStatus[]) {
  const clientRef = useRef<SupabaseClient | null>(null);
  const getClient = useCallback(
    () => (clientRef.current ??= createClient()),
    [],
  );
  const refreshRef = useRef<() => void>(() => {});
  const statusKey = statuses.join(",");

  const [data, setData] = useState<{
    tables: FloorTable[];
    orders: StaffOrder[];
    requests: StaffRequest[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getClient();
    const wanted = statusKey.split(",") as OrderStatus[];

    const refresh = () => {
      loadFloor(supabase, wanted)
        .then((next) => {
          if (cancelled) return;
          setData(next);
          setError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong. Try again.",
          );
        });
    };
    refreshRef.current = refresh;

    refresh();
    const unsubscribe = subscribeToFloor(supabase, refresh);
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [getClient, statusKey]);

  const refresh = useCallback(() => refreshRef.current(), []);
  return { data, error, refresh, getClient };
}
