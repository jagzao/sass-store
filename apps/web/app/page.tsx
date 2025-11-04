import { TopNav } from "@/components/navigation/top-nav";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { BuyAgain } from "@/components/home/buy-again";
import { BookAgain } from "@/components/home/book-again";
import { ContinueShopping } from "@/components/home/continue-shopping";
import { Trending } from "@/components/home/trending";
import { TenantService } from "@/lib/db/tenant-service";
import { headers } from "next/headers";
// import { MiniCart } from '@/components/cart/mini-cart';

export default async function HomePage() {
  const headersList = await headers();
  const currentTenant = headersList.get("x-tenant") || "zo-system";
  const isZoSystemTenant = currentTenant === "zo-system";

  // Get tenant data for non-zo-system tenants
  let tenantData = null;
  let featuredServices: any[] = [];
  let featuredProducts: any[] = [];

  if (!isZoSystemTenant) {
    try {
      tenantData = await TenantService.getTenantBySlug(currentTenant);
      if (tenantData) {
        const featuredItems = await TenantService.getFeaturedItems(
          tenantData.id,
          3,
        );
        featuredServices = featuredItems.services || [];
        featuredProducts = featuredItems.products || [];
      }
    } catch (error) {
      console.error("Error loading tenant data:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Hero Carousel - Only show for non-zo-system tenants with data */}
        {!isZoSystemTenant && tenantData && (
          <HeroCarousel
            featuredServices={featuredServices}
            featuredProducts={featuredProducts}
            tenantData={tenantData}
          />
        )}

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Buy Again Section */}
          <BuyAgain />

          {/* Continue Shopping Section */}
          <ContinueShopping />

          {/* Book Again Section */}
          <BookAgain />

          {/* Trending Section */}
          <Trending />
        </div>

        {/* Quick Access to All Tenants - Only visible for zo-system tenant */}
        {isZoSystemTenant && (
          <section className="mt-12 bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Explorar todos los tenants</h2>
              <a
                href="/tenants"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Ver directorio completo →
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <a
                href="/t/wondernails"
                className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow block"
              >
                <div className="text-3xl mb-2">💅</div>
                <div className="text-sm font-medium">Wonder Nails</div>
                <div className="text-xs text-gray-500">Manicure</div>
              </a>

              <a
                href="/t/vigistudio"
                className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow block"
              >
                <div className="text-3xl mb-2">✂️</div>
                <div className="text-sm font-medium">Vigi Studio</div>
                <div className="text-xs text-gray-500">Cabello</div>
              </a>

              <a
                href="/t/centro-tenistico"
                className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow block"
              >
                <div className="text-3xl mb-2">🎾</div>
                <div className="text-sm font-medium">Centro Tenístico</div>
                <div className="text-xs text-gray-500">Tenis</div>
              </a>

              <a
                href="/t/vainilla-vargas"
                className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow block"
              >
                <div className="text-3xl mb-2">🍨</div>
                <div className="text-sm font-medium">Vainilla Vargas</div>
                <div className="text-xs text-gray-500">Vainilla</div>
              </a>

              <a
                href="/t/delirios"
                className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow block"
              >
                <div className="text-3xl mb-2">🍽️</div>
                <div className="text-sm font-medium">Delirios</div>
                <div className="text-xs text-gray-500">Comida saludable</div>
              </a>

              <a
                href="/t/nom-nom"
                className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow block"
              >
                <div className="text-3xl mb-2">🌮</div>
                <div className="text-sm font-medium">nom-nom</div>
                <div className="text-xs text-gray-500">Tacos</div>
              </a>

              <a
                href="/t/zo-system"
                className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow block"
              >
                <div className="text-3xl mb-2">💻</div>
                <div className="text-sm font-medium">Zo System</div>
                <div className="text-xs text-gray-500">Software</div>
              </a>
            </div>
          </section>
        )}
      </main>

      {/* Sticky Mini Cart - temporarily disabled */}
      {/* <MiniCart isVisible={true} onClose={() => {}} /> */}

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">SaaS Store</h3>
              <p className="text-gray-600 text-sm">
                Plataforma multitenant para servicios y productos locales.
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-4">Categorías</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-white">
                    Belleza
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Deportes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Comida
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Productos
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-4">Ayuda</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-white">
                    Centro de ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Términos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacidad
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-4">Para Negocios</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-white">
                    Registrar tenant
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Soporte
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-600 text-sm">
            <p>&copy; 2024 SaaS Store. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}