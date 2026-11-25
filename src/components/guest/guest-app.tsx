"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button, Card, Chip, TableBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { ensureGuestSession } from "@/lib/supabase/guest";
import {
  InvalidTableError,
  loadGuestMenu,
  loadOrders,
  placeOrder,
  startSession,
  subscribeToOrders,
  type GuestOrder,
  type GuestSession,
} from "@/lib/guest-api";
import {
  addToCart,
  cartCount,
  cartTotal,
  reconcileCart,
  setLineNote,
  setLineQuantity,
  toOrderItems,
  type CartLine,
} from "@/lib/cart";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import { formatRand } from "@/lib/money";
import { CartSheet } from "./cart-sheet";
import { MenuList } from "./menu-list";
import { OrdersView } from "./orders-view";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REFRESH_MS = 15_000;

type Loaded = {
  session: GuestSession;
  restaurantName: string;
  tableLabel: string;
  categories: MenuCategory[];
  items: MenuItem[];
};

function readCart(token: string): CartLine[] {
  try {
    const raw = window.sessionStorage.getItem(`tafole-cart-${token}`);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function InvalidCode() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 px-4 py-10">
      <h1 className="font-display text-[26px] leading-8 font-bold">
        This QR code isn&apos;t working
      </h1>
      <p className="text-olive">
        Please ask your waiter for help, and they will get you sorted.
      </p>
    </main>
  );
}

export function GuestApp({ token }: { token: string }) {
  const tokenValid = UUID.test(token);
  const clientRef = useRef<SupabaseClient | null>(null);
  const getClient = useCallback(
    () => (clientRef.current ??= createClient()),
    [],
  );

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "invalid" }
    | { status: "error"; message: string }
    | { status: "ready"; data: Loaded }
  >({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [orders, setOrders] = useState<GuestOrder[]>([]);
  const [cart, setCart] = useState<CartLine[]>(() =>
    typeof window === "undefined" ? [] : readCart(token),
  );
  const [orderNotes, setOrderNotes] = useState("");
  const [view, setView] = useState<"menu" | "orders">("menu");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [justOrdered, setJustOrdered] = useState(false);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        `tafole-cart-${token}`,
        JSON.stringify(cart),
      );
    } catch {
      // storage can be unavailable (private mode); the cart still works in memory
    }
  }, [cart, token]);

  useEffect(() => {
    if (!tokenValid) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = getClient();
        await ensureGuestSession(supabase);
        const session = await startSession(supabase, token);
        const [menu, existingOrders] = await Promise.all([
          loadGuestMenu(supabase, session),
          loadOrders(supabase, session.id),
        ]);
        if (cancelled) return;
        setOrders(existingOrders);
        setCart((current) => reconcileCart(current, menu.items));
        setState({ status: "ready", data: { session, ...menu } });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof InvalidTableError) setState({ status: "invalid" });
        else
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Something went wrong. Try again.",
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tokenValid, getClient, reloadKey]);

  const sessionId = state.status === "ready" ? state.data.session.id : null;

  useEffect(() => {
    if (!sessionId) return;
    const supabase = getClient();
    const refresh = () => {
      loadOrders(supabase, sessionId)
        .then(setOrders)
        .catch(() => {
          // keep showing the last known orders; the next refresh will try again
        });
    };
    const unsubscribe = subscribeToOrders(supabase, sessionId, refresh);
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [sessionId, getClient]);

  if (!tokenValid || state.status === "invalid") return <InvalidCode />;

  if (state.status === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <p className="text-olive">Opening your table…</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-10">
        <p role="alert" className="text-status-error">
          {state.message}
        </p>
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              setState({ status: "loading" });
              setReloadKey((key) => key + 1);
            }}
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const { data } = state;
  const count = cartCount(cart);

  async function submitOrder() {
    if (placing || cart.length === 0) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const supabase = getClient();
      await placeOrder(
        supabase,
        data.session.id,
        toOrderItems(cart),
        orderNotes.trim() || null,
      );
      setCart([]);
      setOrderNotes("");
      setCartOpen(false);
      setOrders(await loadOrders(supabase, data.session.id));
      setJustOrdered(true);
      setView("orders");
    } catch (error) {
      setPlaceError(
        error instanceof Error
          ? error.message
          : "Could not send your order. Try again.",
      );
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-dvh pb-32">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-lg font-bold">
              {data.restaurantName}
            </p>
            <TableBadge>{data.tableLabel}</TableBadge>
          </div>
          <div role="group" aria-label="View" className="flex gap-2">
            <Chip
              active={view === "menu"}
              onClick={() => {
                setView("menu");
                setJustOrdered(false);
              }}
            >
              Menu
            </Chip>
            <Chip active={view === "orders"} onClick={() => setView("orders")}>
              My orders{orders.length > 0 ? ` (${orders.length})` : ""}
            </Chip>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-5">
        {view === "menu" ? (
          data.items.length === 0 ? (
            <Card className="p-5 text-olive">
              The menu is not available right now. Please ask your waiter.
            </Card>
          ) : (
            <MenuList
              categories={data.categories}
              items={data.items}
              cart={cart}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onAdd={(item) => setCart((current) => addToCart(current, item))}
              onQuantity={(itemId, quantity) =>
                setCart((current) => setLineQuantity(current, itemId, quantity))
              }
            />
          )
        ) : (
          <OrdersView orders={orders} justOrdered={justOrdered} />
        )}
      </main>

      {view === "menu" && count > 0 ? (
        <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex min-h-14 w-full items-center justify-between gap-3 rounded-full bg-forest px-5 font-display font-semibold text-porcelain shadow-float active:scale-[0.99]"
          >
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-porcelain px-2 text-sm text-forest tabular-nums">
              {count}
            </span>
            <span>View order</span>
            <span className="tabular-nums">{formatRand(cartTotal(cart))}</span>
          </button>
        </div>
      ) : null}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cart}
        notes={orderNotes}
        placing={placing}
        error={placeError}
        onQuantity={(itemId, quantity) =>
          setCart((current) => setLineQuantity(current, itemId, quantity))
        }
        onLineNote={(itemId, note) =>
          setCart((current) => setLineNote(current, itemId, note))
        }
        onNotes={setOrderNotes}
        onPlace={() => void submitOrder()}
      />
    </div>
  );
}
