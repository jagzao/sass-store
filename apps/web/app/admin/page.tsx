import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const isZoSystem = session?.user?.email === "admin@zo-system.com";

  const adminModules = isZoSystem
    ? [
        {
          title: "Gestión de Tenants",
          description: "Crea, edita y elimina tenants del sistema",
          href: "/admin/tenants",
          icon: "🏢",
          color: "bg-indigo-500",
        },
        {
          title: "Social Planner",
          description: "Gestiona y programa contenido para redes sociales",
          href: "/admin/social-planner",
          icon: "📱",
          color: "bg-blue-500",
        },
        {
          title: "Productos",
          description: "Administra el catálogo de productos",
          href: "/admin/products",
          icon: "📦",
          color: "bg-green-500",
        },
        {
          title: "Servicios",
          description: "Gestiona servicios y reservas",
          href: "/admin/services",
          icon: "⚡",
          color: "bg-purple-500",
        },
        {
          title: "Contenido",
          description: "Administra contenido y medios",
          href: "/admin/content",
          icon: "📄",
          color: "bg-orange-500",
        },
        {
          title: "Calendario",
          description: "Visualiza reservas y eventos",
          href: "/admin/calendar",
          icon: "📅",
          color: "bg-red-500",
        },
        {
          title: "Configuración",
          description: "Ajustes del tenant y sistema",
          href: "/admin/settings",
          icon: "⚙️",
          color: "bg-gray-500",
        },
      ]
    : [
        {
          title: "Social Planner",
          description: "Gestiona y programa contenido para redes sociales",
          href: "/admin/social-planner",
          icon: "📱",
          color: "bg-blue-500",
        },
        {
          title: "Productos",
          description: "Administra el catálogo de productos",
          href: "/admin/products",
          icon: "📦",
          color: "bg-green-500",
        },
        {
          title: "Servicios",
          description: "Gestiona servicios y reservas",
          href: "/admin/services",
          icon: "⚡",
          color: "bg-purple-500",
        },
        {
          title: "Contenido",
          description: "Administra contenido y medios",
          href: "/admin/content",
          icon: "📄",
          color: "bg-orange-500",
        },
        {
          title: "Calendario",
          description: "Visualiza reservas y eventos",
          href: "/admin/calendar",
          icon: "📅",
          color: "bg-red-500",
        },
        {
          title: "Configuración",
          description: "Ajustes del tenant y sistema",
          href: "/admin/settings",
          icon: "⚙️",
          color: "bg-gray-500",
        },
      ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Gestiona todos los aspectos de tu negocio desde aquí
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 p-6 block"
          >
            <div className="flex items-center mb-4">
              <div
                className={`${module.color} text-white p-3 rounded-lg text-2xl mr-4`}
              >
                {module.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {module.title}
              </h3>
            </div>
            <p className="text-gray-600">{module.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Resumen Rápido
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Posts Programados</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="text-blue-500 text-2xl">📱</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Productos Activos</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
              <div className="text-green-500 text-2xl">📦</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Reservas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <div className="text-purple-500 text-2xl">⚡</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Medios Almacenados</p>
                <p className="text-2xl font-bold text-gray-900">127</p>
              </div>
              <div className="text-orange-500 text-2xl">🖼️</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
