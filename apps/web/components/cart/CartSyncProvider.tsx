"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart/cart-store";
import { useSession } from "next-auth/react";

/**
 * CartSyncProvider — handles cart ↔ server synchronization.
 *
 * Strategy:
 *  • Load cart from server once on login (no polling).
 *  • Save cart to server debounced (DEBOUNCE_MS) after any items change.
 *  • Save immediately on page unload (beforeunload).
 *
 * userId is read from the existing NextAuth session — no extra
 * /api/auth/session fetch is made inside the cart store itself.
 */

const DEBOUNCE_SAVE_MS = 5_000; // 5 s after last cart mutation

export function CartSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { loadUserCart, saveCartToUser } = useCart();

  // Subscribe to items to detect mutations (selector avoids full re-render)
  const items = useCart((state) => state.items);

  // Stable ref to avoid stale closures in beforeunload
  const userIdRef = useRef<string | undefined>(undefined);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep userIdRef in sync with session
  useEffect(() => {
    userIdRef.current = session?.user?.id as string | undefined;
  }, [session?.user?.id]);

  // Load cart once when user authenticates
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      loadUserCart(session.user.id as string);
    }
  }, [status, session?.user?.id, loadUserCart]);

  // Debounced save whenever cart items change
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    const uid = session?.user?.id as string | undefined;
    saveTimerRef.current = setTimeout(() => {
      if (uid) saveCartToUser(uid);
    }, DEBOUNCE_SAVE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [items, status, session?.user?.id, saveCartToUser]);

  // Flush on page unload — synchronous attempt via sendBeacon fallback
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!userIdRef.current) return;
      const { items: cartItems } = useCart.getState();
      const body = JSON.stringify({ cart: cartItems });

      // Prefer sendBeacon (non-blocking, reliable on unload)
      const sent = navigator.sendBeacon
        ? navigator.sendBeacon(
            `/api/users/${userIdRef.current}/cart`,
            new Blob([body], { type: "application/json" }),
          )
        : false;

      if (!sent) {
        // Fallback: best-effort synchronous fetch (may be cancelled by browser)
        saveCartToUser(userIdRef.current);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveCartToUser]);

  return <>{children}</>;
}
