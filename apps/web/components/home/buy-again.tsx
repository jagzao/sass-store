"use client";

import { useTenantSlug } from "@/lib/tenant/client-resolver";
import { useCart } from "@/lib/cart/cart-store";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  tenant: string;
  tenantName: string;
  lastPurchased: string;
}

const recentPurchases: Product[] = [
  {
    id: "1",
    name: "Classic Manicure",
    price: 35.0,
    image: "💅",
    tenant: "wondernails",
    tenantName: "Wonder Nails",
    lastPurchased: "2024-01-15",
  },
  {
    id: "2",
    name: "Sunset Orange Polish",
    price: 22.0,
    image: "🧡",
    tenant: "wondernails",
    tenantName: "Wonder Nails",
    lastPurchased: "2024-01-15",
  },
  {
    id: "3",
    name: "Tacos de Carnitas",
    price: 12.5,
    image: "🌮",
    tenant: "nom-nom",
    tenantName: "nom-nom",
    lastPurchased: "2024-01-14",
  },
  {
    id: "4",
    name: "Vainilla Gourmet 50g",
    price: 24.0,
    image: "🍨",
    tenant: "vainilla-vargas",
    tenantName: "Vainilla Vargas",
    lastPurchased: "2024-01-10",
  },
  {
    id: "5",
    name: "SaaS Starter Kit",
    price: 299.0,
    image: "💻",
    tenant: "zo-system",
    tenantName: "Zo System",
    lastPurchased: "2024-01-12",
  },
  {
    id: "6",
    name: "API Design Package",
    price: 899.0,
    image: "🔗",
    tenant: "zo-system",
    tenantName: "Zo System",
    lastPurchased: "2024-01-08",
  },
];

export function BuyAgain() {
  // TENANT-AWARE: Only show products from current tenant
  const currentTenantSlug = useTenantSlug();
  const { addItem } = useCart();

  const tenantFilteredPurchases = recentPurchases.filter(
    (product) => product.tenant === currentTenantSlug
  );

  // If no products for current tenant, don't render the section
  if (tenantFilteredPurchases.length === 0) {
    return null;
  }

  const handleBuyNow = (product: Product) => {
    addItem({
      sku: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      variant: {
        tenant: product.tenant,
        type: "product",
      },
    });
    // Navigate to cart
    window.location.href = `/t/${product.tenant}/cart`;
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      sku: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      variant: {
        tenant: product.tenant,
        type: "product",
      },
    });
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Comprar de nuevo</h2>
        <button className="text-red-600 hover:text-red-700 font-medium hover:underline transition-all">
          Ver todo tu historial →
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tenantFilteredPurchases.map((product) => (
          <div
            key={product.id}
            className="group bg-white border border-gray-200 rounded-2xl shadow-xs hover:shadow-panel transition-all duration-200 overflow-hidden"
            style={{
              borderTopColor: "var(--color-brand, #DC2626)",
              borderTopWidth: "3px",
            }}
          >
            {/* Product Header */}
            <div className="p-4 text-center">
              <div className="text-3xl mb-2">{product.image}</div>
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                {product.name}
              </h3>

              {/* Price with brand color */}
              <p
                className="text-lg font-bold mb-2"
                style={{ color: "var(--color-brand, #DC2626)" }}
              >
                ${product.price}
              </p>

              {/* Last purchased chip */}
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {new Date(product.lastPurchased).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="p-4 pt-0 space-y-2">
              {/* 1-Click Buy Now - Prominent */}
              <button
                onClick={() => handleBuyNow(product)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:translate-y-[-1px] flex items-center justify-center"
              >
                Comprar ahora
              </button>

              {/* Add to Cart - Secondary */}
              <button
                onClick={() => handleAddToCart(product)}
                className="w-full text-gray-600 hover:text-gray-800 text-xs font-medium transition-colors py-1"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
