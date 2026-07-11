/* eslint-disable no-console */
// Registro del Service Worker
// En producción siempre. En dev, opt-in con ?sw=1 en la URL.
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isProd = process.env.NODE_ENV === "production";
  const swParam = new URLSearchParams(window.location.search).get("sw");
  const shouldRegister = isProd || swParam === "1";

  if (!shouldRegister) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[SW] Registered:", registration.scope);
      })
      .catch((error) => {
        console.log("[SW] Registration failed:", error);
      });
  });
}
