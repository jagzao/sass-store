"use client";

import { useTenantSlug } from "@/lib/tenant/client-resolver";
import { useCart } from "@/lib/cart/cart-store";
import { StaggerContainer } from "@/components/animations/stagger-container";
import { motion } from "framer-motion";
import { itemVariants } from "@/components/animations/stagger-container";

interface TrendingItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  tenant: string;
  tenantName: string;
  category: string;
  type: "product" | "service";
  discount?: number;
  trending: "hot" | "new" | "deal";
  salesCount: number;
}

const trendingItems: TrendingItem[] = [
  {
    id: "1",
    name: "Gel Manicure",
    price: 44.0,
    originalPrice: 55.0,
    image: "✨",
    tenant: "wondernails",
    tenantName: "Wonder Nails",
    category: "beauty",
    type: "service",
    discount: 20,
    trending: "deal",
    salesCount: 127,
  },
  {
    id: "2",
    name: "Tacos de Pastor (3 pzs)",
    price: 8.5,
    image: "🌮",
    tenant: "nom-nom",
    tenantName: "nom-nom",
    category: "food",
    type: "product",
    trending: "hot",
    salesCount: 89,
  },
  {
    id: "3",
    name: "Vainilla Gourmet 25g",
    price: 15.0,
    image: "🍨",
    tenant: "vainilla-vargas",
    tenantName: "Vainilla Vargas",
    category: "food",
    type: "product",
    trending: "new",
    salesCount: 34,
  },
  {
    id: "4",
    name: "Group Tennis Class",
    price: 28.0,
    originalPrice: 35.0,
    image: "👥",
    tenant: "centro-tenistico",
    tenantName: "Centro Tenístico",
    category: "sports",
    type: "service",
    discount: 20,
    trending: "deal",
    salesCount: 45,
  },
  {
    id: "5",
    name: "Signature Blowout",
    price: 45.0,
    image: "💨",
    tenant: "vigistudio",
    tenantName: "Vigi Studio",
    category: "beauty",
    type: "service",
    trending: "hot",
    salesCount: 67,
  },
  {
    id: "6",
    name: "Tech Consultation",
    price: 150.0,
    image: "🧠",
    tenant: "zo-system",
    tenantName: "Zo System",
    category: "software",
    type: "service",
    trending: "hot",
    salesCount: 23,
  },
  {
    id: "7",
    name: "SaaS Starter Kit",
    price: 299.0,
    originalPrice: 399.0,
    image: "💻",
    tenant: "zo-system",
    tenantName: "Zo System",
    category: "software",
    type: "product",
    discount: 25,
    trending: "deal",
    salesCount: 15,
  },
];

export function Trending() {
  // TENANT-AWARE: Only show trending items from current tenant
  const currentTenantSlug = useTenantSlug();
  const { addItem } = useCart();
  const tenantFilteredItems = trendingItems.filter(
    (item) => item.tenant === currentTenantSlug
  );

  // If no trending items for current tenant, don't render the section
  if (tenantFilteredItems.length === 0) {
    return null;
  }

  const getTrendingBadge = (trending: string) => {
    switch (trending) {
      case "hot":
        return { text: "🔥 HOT", bg: "bg-red-100", color: "text-red-800" };
      case "new":
        return { text: "✨ NUEVO", bg: "bg-blue-100", color: "text-blue-800" };
      case "deal":
        return {
          text: "💰 OFERTA",
          bg: "bg-green-100",
          color: "text-green-800",
        };
      default:
        return { text: "", bg: "", color: "" };
    }
  };

  const handleAction = (item: TrendingItem) => {
    if (item.type === "service") {
      // Navigate to booking page for services
      window.location.href = `/t/${item.tenant}/booking/new?service=${item.id}`;
    } else {
      // Add product to cart
      addItem({
        sku: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        variant: {
          tenant: item.tenant,
          type: "product",
        },
      });
      // Navigate to cart
      window.location.href = `/t/${item.tenant}/cart`;
    }
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Trending ahora</h2>
        <button className="text-red-600 hover:text-red-700 font-medium hover:underline transition-all">
          Ver todas las ofertas →
        </button>
      </div>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tenantFilteredItems.map((item) => {
          const badge = getTrendingBadge(item.trending);

          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="group bg-white border border-gray-200 rounded-2xl shadow-xs hover:shadow-panel transition-all duration-200 overflow-hidden relative"
              style={{
                borderTopColor: "var(--color-brand, #DC2626)",
                borderTopWidth: "3px",
              }}
            >
              {/* Badge Overlay */}
              <div className="absolute top-3 left-3 z-10">
                <div
                  className={`${badge.bg} ${badge.color} px-2 py-1 rounded-full text-xs font-bold shadow-sm`}
                >
                  {badge.text}
                </div>
              </div>

              {/* Discount Badge */}
              {item.discount && (
                <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm z-10">
                  -{item.discount}%
                </div>
              )}

              {/* Card Content */}
              <div className="p-4 pt-8 text-center">
                <div className="text-3xl mb-3">{item.image}</div>

                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                  {item.name}
                </h3>

                {/* Price Section */}
                <div className="mb-4">
                  {item.originalPrice ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-2">
                        <span
                          className="text-lg font-bold"
                          style={{ color: "var(--color-brand, #DC2626)" }}
                        >
                          ${item.price}
                        </span>
                        <span className="text-sm text-gray-600 line-through">
                          ${item.originalPrice}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span
                      className="text-lg font-bold"
                      style={{ color: "var(--color-brand, #DC2626)" }}
                    >
                      ${item.price}
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleAction(item)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:translate-y-[-1px] mb-3"
                >
                  {item.type === "service" ? "Reservar ahora" : "Comprar ahora"}
                </button>

                {/* Stats and Category */}
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <span className="inline-flex items-center">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {item.salesCount}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{item.category}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </StaggerContainer>
    </section>
  );
}
