'use client';

import { useEffect, useRef } from 'react';
import { useCarousel } from '@/lib/hooks/use-carousel';

interface DeliriosCarouselProps {
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

interface CarouselItem {
  id: number;
  image: string;
  title: string;
  description: string;
}

// Move static items array outside component to prevent recreation
const items: CarouselItem[] = [
  {
    id: 1,
    image: "🍰",
    title: "Torta de Chocolate",
    description: "Deliciosa torta de chocolate con crema batida y fresas frescas"
  },
  {
    id: 2,
    image: "🧁",
    title: "Cupcakes Gourmet",
    description: "Cupcakes artesanales con decoraciones únicas y sabores exóticos"
  },
  {
    id: 3,
    image: "🍪",
    title: "Galletas Caseras",
    description: "Galletas horneadas diariamente con ingredientes naturales"
  },
  {
    id: 4,
    image: "🥧",
    title: "Tartas Frutales",
    description: "Tartas con frutas de temporada y masa quebrada artesanal"
  },
  {
    id: 5,
    image: "🍮",
    title: "Postres Cremosos",
    description: "Flanes, mousses y cremas preparadas con recetas tradicionales"
  }
];

export function DeliriosCarousel({ tenantData }: DeliriosCarouselProps) {

  const listRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  const count = items.length;
  const widthItem = 300;
  const radius = widthItem;

  // Use shared carousel logic (start at index 1, no loop for Delirios style)
  const carousel = useCarousel({
    itemCount: count,
    autoPlayInterval: 0, // Delirios doesn't auto-play
    initialIndex: 1,
    loop: false
  });

  // Custom transform for Delirios' horizontal sliding effect
  useEffect(() => {
    if (!listRef.current) return;
    const leftTransform = widthItem * (carousel.active - 1) * -1;
    listRef.current.style.transform = `translateX(${leftTransform}px)`;
  }, [carousel.active, widthItem]);

  // Initialize circular text
  useEffect(() => {
    if (!circleRef.current || !carousel.isMounted) return;

    const textCircle = "DELIRIOS BAKERY - SABORES ÚNICOS - POSTRES ARTESANALES - ";
    const textArray = textCircle.split('');

    circleRef.current.innerHTML = '';

    textArray.forEach((char, index) => {
      const span = document.createElement('span');
      span.innerText = char;
      const rotateAngle = (360 / textArray.length) * (index + 1);
      span.style.setProperty('--rotate', `${rotateAngle}deg`);
      span.className = 'circle-char';
      circleRef.current?.appendChild(span);
    });
  }, [carousel.isMounted]);

  // Early return AFTER all hooks are called
  if (!carousel.isMounted) {
    return <div className="h-screen bg-gray-900 animate-pulse" />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 font-sans">
      {/* Header */}
      <header className="h-12 flex justify-between items-center px-12 relative z-10">
        <div className="text-white font-bold">{tenantData.name.toUpperCase()}</div>
        <nav>
          <ul className="flex gap-8 p-0 m-0 list-none text-white">
            <li><a href={`/t/${tenantData.slug}`} className="hover:opacity-80">INICIO</a></li>
            <li><a href={`/t/${tenantData.slug}/products`} className="hover:opacity-80">PRODUCTOS</a></li>
            <li><a href={`/t/${tenantData.slug}/login`} className="hover:opacity-80">LOGIN</a></li>
          </ul>
        </nav>
      </header>

      {/* Slider */}
      <div className="slider relative w-screen h-screen overflow-hidden -mt-12">
        {/* Background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle, ${tenantData.branding.primaryColor}33, transparent 50%)`
          }}
        />

        {/* Items List */}
        <div
          ref={listRef}
          className="list absolute w-max h-full flex justify-start items-center transition-transform duration-700 ease-in-out"
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`item text-center transition-transform duration-1000 ${
                index === carousel.active ? 'active' : ''
              }`}
              style={{
                width: `${radius * 2}px`,
                transform: index === carousel.active ? 'rotate(0deg)' : 'rotate(45deg)'
              }}
            >
              <div className="text-[200px] mb-4 filter drop-shadow-lg">
                {item.image}
              </div>
            </div>
          ))}
        </div>

        {/* Circular Text */}
        <div
          ref={circleRef}
          className="circle absolute inset-0 pointer-events-none"
          style={{
            mask: `radial-gradient(${radius}px, transparent 98%, #000)`,
            WebkitMask: `radial-gradient(${radius}px, transparent 100%, #000)`,
            backdropFilter: 'blur(10px)',
            background: `radial-gradient(${radius + 1}px, rgba(238,238,238,0.3) 100%, rgba(238,238,238,0.1))`
          }}
        />

        {/* Content */}
        <div className="content absolute bottom-[5%] left-1/2 transform -translate-x-1/2 text-center text-white w-max">
          <div className="text-left uppercase transform translate-y-5">menú</div>
          <div className="text-6xl uppercase tracking-[10px] font-bold relative">
            {items[carousel.active]?.title || 'DELIRIOS'}
            <div
              className="absolute left-[60%] bottom-1/2 w-20 h-20 bg-contain bg-no-repeat opacity-60"
              style={{
                backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQwIDEwQzQwIDEwIDUwIDIwIDYwIDMwQzUwIDQwIDQwIDUwIDMwIDQwQzIwIDMwIDMwIDIwIDQwIDEwWiIgZmlsbD0iIzBBRkY5MCIvPgo8L3N2Zz4K)'
              }}
            />
          </div>
          <div className="text-sm mb-4 max-w-md mx-auto">
            {items[carousel.active]?.description || tenantData.description}
          </div>
          <button
            className="border border-white/50 bg-transparent text-white font-sans tracking-[5px] rounded-2xl px-5 py-3 hover:bg-white/10 transition-colors"
          >
            Ver Más
          </button>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={carousel.handlePrev}
          disabled={carousel.isFirst}
          className="absolute top-1/2 left-5 transform -translate-y-1/2 w-12 h-12 rounded-full bg-transparent border border-white/60 bg-white/30 text-white text-xl font-mono cursor-pointer z-10 hover:bg-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          &lt;
        </button>
        <button
          onClick={carousel.handleNext}
          disabled={carousel.isLast}
          className="absolute top-1/2 right-5 transform -translate-y-1/2 w-12 h-12 rounded-full bg-transparent border border-white/60 bg-white/30 text-white text-xl font-mono cursor-pointer z-10 hover:bg-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
      </div>

      <style jsx>{`
        .circle :global(.circle-char) {
          display: block;
          position: absolute;
          height: calc(${radius * 2}px + 50px);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(var(--rotate));
          text-transform: uppercase;
          color: #fff;
          font-size: 12px;
          animation: circleRotate 20s linear infinite;
        }

        @keyframes circleRotate {
          to {
            transform: translate(-50%, -50%) rotate(calc(var(--rotate) + 360deg));
          }
        }

        .slider {
          background-color: #17232a;
          background-image: radial-gradient(rgba(255,255,255,0.2), transparent 50%);
        }

        @media (max-width: 768px) {
          .content div:nth-child(2) {
            font-size: 3rem;
            letter-spacing: 5px;
          }

          .item {
            width: 200px !important;
          }

          .item div {
            font-size: 120px !important;
          }
        }
      `}</style>
    </div>
  );
}