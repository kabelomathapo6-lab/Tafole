"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button, Card, Drawer } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { downloadSvg } from "@/lib/download";
import { groupTables, qrUrl, type RestaurantTable } from "@/lib/tables";
import {
  createTable,
  deleteTable,
  loadTables,
  resetQrToken,
  updateTable,
  type TableValues,
} from "@/lib/tables-api";
import { useOrigin } from "@/lib/use-origin";
import { QrCard } from "./qr-card";
import { TableForm } from "./table-form";

type Dialog = { mode: "new" } | { mode: "edit"; table: RestaurantTable } | null;

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Try again.";
}

export function TablesManager() {
  const clientRef = useRef<SupabaseClient | null>(null);
  const getClient = useCallback(
    () => (clientRef.current ??= createClient()),
    [],
  );
  const origin = useOrigin();
  const qrRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [restaurantId, setRestaurantId] = useState("");
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTables(getClient())
      .then((data) => {
        if (cancelled) return;
        setRestaurantId(data.restaurantId);
        setTables(data.tables);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(messageOf(error));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [getClient, reloadKey]);

  const sections = useMemo(() => groupTables(tables), [tables]);
  const areas = useMemo(
    () => sections.map((s) => s.area).filter((a): a is string => !!a),
    [sections],
  );

  function closeDialog() {
    setDialog(null);
    setDialogError(null);
    setConfirmingReset(false);
  }

  async function run(action: () => Promise<void>) {
    setSaving(true);
    setDialogError(null);
    try {
      await action();
    } catch (error) {
      setDialogError(messageOf(error));
    } finally {
      setSaving(false);
    }
  }

  const saveTable = (values: TableValues) =>
    run(async () => {
      if (dialog?.mode === "edit") {
        const saved = await updateTable(getClient(), dialog.table.id, values);
        setTables((current) =>
          current.map((t) => (t.id === saved.id ? saved : t)),
        );
      } else {
        const saved = await createTable(getClient(), restaurantId, values);
        setTables((current) => [...current, saved]);
      }
      closeDialog();
    });

  const removeTable = () =>
    run(async () => {
      if (dialog?.mode !== "edit") return;
      const id = dialog.table.id;
      await deleteTable(getClient(), id);
      setTables((current) => current.filter((t) => t.id !== id));
      closeDialog();
    });

  const resetQr = () =>
    run(async () => {
      if (dialog?.mode !== "edit") return;
      const saved = await resetQrToken(getClient(), dialog.table.id);
      setTables((current) =>
        current.map((t) => (t.id === saved.id ? saved : t)),
      );
      setDialog({ mode: "edit", table: saved });
      setConfirmingReset(false);
    });

  function downloadQr(table: RestaurantTable) {
    const svg = qrRef.current?.querySelector("svg");
    if (svg)
      downloadSvg(
        `${table.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.svg`,
        svg,
      );
  }

  if (status === "loading")
    return <p className="text-olive">Loading your tables…</p>;

  if (status === "error") {
    return (
      <Card className="flex flex-col items-start gap-3 p-5">
        <p role="alert" className="text-status-error">
          {loadError}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setStatus("loading");
            setReloadKey((key) => key + 1);
          }}
        >
          Try again
        </Button>
      </Card>
    );
  }

  const editing = dialog?.mode === "edit" ? dialog.table : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-olive">
          {tables.length} {tables.length === 1 ? "table" : "tables"}
        </p>
        <div className="flex flex-wrap gap-2">
          {tables.length > 0 ? (
            <Link
              href="/manager/tables/print"
              className="inline-flex min-h-11 items-center justify-center rounded-control border-[1.5px] border-line bg-porcelain px-5 font-display font-semibold hover:bg-oat"
            >
              Print QR codes
            </Link>
          ) : null}
          <Button onClick={() => setDialog({ mode: "new" })}>Add table</Button>
        </div>
      </div>

      {tables.length === 0 ? (
        <Card className="p-5 text-olive">
          No tables yet. Add your first table to create its QR code.
        </Card>
      ) : null}

      {sections.map((section) => (
        <section
          key={section.area ?? "none"}
          aria-label={section.name}
          className="flex flex-col gap-3"
        >
          <h2 className="font-display text-lg font-semibold">{section.name}</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {section.tables.map((table) => (
              <li key={table.id}>
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "edit", table })}
                  aria-label={`Open ${table.label}`}
                  className="w-full rounded-card border border-line bg-porcelain p-4 text-left shadow-card transition hover:bg-oat"
                >
                  <span className="block font-display text-lg font-bold">
                    {table.label}
                  </span>
                  <span className="text-sm text-olive">
                    {table.seats} {table.seats === 1 ? "seat" : "seats"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Drawer
        open={dialog !== null}
        onClose={closeDialog}
        title={editing ? editing.label : "Add table"}
      >
        {dialog ? (
          <>
            <TableForm
              key={editing ? editing.id : "new"}
              table={editing}
              areas={areas}
              saving={saving}
              error={dialogError}
              onSubmit={(values) => void saveTable(values)}
              onDelete={editing ? () => void removeTable() : undefined}
            />
            {editing ? (
              <section
                aria-label="QR code"
                className="flex flex-col gap-3 border-t border-line pt-4"
              >
                <div ref={qrRef}>
                  <QrCard
                    url={qrUrl(origin, editing.qr_token)}
                    title={editing.label}
                  />
                </div>
                <p className="text-xs break-all text-muted">
                  {qrUrl(origin, editing.qr_token)}
                </p>
                <Button variant="secondary" onClick={() => downloadQr(editing)}>
                  Download QR (SVG)
                </Button>
                {confirmingReset ? (
                  <div className="flex flex-col gap-2 rounded-control bg-status-waiting-soft p-4">
                    <p className="text-sm text-status-waiting-ink">
                      Make a new QR code for {editing.label}? The printed one
                      stops working, so you will need to print and replace it.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="urgent"
                        onClick={() => void resetQr()}
                        disabled={saving}
                      >
                        Yes, reset
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmingReset(false)}
                      >
                        Keep current code
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmingReset(true)}
                  >
                    Reset QR code
                  </Button>
                )}
              </section>
            ) : null}
          </>
        ) : null}
      </Drawer>
    </div>
  );
}
