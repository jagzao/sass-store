"use client";

import Link from "next/link";

// Force dynamic rendering to avoid useContext issues during build
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Error Animation */}
        <div className="mb-8">
          <div className="text-8xl mb-4 animate-bounce">🔍</div>
          <h1 className="text-6xl font-bold text-white mb-4">
            4<span className="text-blue-400">0</span>4
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Página no encontrada
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            La página que buscas no existe o fue movida.
          </p>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/"
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">🏠</span>
            Volver al Inicio
          </Link>

          <button
            onClick={() =>
              typeof window !== "undefined" && window.history.back()
            }
            className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">⬅️</span>
            Página Anterior
          </button>
        </div>

        {/* Contact Support */}
        <div className="text-gray-600 text-sm">
          <p className="mb-2">¿Sigues teniendo problemas?</p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/support"
              className="hover:text-blue-400 transition-colors"
            >
              📞 Contactar Soporte
            </Link>
            <Link
              href="mailto:help@zo.dev"
              className="hover:text-blue-400 transition-colors"
            >
              ✉️ Enviar Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
