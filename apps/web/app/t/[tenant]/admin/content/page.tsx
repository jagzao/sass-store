import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { TopNav } from "@/components/navigation/top-nav";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function ContentAdminPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);
  const branding = tenantData.branding as any;
  const contact = tenantData.contact as any;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNav
        tenantInfo={{
          id: tenantData.id,
          name: tenantData.name,
          categories: [],
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <a
                    href={`/t/${resolvedParams.tenant}/admin`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    ← Panel Admin
                  </a>
                  <span className="text-gray-600">/</span>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de Contenido
                  </h1>
                </div>
                <p className="text-gray-600 mt-2">
                  Personaliza la apariencia y contenido de tu tienda
                </p>
              </div>
              <div className="flex space-x-3">
                <a
                  href={`/t/${resolvedParams.tenant}`}
                  target="_blank"
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="mr-2">👁️</span>
                  Vista Previa
                </a>
                <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <span className="mr-2">💾</span>
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Content Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Brand Identity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Identidad de Marca
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Negocio
                    </label>
                    <input
                      type="text"
                      defaultValue={tenantData.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eslogan/Tagline
                    </label>
                    <input
                      type="text"
                      defaultValue={tenantData.description}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Primario
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        defaultValue={branding.primaryColor}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        defaultValue={branding.primaryColor}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Secundario
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        defaultValue={branding.secondaryColor}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        defaultValue={branding.secondaryColor}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Información de Contacto
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      defaultValue={contact.phone}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={contact.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <textarea
                    defaultValue={contact.address}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    defaultValue={contact.website || ""}
                    placeholder="https://tu-sitio-web.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Horarios de Atención
                </h2>

                <div className="space-y-4">
                  {Object.entries(contact.hours || {}).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-20">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {day}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="time"
                          defaultValue={
                            (hours as string)?.split("-")[0] || "09:00"
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          defaultValue={
                            (hours as string)?.split("-")[1] || "18:00"
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked={hours !== "closed"}
                          className="rounded"
                        />
                        <label className="ml-2 text-sm text-gray-600">
                          Abierto
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Redes Sociales
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook
                    </label>
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📘</span>
                      <input
                        type="url"
                        placeholder="https://facebook.com/tu-negocio"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                    </label>
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📷</span>
                      <input
                        type="url"
                        placeholder="https://instagram.com/tu-negocio"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💬</span>
                      <input
                        type="tel"
                        placeholder="+52 55 1234 5678"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TikTok
                    </label>
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🎵</span>
                      <input
                        type="url"
                        placeholder="https://tiktok.com/@tu-negocio"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Preview and Actions */}
            <div className="space-y-6">
              {/* Live Preview */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Vista Previa
                </h3>

                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3">
                    {tenantData.name.includes("Wonder")
                      ? "💅"
                      : tenantData.name.includes("Vigi")
                        ? "✂️"
                        : tenantData.name.includes("Zo")
                          ? "💻"
                          : "🏪"}
                  </div>
                  <h4
                    className="text-xl font-bold mb-2"
                    style={{ color: branding.primaryColor }}
                  >
                    {tenantData.name}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {tenantData.description}
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div>📞 {contact.phone}</div>
                    <div>📍 {contact.address}</div>
                  </div>
                </div>
              </div>

              {/* Media Gallery */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Galería de Imágenes
                  </h3>
                  <a
                    href={`/t/${resolvedParams.tenant}/admin/gallery`}
                    className="text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    Ver todas →
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🖼️</span>
                  </div>
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📸</span>
                  </div>
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <span className="text-2xl">+</span>
                  </div>
                </div>

                <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  Subir Imagen
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Acciones Rápidas
                </h3>

                <div className="space-y-3">
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">🎨</span>
                      <div>
                        <div className="text-sm font-medium">Cambiar Logo</div>
                        <div className="text-xs text-gray-500">
                          Actualizar logotipo
                        </div>
                      </div>
                    </div>
                  </button>

                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">📄</span>
                      <div>
                        <div className="text-sm font-medium">
                          Términos y Condiciones
                        </div>
                        <div className="text-xs text-gray-500">
                          Configurar políticas
                        </div>
                      </div>
                    </div>
                  </button>

                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">📧</span>
                      <div>
                        <div className="text-sm font-medium">
                          Templates Email
                        </div>
                        <div className="text-xs text-gray-500">
                          Personalizar emails
                        </div>
                      </div>
                    </div>
                  </button>

                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">🔍</span>
                      <div>
                        <div className="text-sm font-medium">SEO</div>
                        <div className="text-xs text-gray-500">
                          Optimizar búsquedas
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Publish Status */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Estado de Publicación
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Sitio Público
                      </div>
                      <div className="text-xs text-gray-500">
                        Tu tienda es visible
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded"
                      />
                      <span className="ml-2 text-sm text-green-600">
                        Activo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Modo Mantenimiento
                      </div>
                      <div className="text-xs text-gray-500">
                        Mostrar página &ldquo;próximamente&rdquo;
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="ml-2 text-sm text-gray-600">
                        Inactivo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
