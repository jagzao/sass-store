"use client";

import { usePathname } from "next/navigation";

export default function TemporaryAdminMenu({
  tenantSlug,
}: {
  tenantSlug: string;
}) {
  const pathname = usePathname();

  // Only show in development or if explicitly enabled
  // For now, showing it always as requested by user

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white/90 backdrop-blur-md rounded-lg shadow-2xl border border-red-200 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-red-600 text-xs uppercase tracking-wider">
          🛠️ Menú de Debug
        </h3>
        <button
          onClick={(e) =>
            e.currentTarget.parentElement?.parentElement?.remove()
          }
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="text-xs text-gray-500 mb-2">
          Acceso temporal sin login
        </div>

        <a
          href={`/t/${tenantSlug}/admin_services`}
          className={`block px-3 py-2 rounded transition-colors ${
            pathname?.includes("admin_services")
              ? "bg-blue-50 text-blue-700 font-medium"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          ⚡ Admin Servicios
        </a>

        <a
          href={`/t/${tenantSlug}/admin_products`}
          className={`block px-3 py-2 rounded transition-colors ${
            pathname?.includes("admin_products")
              ? "bg-blue-50 text-blue-700 font-medium"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          📦 Admin Productos
        </a>

        <div className="border-t pt-2 mt-2">
          <a
            href={`/t/${tenantSlug}/login`}
            className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-xs"
          >
            🔐 Ir a Login Real
          </a>
        </div>
      </div>
    </div>
  );
}
