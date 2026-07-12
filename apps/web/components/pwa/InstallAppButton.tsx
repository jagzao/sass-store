"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let sharedDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    sharedDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent("pwa-install-available"));
  });
  window.addEventListener("appinstalled", () => {
    sharedDeferredPrompt = null;
    window.dispatchEvent(new CustomEvent("pwa-installed"));
  });
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!sharedDeferredPrompt);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      setInstalled(true);
    }

    const onAvailable = () => setCanInstall(true);
    const onInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener("pwa-install-available", onAvailable);
    window.addEventListener("pwa-installed", onInstalled);
    return () => {
      window.removeEventListener("pwa-install-available", onAvailable);
      window.removeEventListener("pwa-installed", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!sharedDeferredPrompt) return false;
    await sharedDeferredPrompt.prompt();
    const choice = await sharedDeferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setCanInstall(false);
    }
    sharedDeferredPrompt = null;
    return choice.outcome === "accepted";
  }, []);

  return { canInstall, installed, install };
}

/**
 * Botón flotante "Instalar App" — se muestra cuando el browser dispara
 * beforeinstallprompt. Oculto si ya está instalado o si no es instalable.
 */
export function InstallAppButton() {
  const { canInstall, installed, install } = useInstallPrompt();

  if (installed || !canInstall) return null;

  return (
    <button
      onClick={install}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      aria-label="Instalar aplicación"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
        />
      </svg>
      <span>Instalar App</span>
    </button>
  );
}

/**
 * Item de menú inline "Instalar App" — para dropdowns y listas.
 * En browsers sin beforeinstallprompt (iOS Safari), muestra instrucciones.
 */
export function InstallAppMenuItem({ onClick }: { onClick?: () => void }) {
  const { canInstall, installed, install } = useInstallPrompt();

  const handleClick = async () => {
    if (canInstall) {
      await install();
    }
    onClick?.();
  };

  if (installed) return null;

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
    >
      <span className="text-lg">📱</span>
      <span>Instalar App</span>
      {!canInstall && (
        <span className="ml-auto text-xs text-gray-400">
          iOS: Compartir → Inicio
        </span>
      )}
    </button>
  );
}
