import dynamic from 'next/dynamic';

const CarouselHero = dynamic(() => import('./carousel-hero').then(mod => ({ default: mod.CarouselHero })), {
  ssr: false,
  loading: () => <div className="h-[800px] bg-gradient-to-r from-pink-500 to-gray-700 animate-pulse" />
});

const NomNomCarousel = dynamic(() => import('./nomnom-carousel').then(mod => ({ default: mod.NomNomCarousel })), {
  ssr: false,
  loading: () => <div className="h-screen bg-gradient-to-br from-green-600 to-green-800 animate-pulse" />
});

const DeliriosCarousel = dynamic(() => import('./delirios-carousel').then(mod => ({ default: mod.DeliriosCarousel })), {
  ssr: false,
  loading: () => <div className="h-screen bg-gray-900 animate-pulse" />
});

interface HeroConfig {
  title?: string;
  subtitle?: string;
  backgroundType?: 'gradient' | 'image' | 'solid';
  backgroundImage?: string;
  showContactInfo?: boolean;
  showActionButtons?: boolean;
  customCTA?: {
    text: string;
    href: string;
    style?: 'primary' | 'secondary';
  }[];
  layout?: 'center' | 'left' | 'right';
  textColor?: string;
  overlayOpacity?: number;
  useCarousel?: boolean; // New option for carousel
}

interface HeroSectionProps {
  tenantData: {
    name: string;
    description: string;
    slug: string;
    mode: string;
    branding: {
      primaryColor: string;
      secondaryColor?: string;
      heroConfig?: HeroConfig;
    };
    contact: {
      address: string;
      phone: string;
      email?: string;
    };
  };
}

export function HeroSection({ tenantData }: HeroSectionProps) {
  const { branding, contact } = tenantData;
  const heroConfig = branding.heroConfig || {};

  // Use carousel for wondernails or if explicitly configured
  if (tenantData.slug === 'wondernails' || heroConfig.useCarousel) {
    return <CarouselHero tenantData={tenantData} />;
  }

  // Use NomNom carousel for nomnom tenant
  if (tenantData.slug === 'nomnom') {
    return <NomNomCarousel tenantData={tenantData} />;
  }

  // Use Delirios carousel for delirios tenant
  if (tenantData.slug === 'delirios') {
    return <DeliriosCarousel tenantData={tenantData} />;
  }

  // Default configuration
  const config = {
    title: heroConfig.title || `Bienvenido a ${tenantData.name}`,
    subtitle: heroConfig.subtitle || tenantData.description,
    backgroundType: heroConfig.backgroundType || 'gradient',
    backgroundImage: heroConfig.backgroundImage,
    showContactInfo: heroConfig.showContactInfo !== false, // Default true
    showActionButtons: heroConfig.showActionButtons !== false, // Default true
    customCTA: heroConfig.customCTA || [],
    layout: heroConfig.layout || 'center',
    textColor: heroConfig.textColor || 'white',
    overlayOpacity: heroConfig.overlayOpacity || 0.8,
  };

  // Generate background style
  const getBackgroundStyle = () => {
    switch (config.backgroundType) {
      case 'image':
        return config.backgroundImage ? {
          backgroundImage: `url(${config.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative' as const,
        } : {
          background: `linear-gradient(135deg, ${branding.primaryColor}dd, ${branding.secondaryColor || branding.primaryColor}aa)`,
        };
      case 'solid':
        return {
          backgroundColor: branding.primaryColor,
        };
      default: // gradient
        return {
          background: `linear-gradient(135deg, ${branding.primaryColor}dd, ${branding.secondaryColor || branding.primaryColor}aa)`,
        };
    }
  };

  const layoutClasses = {
    center: 'text-center',
    left: 'text-left',
    right: 'text-right',
  };

  const textColorClasses = {
    white: 'text-white',
    black: 'text-gray-900',
    primary: 'text-gray-900',
  };

  return (
    <div
      className={`relative py-20 ${textColorClasses[config.textColor as keyof typeof textColorClasses] || 'text-white'}`}
      style={getBackgroundStyle()}
    >
      {/* Overlay for image backgrounds */}
      {config.backgroundType === 'image' && config.backgroundImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: 1 - config.overlayOpacity }}
        />
      )}

      <div className={`container mx-auto px-4 relative z-10 ${layoutClasses[config.layout]}`}>
        {/* Title */}
        <h1 className="text-5xl font-bold mb-6">
          {config.title}
        </h1>

        {/* Subtitle */}
        <p className="text-xl mb-8 opacity-90">
          {config.subtitle}
        </p>

        {/* Contact Info */}
        {config.showContactInfo && (
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              📍 {contact.address}
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              📞 {contact.phone}
            </div>
            {contact.email && (
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
                ✉️ {contact.email}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {config.showActionButtons && (
          <div className="flex flex-wrap justify-center gap-4">
            {/* Custom CTAs first */}
            {config.customCTA.map((cta, index) => (
              <a
                key={index}
                href={cta.href}
                className={
                  cta.style === 'secondary'
                    ? "bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-lg font-semibold hover:bg-white/30"
                    : "bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 shadow-lg"
                }
              >
                {cta.text}
              </a>
            ))}

            {/* Default CTAs if no custom ones */}
            {config.customCTA.length === 0 && (
              <>
                {tenantData.mode === "booking" && (
                  <a
                    href={`/t/${tenantData.slug}/services`}
                    className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 shadow-lg"
                  >
                    📅 Reservar Cita
                  </a>
                )}
                <a
                  href={`/t/${tenantData.slug}/products`}
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-lg font-semibold hover:bg-white/30"
                >
                  🛍️ Ver Productos
                </a>
                <a
                  href={`/t/${tenantData.slug}/reorder`}
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-lg font-semibold hover:bg-white/30"
                >
                  🔄 Reordenar
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}