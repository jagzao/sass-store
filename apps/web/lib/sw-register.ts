// Registro del Service Worker (solo en producción para evitar problemas en desarrollo)
export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[SW] Registered successfully:', registration.scope);
        })
        .catch(error => {
          console.log('[SW] Registration failed:', error);
        });
    });
  }
}