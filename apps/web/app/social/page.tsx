"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SocialPage() {
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
          <p className="text-gray-600">Cargando gestión social...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Redes Sociales
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Social Media Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">📘</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Facebook</h3>
                  <p className="text-sm text-gray-600">Conectado</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">2,450</div>
              <p className="text-sm text-gray-600">Seguidores</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">📷</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Instagram</h3>
                  <p className="text-sm text-gray-600">Conectado</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-pink-600">1,890</div>
              <p className="text-sm text-gray-600">Seguidores</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">🐦</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Twitter</h3>
                  <p className="text-sm text-gray-600">Pendiente</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-600">--</div>
              <p className="text-sm text-gray-600">No conectado</p>
            </div>
          </div>

          {/* Content Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Post Scheduler */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Programador de Publicaciones
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plataforma
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Facebook</option>
                    <option>Instagram</option>
                    <option>Twitter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                    placeholder="Escribe tu publicación..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha y Hora
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Programar Publicación
                </button>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Publicaciones Recientes
              </h2>

              <div className="space-y-4">
                <div className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">📘</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-1">
                        ¡Nuevo servicio de manicure premium disponible! ✨
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Facebook</span>
                        <span className="mx-2">•</span>
                        <span>Hace 2 horas</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">Publicado</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">📷</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-1">
                        Antes y después de nuestro tratamiento de uñas 💅
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Instagram</span>
                        <span className="mx-2">•</span>
                        <span>Hace 5 horas</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">Publicado</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">📘</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-1">
                        Promoción especial: 20% descuento en pedicures
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Facebook</span>
                        <span className="mx-2">•</span>
                        <span>Programado para mañana</span>
                        <span className="mx-2">•</span>
                        <span className="text-blue-600">Pendiente</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Preview */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              Analytics (Próximamente)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1,247</div>
                <p className="text-sm text-gray-600">Alcance Total</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">89</div>
                <p className="text-sm text-gray-600">Interacciones</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">23</div>
                <p className="text-sm text-gray-600">Nuevos Seguidores</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">4.2%</div>
                <p className="text-sm text-gray-600">Tasa de Engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
