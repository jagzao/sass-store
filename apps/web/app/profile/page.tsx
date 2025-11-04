"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/t/zo-system/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href="/t/zo-system"
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Volver al inicio
              </a>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {session.user.name?.charAt(0)?.toUpperCase() ||
                  session.user.email?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {session.user.name || "Usuario"}
              </h2>
              <p className="text-gray-600">{session.user.email}</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                      {session.user.name || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Configuración de Cuenta
                </h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="font-medium text-gray-900">
                      Cambiar Contraseña
                    </div>
                    <div className="text-sm text-gray-600">
                      Actualiza tu contraseña de acceso
                    </div>
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="font-medium text-gray-900">
                      Preferencias de Notificaciones
                    </div>
                    <div className="text-sm text-gray-600">
                      Configura cómo recibir notificaciones
                    </div>
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="font-medium text-gray-900">Privacidad</div>
                    <div className="text-sm text-gray-600">
                      Configura tu privacidad y datos
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <p className="text-sm text-gray-600 text-center">
                  ID de usuario:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {session.user.id}
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
