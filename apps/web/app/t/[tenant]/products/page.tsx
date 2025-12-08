"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import TenantPageSkeleton from "@/components/ui/TenantPageSkeleton";
import { useCart } from "@/lib/cart/cart-store";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { buildApiUrl } from "@/lib/api/client-config";
import type {
  TenantData,
  Product,
  ProductMetadata,
  TenantBranding,
} from "@/types/tenant";
import TenantHeader from "@/components/ui/TenantHeader";

export default function ProductsPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const { addItem } = useCart();

  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenantData = async () => {
      try {
        console.log(
          "[PRODUCTS PAGE] Starting to load tenant data for:",
          tenantSlug,
        );

        // Cargar tenant y productos en paralelo para mejor performance
        const tenantUrl = buildApiUrl(`/api/tenants/${tenantSlug}`);
        const productsUrl = buildApiUrl(
          `/api/v1/public/products?tenant=${tenantSlug}&limit=20`,
        );

        console.log("[PRODUCTS PAGE] Fetching from:", {
          tenantUrl,
          productsUrl,
        });

        const [tenantResponse, productsResponse] = await Promise.all([
          fetch(tenantUrl).then((r) => {
            console.log("[PRODUCTS PAGE] Tenant API response:", r.ok, r.status);
            return r.ok ? r.json() : null;
          }),
          fetch(productsUrl).then((r) => {
            console.log(
              "[PRODUCTS PAGE] Products API response:",
              r.ok,
              r.status,
            );
            return r.ok ? r.json() : null;
          }),
        ]);

        console.log("[PRODUCTS PAGE] Tenant response:", tenantResponse);
        console.log("[PRODUCTS PAGE] Products response:", productsResponse);

        const tenantInfo = tenantResponse;
        const products = productsResponse?.data || [];

        console.log(
          "[PRODUCTS PAGE] Processed - tenantInfo:",
          !!tenantInfo,
          "products count:",
          products.length,
        );

        // Combine data
        if (tenantInfo) {
          console.log(
            "[PRODUCTS PAGE] Setting tenant data with real tenant info",
          );
          setTenantData({
            ...tenantInfo,
            products: products,
          });
        } else {
          // Fallback: just products with mock tenant data
          console.log(
            "[PRODUCTS PAGE] Setting tenant data with fallback mock data",
          );
          setTenantData({
            id: `tenant-${tenantSlug}`,
            slug: tenantSlug,
            name: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1),
            products: products,
            services: [],
            branding: { primaryColor: "#DC2626", secondaryColor: "#991B1B" },
            contact: { email: "info@example.com", phone: "+52 55 1234 5678" },
          });
        }
        console.log("[PRODUCTS PAGE] Tenant data set successfully");
      } catch (error) {
        console.error("[PRODUCTS PAGE] Error loading tenant data:", error);
      } finally {
        setLoading(false);
        console.log("[PRODUCTS PAGE] Loading complete");
      }
    };

    loadTenantData();
  }, [tenantSlug]);

  const handleAddToCart = (productId: string, quantity: number) => {
    if (!tenantData) return;

    const product = tenantData.products.find(
      (p: Product) => p.id === productId,
    );
    if (!product) return;

    const metadata: ProductMetadata = product.metadata || {};

    // Add item to cart with specified quantity
    addItem(
      {
        sku: product.id,
        name: product.name,
        price: Number(product.price),
        image: metadata.image || "📦",
        variant: {
          tenant: tenantSlug,
          type: "product",
        },
      },
      quantity,
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

  const branding: TenantBranding = tenantData.branding;
  const categories = Array.from(
    new Set(
      tenantData.products.map(
        (p: Product) => p.metadata?.category || "general",
      ),
    ),
  );
  const hasServices = tenantData.services.length > 0;

  return (
    <LiveRegionProvider>
      <div className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={String(category)}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 capitalize"
                >
                  {String(category).replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tenantData.products.map((product: Product) => {
            const metadata: ProductMetadata = product.metadata || {};
            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                image={metadata.image}
                category={metadata.category}
                primaryColor={branding.primaryColor}
                tenantSlug={tenantSlug}
                metadata={metadata}
                onAddToCart={handleAddToCart}
                variant={tenantSlug === "wondernails" ? "luxury" : "default"}
              />
            );
          })}
        </div>

        {/* Quick Purchase Flow */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Compra Rápida (≤3 clicks)
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: branding.primaryColor }}
              >
                1
              </div>
              <h3 className="font-semibold mb-2">Seleccionar</h3>
              <p className="text-gray-600 text-sm">
                Elige tu producto favorito
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: branding.primaryColor }}
              >
                2
              </div>
              <h3 className="font-semibold mb-2">Confirmar</h3>
              <p className="text-gray-600 text-sm">
                Revisar detalles del pedido
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: branding.primaryColor }}
              >
                3
              </div>
              <h3 className="font-semibold mb-2">Pagar</h3>
              <p className="text-gray-600 text-sm">Finalizar compra</p>
            </div>
          </div>
        </div>
      </div>
    </LiveRegionProvider>
  );
}
