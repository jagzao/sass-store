"use client";

import { useEffect, useState, useCallback } from "react";
import { Download } from "lucide-react";

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
 * beforeinstallprompt. Oculto si ya está instalado o no es instalable.
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
      <Download className="w-5 h-5" />
      <span>Instalar App</span>
    </button>
  );
}

/**
 * Item de menú inline "Instalar App" — para dropdowns y listas.
 * Se muestra solo en navegadores/browsers que soportan instalación PWA.
 * ponytail: iOS hint retirado del dropdown; el botón flotante sigue con fallback nativo.
 */
export function InstallAppMenuItem({
  onClick,
  className,
  iconClassName,
}: {
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
}) {
  const { canInstall, installed, install } = useInstallPrompt();

  const handleClick = async () => {
    if (canInstall) {
      await install();
    }
    onClick?.();
  };

  // Solo mostrar si el browser anuncia que puede instalar.
  if (installed || !canInstall) return null;

  return (
    <button
      onClick={handleClick}
      role="menuitem"
      className={className}
      aria-label="Instalar aplicación"
    >
      <Download className={iconClassName} />
      <span>Instalar aplicación</span>
    </button>
  );
}
