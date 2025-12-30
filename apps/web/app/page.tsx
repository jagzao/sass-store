import { TopNav } from "@/components/navigation/top-nav";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { BuyAgain } from "@/components/home/buy-again";
import { BookAgain } from "@/components/home/book-again";
import { ContinueShopping } from "@/components/home/continue-shopping";
import { Trending } from "@/components/home/trending";
import { TenantService } from "@/lib/db/tenant-service";
import { headers } from "next/headers";
import { CircuitSpotlight } from "@/components/ui/circuit-spotlight";
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
    <CircuitSpotlight
      className="min-h-screen"
      spotlightColor="rgba(255, 128, 0, 0.15)"
    >
      <div data-testid="home-page" className="relative z-10">
        {/* Skip to main content link for screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-black px-4 py-2 rounded font-bold"
          data-testid="skip-link"
        >
          Saltar al contenido principal
        </a>

        {/* Top Navigation */}
        <header
          className="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10"
          role="banner"
          data-testid="page-header"
        >
          <TopNav />
        </header>

        {/* Main Content */}
        <main
          role="main"
          id="main-content"
          className="container mx-auto px-4 py-6"
          data-testid="main-content"
        >
          {/* Visible H1 for accessibility and SEO */}
          <h1
            className="text-5xl md:text-6xl font-rajdhani font-bold text-center py-12 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-sm"
            data-testid="page-title"
          >
            Bienvenido a{" "}
            <span className="text-primary drop-shadow-[0_0_10px_rgba(255,128,0,0.5)]">
              SaaS Store
            </span>
          </h1>
          <div className="sr-only" aria-live="polite">
            Plataforma multitenant para servicios y productos locales
          </div>
          {/* Hero Carousel - Temporarily disabled for accessibility fixes */}
          {/* {!isZoSystemTenant && tenantData && (
          <HeroCarousel
            featuredServices={featuredServices}
            featuredProducts={featuredProducts}
            tenantData={tenantData}
          />
        )} */}

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
                <h2 className="text-2xl font-bold">
                  Explorar todos los tenants
                </h2>
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

        {/* Footer with proper ARIA landmark */}
        {/* Footer with proper ARIA landmark */}
        <footer
          role="contentinfo"
          className="bg-black/80 backdrop-blur-md border-t border-white/10 text-gray-400 mt-16"
          data-testid="page-footer"
        >
          <div className="sr-only" aria-live="polite">
            Pie de página con información del sitio
          </div>
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-rajdhani font-semibold mb-4 text-white">
                  SaaS Store
                </h3>
                <p className="text-sm">
                  Plataforma multitenant para servicios y productos locales.
                </p>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-4 text-white">
                  Categorías
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Belleza
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Deportes
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Comida
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Productos
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-4 text-white">Ayuda</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Centro de ayuda
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Contacto
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Términos
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Privacidad
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-4 text-white">
                  Para Negocios
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Registrar tenant
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      API
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Soporte
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm">
              <p>&copy; 2024 SaaS Store. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </CircuitSpotlight>
  );
}
