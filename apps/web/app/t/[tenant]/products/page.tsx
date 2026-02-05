import { getTenantDataForPage } from "@/lib/db/tenant-service";
import ProductCard from "@/components/products/ProductCard";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { Product, ProductMetadata, TenantBranding } from "@/types/tenant";

interface ProductsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const resolvedParams = await params;
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);
  const { branding, products, slug: tenantSlug } = tenantData;

  const categories = Array.from(
    new Set(products.map((p: Product) => p.metadata?.category || "general")),
  );

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
          {products.map((product: Product) => {
            const metadata: ProductMetadata = product.metadata || {};
            // Pass branding.primaryColor if available, or fall back to a default
            const primaryColor = branding?.primaryColor || "#000000";

            // Safe casting for metadata properties
            const image =
              typeof metadata.image === "string" ? metadata.image : undefined;
            const category =
              typeof metadata.category === "string"
                ? metadata.category
                : "general";

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description || ""}
                price={Number(product.price)}
                image={image}
                category={category}
                primaryColor={primaryColor}
                tenantSlug={tenantSlug}
                metadata={metadata}
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
                style={{ backgroundColor: branding?.primaryColor || "#000" }}
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
                style={{ backgroundColor: branding?.primaryColor || "#000" }}
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
                style={{ backgroundColor: branding?.primaryColor || "#000" }}
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
