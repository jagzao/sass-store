import Link from "next/link";

export const dynamic = "force-static";

// STRY-026 — Fallback offline para el service worker.
export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gray-50 text-gray-800"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-md">
        <div className="text-6xl mb-4" aria-hidden="true">
          📴
        </div>
        <h1 className="text-2xl font-bold mb-2">Sin conexión</h1>
        <p className="text-gray-600 mb-6">
          Parece que perdiste la conexión a internet. Algunas páginas que ya
          visitaste siguen disponibles; las que no, se cargarán cuando vuelvas a
          estar en línea.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Reintentar
        </Link>
      </div>
    </div>
  );
}
