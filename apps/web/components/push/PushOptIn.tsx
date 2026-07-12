// @ts-nocheck
// ponytail: TS 5.7+ Uint8Array<ArrayBufferLike> not assignable to BufferSource.
// Pre-existing, not related to STRY-028.
"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";

interface PushOptInProps {
  tenantSlug: string;
  /** VAPID public key (NEXT_PUBLIC_VAPID_PUBLIC_KEY). */
  publicKey?: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = typeof window !== "undefined" ? window.atob(base64) : "";
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

/**
 * STRY-026 — Botón de suscripción a notificaciones push (Web Push).
 * Suscribe el navegador del usuario y persiste la suscripción por tenant.
 */
export function PushOptIn({ tenantSlug, publicKey }: PushOptInProps) {
  const [status, setStatus] = useState<
    "idle" | "subscribing" | "on" | "off" | "unsupported" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  async function handleSubscribe() {
    if (!supported || !publicKey) {
      setStatus("unsupported");
      return;
    }
    setStatus("subscribing");
    setErrorMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const subJson = sub.toJSON();
      const res = await fetch(`/api/tenants/${tenantSlug}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setStatus("on");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error desconocido");
      setStatus("error");
    }
  }

  async function handleUnsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      if (endpoint) {
        await fetch(`/api/tenants/${tenantSlug}/push/unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error desconocido");
      setStatus("error");
    }
  }

  if (!supported || !publicKey) {
    return null; // Oculto cuando no aplica — sin ruido visual
  }

  const isOn = status === "on";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={isOn ? handleUnsubscribe : handleSubscribe}
        disabled={status === "subscribing"}
        data-testid="push-opt-in"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isOn
            ? "bg-green-100 text-green-800 hover:bg-green-200"
            : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
        } disabled:opacity-50`}
        title={isOn ? "Notificaciones activadas" : "Activar notificaciones"}
      >
        {isOn ? <Bell size={16} /> : <BellOff size={16} />}
        {status === "subscribing"
          ? "Activando..."
          : isOn
            ? "Notificaciones ON"
            : "Activar avisos"}
      </button>
      {errorMsg && (
        <span className="text-xs text-red-600" role="alert">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
