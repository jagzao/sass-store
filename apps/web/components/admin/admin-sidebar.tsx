'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenantSlug } from '@/lib/tenant/client-resolver';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: '🏠'
  },
  {
    name: 'Social Planner',
    href: '/admin/social-planner',
    icon: '📱'
  },
  {
    name: 'Productos',
    href: '/admin/products',
    icon: '📦'
  },
  {
    name: 'Servicios',
    href: '/admin/services',
    icon: '⚡'
  },
  {
    name: 'Contenido',
    href: '/admin/content',
    icon: '📄'
  },
  {
    name: 'Calendario',
    href: '/admin/calendar',
    icon: '📅'
  },
  {
    name: 'Configuración',
    href: '/admin/settings',
    icon: '⚙️'
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const tenantSlug = useTenantSlug();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
      <div className="flex items-center justify-center h-16 bg-gray-800 border-b border-gray-700">
        <Link href={`/t/${tenantSlug}`} className="text-xl font-bold">
          📊 Admin Panel
        </Link>
      </div>

      <nav className="mt-8">
        <div className="px-4">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Administración
          </h3>

          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${
                    isActive(item.href)
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-600 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 px-4">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Acciones Rápidas
          </h3>

          <div className="space-y-1">
            <Link
              href="/admin/social-planner"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200"
            >
              <span className="mr-3 text-lg">✏️</span>
              Crear Post
            </Link>

            <Link
              href="/admin/products"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200"
            >
              <span className="mr-3 text-lg">➕</span>
              Agregar Producto
            </Link>

            <Link
              href="/admin/services"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200"
            >
              <span className="mr-3 text-lg">🛠️</span>
              Nuevo Servicio
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <Link
            href={`/t/${tenantSlug}`}
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200 w-full"
          >
            <span className="mr-3 text-lg">🏪</span>
            Ver Tienda
          </Link>
        </div>
      </nav>
    </div>
  );
}