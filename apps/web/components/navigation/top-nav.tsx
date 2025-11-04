'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTenantSlug } from '@/lib/tenant/client-resolver';
import { useCart } from '@/lib/cart/cart-store';

interface TenantInfo {
  id: string;
  name: string;
  categories: { value: string; label: string; }[];
}

interface TopNavProps {
  tenantInfo?: TenantInfo;
}

export function TopNav({ tenantInfo }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const currentTenantSlug = useTenantSlug();
  const items = useCart((state) => state.items);
  const _deduplicateItems = useCart((state) => state._deduplicateItems);

  // Filter items for current tenant, deduplicate, and calculate total
  const totalItems = _deduplicateItems(
    items.filter((item) => item.variant?.tenant === currentTenantSlug)
  ).reduce((total, item) => total + item.quantity, 0);

  // Get tenant-specific categories from tenantInfo or default fallback
  const categories = tenantInfo?.categories && tenantInfo.categories.length > 0
    ? [{ value: 'all', label: 'Todo' }, ...tenantInfo.categories]
    : [{ value: 'all', label: 'Todo' }];

  // Get tenant display name from tenantInfo or fallback
  const getTenantDisplayName = () => {
    return tenantInfo?.name || 'SaaS Store';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    // Construct search URL with tenant scope and filters
    const searchParams = new URLSearchParams({
      q: searchQuery,
      ...(selectedCategory !== 'all' && { category: selectedCategory })
    });

    const searchUrl = isZoSystemTenant
      ? `/search?${searchParams.toString()}`
      : `/t/${currentTenantSlug}/search?${searchParams.toString()}`;

    window.location.href = searchUrl;
  };

  const isZoSystemTenant = currentTenantSlug === 'zo-system';

  return (
    <nav className="bg-gray-900 text-white shadow-lg border-b border-gray-800">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">

          {/* Logo - Dynamic tenant name */}
          <Link href={isZoSystemTenant ? "/" : `/t/${currentTenantSlug}`} className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-brand, #DC2626)' }}>
              {getTenantDisplayName()}
            </div>
          </Link>

          {/* Search Bar - Estilo Amazon */}
          <form onSubmit={handleSearch} className="flex-1 max-w-3xl mx-8">
            <div className="flex h-12 rounded-lg overflow-hidden shadow-sm">
              {/* Category Selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-100 text-gray-900 px-4 py-3 border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium min-w-[120px]"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              {/* Search Input - Cápsula grande */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos, servicios, horarios…"
                className="flex-1 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              />

              {/* Search Button */}
              <button
                type="submit"
                className="bg-orange-400 hover:bg-orange-500 px-6 py-3 transition-colors duration-200 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 text-gray-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right Menu - Estilo Amazon */}
          <div className="flex items-center space-x-4">

            {/* Location (opcional para empatía local) */}
            {!isZoSystemTenant && (
              <div className="hidden md:flex flex-col items-start">
                <span className="text-xs text-gray-600">Entregar en</span>
                <span className="text-sm font-semibold hover:text-orange-300 transition-colors cursor-pointer">Texcoco, MX</span>
              </div>
            )}

            {/* Account */}
            <div className="relative">
              <div
                onMouseEnter={() => setIsAccountMenuOpen(true)}
                onMouseLeave={() => setIsAccountMenuOpen(false)}
              >
                <button className="flex flex-col items-start hover:bg-gray-800 px-2 py-1 rounded transition-colors duration-150">
                  <span className="text-xs text-gray-600">Hola, Usuario</span>
                  <span className="text-sm font-semibold">Cuenta y listas</span>
                </button>

                {/* Account Dropdown */}
                <div className={`absolute right-0 mt-2 w-48 bg-white text-gray-900 rounded-lg shadow-lg transition-all duration-200 z-50 ${
                  isAccountMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  <div className="py-2">
                    <Link href={isZoSystemTenant ? "/account" : `/t/${currentTenantSlug}/account`} className="block px-4 py-2 hover:bg-gray-100 transition-colors">Mi cuenta</Link>
                    <Link href={isZoSystemTenant ? "/orders" : `/t/${currentTenantSlug}/orders`} className="block px-4 py-2 hover:bg-gray-100 transition-colors">Mis pedidos</Link>
                    <Link href={isZoSystemTenant ? "/favorites" : `/t/${currentTenantSlug}/favorites`} className="block px-4 py-2 hover:bg-gray-100 transition-colors">Favoritos</Link>
                    <hr className="my-2" />
                    <Link href={isZoSystemTenant ? "/login" : `/t/${currentTenantSlug}/login`} className="block px-4 py-2 hover:bg-gray-100 transition-colors">Iniciar sesión</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders */}
            <Link href={isZoSystemTenant ? "/orders" : `/t/${currentTenantSlug}/orders`} className="flex flex-col items-start hover:bg-gray-800 px-2 py-1 rounded transition-colors duration-150">
              <span className="text-xs text-gray-600">Devoluciones</span>
              <span className="text-sm font-semibold">y Pedidos</span>
            </Link>

            {/* Cart - Con badge mejorado */}
            <Link href={isZoSystemTenant ? "/cart" : `/t/${currentTenantSlug}/cart`} className="flex items-center hover:bg-gray-800 px-3 py-2 rounded transition-colors duration-150 relative">
              <div className="relative mr-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold shadow-md">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold">Carrito</span>
            </Link>
          </div>
        </div>

        {/* Secondary Nav */}
        <div className="border-t border-gray-700 py-2">
          <div className="flex items-center space-x-6 text-sm">
            {/* Only show global tenant navigation for zo-system */}
            {isZoSystemTenant && (
              <>
                <Link href="/tenants" className="hover:text-red-400 transition-colors">
                  📍 Todos los tenants
                </Link>
                <Link href="/" className="hover:text-red-400 transition-colors">
                  🏠 Explorar todos los tenants
                </Link>
              </>
            )}
            <Link href={isZoSystemTenant ? "/deals" : `/t/${currentTenantSlug}/deals`} className="hover:text-red-400 transition-colors">
              🔥 Ofertas del día
            </Link>
            <Link href={isZoSystemTenant ? "/customer-service" : `/t/${currentTenantSlug}/support`} className="hover:text-red-400 transition-colors">
              📞 Atención al cliente
            </Link>
            {!isZoSystemTenant && (
              <Link href={`/t/${currentTenantSlug}/about`} className="hover:text-red-400 transition-colors">
                ℹ️ Acerca de nosotros
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}