"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import { useCart } from '@/lib/cart/cart-store';
import { LiveRegionProvider } from '@/components/a11y/LiveRegion';

export default function ProductsPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const { addItem } = useCart();

  const [tenantData, setTenantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenantData = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantSlug}`);
        if (response.ok) {
          const data = await response.json();
          setTenantData(data);
        }
      } catch (error) {
        console.error('Error loading tenant:', error);
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

    addItem({
      sku: product.id,
      name: product.name,
      quantity,
      variant: {
        id: product.id,
        type: 'product',
        tenant: tenantSlug,
        price: product.price,
        image: metadata?.image || '📦'
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">No se pudo cargar el tenant.</p>
          <a href="/t/zo-system" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Ir a la Tienda Principal
          </a>
        </div>
      </div>
    );
  }

  const branding = tenantData.branding as any;
  const categories = Array.from(new Set(tenantData.products.map((p: any) => p.metadata?.category || 'general')));
  const hasServices = tenantData.services.length > 0;

  return (
    <LiveRegionProvider>
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white"
         style={{background: `linear-gradient(to bottom, ${branding.primaryColor}10, white)`}}>

      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href={`/t/${tenantSlug}`}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Volver a {tenantData.name}
              </a>
              <h1 className="text-2xl font-bold" style={{color: branding.primaryColor}}>
                Productos
              </h1>
            </div>
            <nav className="flex space-x-4">
              {hasServices && (
                <a href={`/t/${tenantSlug}/services`} className="text-gray-600 hover:text-gray-900">Servicios</a>
              )}
              <a href={`/t/${tenantSlug}/cart`} className="text-gray-600 hover:text-gray-900">Carrito</a>
              <a href={`/t/${tenantSlug}/login`} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Login</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                Todos
              </button>
              {categories.map((category) => (
                <button key={String(category)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 capitalize">
                  {String(category).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tenantData.products.map((product: any) => {
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

        {/* Quick Purchase Flow */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Compra Rápida (≤3 clicks)</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold"
                   style={{backgroundColor: branding.primaryColor}}>
                1
              </div>
              <h3 className="font-semibold mb-2">Seleccionar</h3>
              <p className="text-gray-600 text-sm">Elige tu producto favorito</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold"
                   style={{backgroundColor: branding.primaryColor}}>
                2
              </div>
              <h3 className="font-semibold mb-2">Confirmar</h3>
              <p className="text-gray-600 text-sm">Revisar detalles del pedido</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold"
                   style={{backgroundColor: branding.primaryColor}}>
                3
              </div>
              <h3 className="font-semibold mb-2">Pagar</h3>
              <p className="text-gray-600 text-sm">Finalizar compra</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </LiveRegionProvider>
  );
}
