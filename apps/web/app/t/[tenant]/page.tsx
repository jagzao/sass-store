"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import TenantHeroCarousel from "@/components/ui/TenantHeroCarousel";
import TenantLogo from "@/components/ui/TenantLogo";
import ProductCard from "@/components/products/ProductCard";
import ServiceCard from "@/components/services/ServiceCard";
import TenantPageSkeleton from "@/components/ui/TenantPageSkeleton";
import { useCart } from "@/lib/cart/cart-store";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import UserMenu from "@/components/auth/UserMenu";
import { preloadCriticalResources } from "@/lib/preload";
import { measureExecutionTime } from "@/lib/performance-monitoring";
import { getLoadingStrategy, useABTest } from "@/lib/ab-testing";

export default function TenantPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const { addItem, getTotalItems } = useCart();
  const totalItems = getTotalItems();

  // A/B Testing para estrategias de carga
  const { variant: loadingVariant, trackResult } = useABTest('loading-strategy');

  const [tenantData, setTenantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Preload recursos críticos inmediatamente
    preloadCriticalResources(tenantSlug);

    const loadTenantData = async () => {
      try {
        // Usar estrategia de carga basada en A/B test
        const useParallel = loadingVariant === 'parallel';

        const startTime = performance.now();

        if (useParallel) {
          // Estrategia paralela (70% de usuarios)
          try {
            const [tenantInfo, productsResponse] = await Promise.all([
              // Using local API call for tenant info (this should exist in web app)
              fetch(`/api/tenants/${tenantSlug}`).then(r => r.ok ? r.json() : null),
              // Using local API call for products
              fetch(`/api/v1/public/products?tenant=${tenantSlug}&featured=true&limit=12`).then(r => r.ok ? r.json() : null)
            ]);

            const products = productsResponse?.data || [];

            // Combine data
            if (tenantInfo) {
              setTenantData({
                ...tenantInfo,
                products: products
              });
            } else {
              // Fallback: just products with mock tenant data
              setTenantData({
                id: `tenant-${tenantSlug}`,
                slug: tenantSlug,
                name: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1),
                products: products,
                services: [],
                branding: { primaryColor: '#DC2626', secondaryColor: '#991B1B' },
                contact: { email: 'info@example.com', phone: '+52 55 1234 5678' }
              });
            }
          } catch (error) {
            console.error("Error in parallel loading:", error);
            // Fallback to basic data
            setTenantData({
              id: `tenant-${tenantSlug}`,
              slug: tenantSlug,
              name: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1),
              products: [],
              services: [],
              branding: { primaryColor: '#DC2626', secondaryColor: '#991B1B' },
              contact: { email: 'info@example.com', phone: '+52 55 1234 5678' }
            });
          }
        } else {
          // Estrategia secuencial (30% de usuarios) - cargar tenant primero
          try {
            const tenantResponse = await fetch(`/api/tenants/${tenantSlug}`);
            let tenantInfo = null;
            if (tenantResponse.ok) {
              tenantInfo = await tenantResponse.json();
            }

            // Luego cargar productos
            const productsResponse = await fetch(`/api/v1/public/products?tenant=${tenantSlug}&featured=true&limit=12`).then(r => r.ok ? r.json() : null);
            const products = productsResponse?.data || [];

            // Combine data
            if (tenantInfo) {
              setTenantData({
                ...tenantInfo,
                products: products
              });
            } else {
              // Fallback
              setTenantData({
                id: `tenant-${tenantSlug}`,
                slug: tenantSlug,
                name: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1),
                products: products,
                services: [],
                branding: { primaryColor: '#DC2626', secondaryColor: '#991B1B' },
                contact: { email: 'info@example.com', phone: '+52 55 1234 5678' }
              });
            }
          } catch (error) {
            console.error("Error in sequential loading:", error);
            // Fallback to basic data
            setTenantData({
              id: `tenant-${tenantSlug}`,
              slug: tenantSlug,
              name: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1),
              products: [],
              services: [],
              branding: { primaryColor: '#DC2626', secondaryColor: '#991B1B' },
              contact: { email: 'info@example.com', phone: '+52 55 1234 5678' }
            });
          }
        }

        const loadTime = performance.now() - startTime;

        // Trackear resultado del A/B test
        trackResult('load_time', loadTime);
      } catch (error) {
        console.error("Error loading tenant data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTenantData();
  }, [tenantSlug]);

  const handleAddToCart = (productId: string, quantity: number) => {
    if (!tenantData) return;

    const product = tenantData.products.find((p: any) => p.id === productId);
    if (!product) return;

    const metadata = product.metadata as any;

    // Add item to cart with specified quantity
    addItem(
      {
        sku: product.id,
        name: product.name,
        price: Number(product.price),
        image: metadata?.image || "📦",
        variant: {
          tenant: tenantSlug,
          type: "product",
        },
      },
      quantity
    );
  };

  if (loading) {
    return <TenantPageSkeleton />;
  }

  if (!tenantData) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">No se pudo cargar el tenant.</p>
          <a
            href="/t/zo-system"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Ir a la Tienda Principal
          </a>
        </div>
      </div>
    );
  }

  try {
    // Filter featured items
    const featuredServices = tenantData.services.filter(
      (service: any) => service.featured
    );
    const featuredProducts = tenantData.products.filter(
      (product: any) => product.featured
    );

    // Check if tenant has services
    const hasServices = tenantData.services.length > 0;

    // Parse branding and contact from JSONB
    const branding = tenantData.branding as any;
    const contact = tenantData.contact as any;

    return (
      <LiveRegionProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Simple Header - Fixed position with high z-index */}
          <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <TenantLogo
                  tenantSlug={tenantSlug}
                  tenantName={tenantData.name}
                  primaryColor={branding.primaryColor}
                />
                <nav className="flex space-x-6">
                  {/* Only show Servicios if tenant has services */}
                  {hasServices && (
                    <a
                      href={`/t/${tenantSlug}/services`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Servicios
                    </a>
                  )}
                  <a
                    href={`/t/${tenantSlug}/products`}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Productos
                  </a>
                  <a
                    href={`/t/${tenantSlug}/cart`}
                    className="text-gray-600 hover:text-gray-900 relative inline-flex items-center"
                    aria-label={`Carrito con ${totalItems} ${totalItems === 1 ? "artículo" : "artículos"}`}
                  >
                    <span className="text-3xl" role="img" aria-hidden="true">
                      🛒
                    </span>
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold shadow-md">
                        {totalItems > 99 ? "99+" : totalItems}
                      </span>
                    )}
                  </a>
                  <UserMenu tenantSlug={tenantSlug} />
                </nav>
              </div>
            </div>
          </header>

          {/* Hero Section - Registro por tenant */}
          <TenantHeroCarousel
            tenantSlug={tenantSlug}
            tenantData={{
              name: tenantData.name,
              description: tenantData.description,
              slug: tenantSlug,
              mode: tenantData.mode,
              branding,
              contact,
            }}
            autoRotate={true}
          />

          <div className="container mx-auto px-4 py-12">
            {/* Main Title - H1 for accessibility */}
            <h1
              className="text-4xl font-bold text-center mb-8"
              style={{ color: branding.primaryColor }}
            >
              {tenantData.name}
            </h1>

            {/* Featured Services */}
            {featuredServices.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Servicios Destacados
                  </h2>
                  <a
                    href={`/t/${tenantSlug}/services`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver todos →
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredServices.map((service: any) => {
                    const metadata = service.metadata as any;
                    return (
                      <ServiceCard
                        key={service.id}
                        id={service.id}
                        name={service.name}
                        description={service.description}
                        price={service.price}
                        duration={service.duration}
                        image={metadata?.image}
                        category={metadata?.category}
                        primaryColor={branding.primaryColor}
                        tenantSlug={tenantSlug}
                        metadata={metadata}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Productos Destacados
                  </h2>
                  <a
                    href={`/t/${tenantSlug}/products`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver todos →
                  </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {featuredProducts.map((product: any) => {
                    const metadata = product.metadata as any;
                    return (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        description={product.description}
                        price={product.price}
                        image={metadata?.image}
                        category={metadata?.category}
                        primaryColor={branding.primaryColor}
                        tenantSlug={tenantSlug}
                        metadata={metadata}
                        onAddToCart={handleAddToCart}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">
                Información de Contacto
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">
                    ¡Contáctanos!
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-4">📍</span>
                      <span className="text-gray-700">{contact.address}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl mr-4">📞</span>
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {contact.phone}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl mr-4">✉️</span>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">
                    Horarios de Atención
                  </h3>
                  <div className="space-y-3">
                    {contact.hours &&
                      Object.entries(contact.hours).map(([day, hours]) => (
                        <div
                          key={day}
                          className="flex justify-between py-2 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="capitalize font-medium text-gray-700">
                            {day}:
                          </span>
                          <span className="text-gray-600">{String(hours)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="text-center py-8">
              <div className="flex justify-center items-center space-x-8 text-gray-600">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🔒</span>
                  <span className="text-sm">Pagos Seguros</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🚚</span>
                  <span className="text-sm">Entrega Rápida</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">⭐</span>
                  <span className="text-sm">Calidad Garantizada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LiveRegionProvider>
    );
  } catch (error) {
    console.error("Error loading tenant page:", error);

    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">
            Hubo un error cargando la página del tenant.
          </p>
          <a
            href="/t/zo-system"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Ir a la Tienda Principal
          </a>
        </div>
      </div>
    );
  }
}
