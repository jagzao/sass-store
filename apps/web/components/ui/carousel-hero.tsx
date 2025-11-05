'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface CarouselHeroProps {
  tenantData: {
    name: string;
    description: string;
    slug: string;
    mode: string;
    branding: {
      primaryColor: string;
      secondaryColor?: string;
    };
    contact: {
      address: string;
      phone: string;
      email?: string;
    };
  };
}

export function CarouselHero({ tenantData }: CarouselHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Memoize slides generation to avoid recreation on every render
  const slides = useMemo(() => {
    const modes = {
      booking: {
        icon: '📅',
        title: 'Reserva tu Cita',
        description: 'Agenda fácilmente tus servicios favoritos',
        cta: 'Reservar Ahora'
      },
      catalog: {
        icon: '🛍️',
        title: 'Explora Nuestros Productos',
        description: 'Descubre toda nuestra selección premium',
        cta: 'Ver Catálogo'
      }
    };

    const modeData = modes[tenantData.mode as keyof typeof modes] || modes.catalog;

    return [
      {
        id: 1,
        title: tenantData.name,
        subtitle: modeData.title,
        description: tenantData.description || modeData.description,
        image: modeData.icon,
        cta: modeData.cta
      },
      {
        id: 2,
        title: tenantData.name,
        subtitle: 'Contacto Directo',
        description: `Llámanos al ${tenantData.contact.phone} o visítanos en ${tenantData.contact.address}`,
        image: '📞',
        cta: 'Contactar'
      },
      {
        id: 3,
        title: tenantData.name,
        subtitle: 'Calidad Premium',
        description: 'Comprometidos con la excelencia en cada servicio que ofrecemos',
        image: '⭐',
        cta: 'Conocer Más'
      }
    ];
  }, [tenantData.name, tenantData.mode, tenantData.description, tenantData.contact.phone, tenantData.contact.address]);

  // Memoize slide navigation handlers
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="default-hero-carousel">
      <style jsx>{`
        .default-hero-carousel {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, ${tenantData.branding.primaryColor}22, ${tenantData.branding.secondaryColor || tenantData.branding.primaryColor}11);
        }

        .slide-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          transition: transform 0.6s ease-in-out;
          transform: translateX(-${currentSlide * 100}%);
        }

        .slide {
          min-width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5%;
        }

        .slide-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          max-width: 1200px;
          width: 100%;
          align-items: center;
        }

        .text-content {
          z-index: 2;
        }

        .slide-title {
          font-size: 3rem;
          font-weight: 700;
          color: ${tenantData.branding.primaryColor};
          margin-bottom: 0.5rem;
          line-height: 1.1;
        }

        .slide-subtitle {
          font-size: 1.5rem;
          font-weight: 500;
          color: #333;
          margin-bottom: 1rem;
        }

        .slide-description {
          font-size: 1.1rem;
          color: #666;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .slide-cta {
          display: inline-block;
          padding: 1rem 2rem;
          background: ${tenantData.branding.primaryColor};
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .slide-cta:hover {
          background: ${tenantData.branding.secondaryColor || tenantData.branding.primaryColor};
          transform: translateY(-2px);
          box-shadow: 0 4px 12px ${tenantData.branding.primaryColor}40;
        }

        .image-content {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10rem;
          opacity: 0.8;
        }

        .controls {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .arrow-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          border: 2px solid ${tenantData.branding.primaryColor}40;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 1.2rem;
          color: ${tenantData.branding.primaryColor};
        }

        .arrow-btn:hover {
          background: ${tenantData.branding.primaryColor};
          color: white;
          border-color: ${tenantData.branding.primaryColor};
        }

        .indicators {
          display: flex;
          gap: 0.5rem;
          margin: 0 1rem;
        }

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${tenantData.branding.primaryColor}40;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .indicator.active {
          background: ${tenantData.branding.primaryColor};
          transform: scale(1.2);
        }

        @media (max-width: 768px) {
          .slide-content {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 2rem;
          }

          .slide-title {
            font-size: 2rem;
          }

          .slide-subtitle {
            font-size: 1.2rem;
          }

          .image-content {
            font-size: 6rem;
            order: -1;
          }

          .controls {
            bottom: 1rem;
          }

          .arrow-btn {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>

      <div className="slide-container">
        {slides.map((slide, index) => (
          <div key={slide.id} className="slide">
            <div className="slide-content">
              <div className="text-content">
                <h1 className="slide-title">{slide.title}</h1>
                <h2 className="slide-subtitle">{slide.subtitle}</h2>
                <p className="slide-description">{slide.description}</p>
                <a href="#" className="slide-cta">
                  {slide.cta}
                </a>
              </div>
              <div className="image-content">
                {slide.image}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="controls">
        <button className="arrow-btn" onClick={prevSlide} aria-label="Slide anterior">
          ←
        </button>

        <div className="indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>

        <button className="arrow-btn" onClick={nextSlide} aria-label="Slide siguiente">
          →
        </button>
      </div>
    </div>
  );
}