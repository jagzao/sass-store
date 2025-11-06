'use client';

import { useEffect, useState } from 'react';
import { useCarousel } from '@/lib/hooks/use-carousel';

interface NomNomCarouselProps {
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
  title: string;
  subtitle: string;
  price: string;
  description: string;
  image: string;
  backgroundColor: string;
}

// Move static items array outside component to prevent recreation
const items: CarouselItem[] = [
  {
    id: 1,
    title: "Caffe Latte",
    subtitle: "Un nuevo producto",
    price: "$20",
    description: "Delicioso café latte preparado con los mejores granos arábicos y leche vaporizada a la perfección. Una experiencia única para tu paladar.",
    image: "☕",
    backgroundColor: "#9c4d2f"
  },
  {
    id: 2,
    title: "Strawberry Mocha",
    subtitle: "Un nuevo producto",
    price: "$22",
    description: "Combinación perfecta de chocolate, café y fresas frescas. Una bebida dulce y refrescante que despertará todos tus sentidos.",
    image: "🍓",
    backgroundColor: "#f5bfaf"
  },
  {
    id: 3,
    title: "Doppio Espresso",
    subtitle: "Un nuevo producto",
    price: "$18",
    description: "Doble shot de espresso italiano auténtico. Intenso, aromático y con el cuerpo perfecto para los verdaderos amantes del café.",
    image: "☕",
    backgroundColor: "#dedfe1"
  },
  {
    id: 4,
    title: "Matcha Latte Macchiato",
    subtitle: "Un nuevo producto",
    price: "$25",
    description: "Té verde matcha premium de Japón combinado con leche cremosa. Una experiencia zen en cada sorbo con beneficios antioxidantes.",
    image: "🍵",
    backgroundColor: "#7eb63d"
  }
];

export function NomNomCarousel({ tenantData }: NomNomCarouselProps) {

  const countItem = items.length;

  // Use shared carousel logic (start at index 1, loop enabled, auto-play 5s)
  const carousel = useCarousel({
    itemCount: countItem,
    autoPlayInterval: 5000,
    initialIndex: 1,
    loop: true
  });

  // NomNom-specific: Track other visible slides for 3-slide layout
  const [other_1, setOther_1] = useState(0);
  const [other_2, setOther_2] = useState(2);
  const [carouselDirection, setCarouselDirection] = useState<'next' | 'prev' | null>(null);

  // Update other_1 and other_2 when active changes
  useEffect(() => {
    setOther_1(carousel.active - 1 < 0 ? countItem - 1 : carousel.active - 1);
    setOther_2(carousel.active + 1 >= countItem ? 0 : carousel.active + 1);
  }, [carousel.active, countItem]);

  // Custom navigation with direction tracking
  const handleNext = () => {
    setCarouselDirection('next');
    carousel.handleNext();
  };

  const handlePrev = () => {
    setCarouselDirection('prev');
    carousel.handlePrev();
  };

  // Early return AFTER all hooks are called
  if (!carousel.isMounted) {
    return <div className="h-screen bg-gradient-to-br from-green-600 to-green-800 animate-pulse" />;
  }

  const getItemClass = (index: number) => {
    if (index === carousel.active) return 'active';
    if (index === other_1) return 'other_1';
    if (index === other_2) return 'other_2';
    return '';
  };

  return (
    <div className="relative h-screen overflow-hidden" style={{ backgroundColor: '#4f8b69', fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <header className="relative z-10 grid h-20" style={{ gridTemplateColumns: '80px 1fr 750px', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
        <div className="flex items-center justify-center">
          <div className="text-4xl">🍽️</div>
        </div>
        <nav style={{ borderLeft: '1px solid rgba(255,255,255,0.3)' }}>
          <ul className="h-full flex justify-end items-center gap-8 pr-8 m-0 p-0 list-none">
            <li><a href={`/t/${tenantData.slug}`} className="text-black font-medium no-underline hover:opacity-80">Coffee</a></li>
            <li><a href={`/t/${tenantData.slug}/products`} className="text-black font-medium no-underline hover:opacity-80">Menu</a></li>
            <li><a href={`/t/${tenantData.slug}/services`} className="text-black font-medium no-underline hover:opacity-80">About</a></li>
          </ul>
        </nav>
      </header>

      {/* Carousel */}
      <main className={`carousel w-full h-screen overflow-hidden ${carouselDirection || ''}`} style={{ marginTop: '-80px' }}>
        <div className="list h-full relative">
          {/* Decorative vertical lines */}
          <div
            className="absolute h-full top-0 pointer-events-none z-10"
            style={{
              width: '500px',
              left: 'calc(100% - 750px)',
              borderLeft: '1px solid rgba(255,255,255,0.3)',
              borderRight: '1px solid rgba(255,255,255,0.3)'
            }}
          />

          {/* Background blur element */}
          <div
            className="absolute top-12 left-12 w-96 h-72 z-10 pointer-events-none opacity-60"
            style={{
              backgroundColor: 'red',
              borderRadius: '20px 50px 110px 230px',
              filter: 'blur(150px)'
            }}
          />

          {items.map((item, index) => {
            const itemClass = getItemClass(index);
            const isVisible = itemClass === 'active' || itemClass === 'other_1' || itemClass === 'other_2';

            return (
              <article
                key={item.id}
                className={`item absolute top-0 left-0 w-full h-full ${itemClass}`}
                style={{ display: isVisible ? 'block' : 'none' }}
              >
                {/* Main Content */}
                <div
                  className="main-content h-full"
                  style={{
                    backgroundColor: item.backgroundColor,
                    display: 'grid',
                    gridTemplateColumns: 'calc(100% - 750px)'
                  }}
                >
                  <div className="content" style={{ padding: '150px 20px 20px 80px' }}>
                    <h2 className="text-6xl font-bold mb-4" style={{ fontFamily: 'serif', fontSize: '5em' }}>
                      {item.title}
                    </h2>
                    <p className="text-4xl font-bold mb-6" style={{ fontFamily: 'serif', fontSize: '3em', margin: '20px 0' }}>
                      {item.price}
                    </p>
                    <p className="text-base mb-8 leading-relaxed">
                      {item.description}
                    </p>
                    <button
                      className="text-white font-medium rounded-full border-none text-lg font-medium"
                      style={{
                        backgroundColor: '#4f8b69',
                        padding: '10px 30px',
                        marginTop: '20px'
                      }}
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>

                {/* Image */}
                <figure
                  className="image absolute top-0 h-full p-5 flex flex-col justify-end items-center font-medium"
                  style={{
                    width: '500px',
                    left: 'calc(100% - 750px)'
                  }}
                >
                  <div
                    className="mb-5"
                    style={{
                      fontSize: '200px',
                      filter: 'drop-shadow(0 150px 50px rgba(158,12,12,0.33))'
                    }}
                  >
                    {item.image}
                  </div>
                  <figcaption
                    className="font-bold text-right mb-8"
                    style={{
                      fontFamily: 'serif',
                      fontSize: '1.3em',
                      width: '70%'
                    }}
                  >
                    {item.title}, {item.subtitle}
                  </figcaption>
                </figure>
              </article>
            );
          })}
        </div>

        {/* Arrows */}
        <div
          className="arrows absolute bottom-5 z-10 gap-3"
          style={{
            width: 'calc(100% - 750px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 50px)',
            gridTemplateRows: '50px',
            justifyContent: 'end'
          }}
        >
          <button
            onClick={handlePrev}
            className="bg-transparent text-white font-mono text-lg font-bold cursor-pointer transition-all duration-500 hover:bg-white hover:bg-opacity-30"
            style={{
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              lineHeight: '0',
              boxShadow: '0 10px 40px rgba(85,85,85,0.3)'
            }}
          >
            &lt;
          </button>
          <button
            onClick={handleNext}
            className="bg-transparent text-white font-mono text-lg font-bold cursor-pointer transition-all duration-500 hover:bg-white hover:bg-opacity-30"
            style={{
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              lineHeight: '0',
              boxShadow: '0 10px 40px rgba(85,85,85,0.3)'
            }}
          >
            &gt;
          </button>
        </div>
      </main>

      <style jsx>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          text-decoration: none;
          list-style: none;
        }

        .carousel .list .item.active .main-content {
          animation: showContent 1s ease-in-out forwards;
        }

        @keyframes showContent {
          from {
            clip-path: circle(0% at 70% 50%);
          }
          to {
            clip-path: circle(100% at 70% 50%);
          }
        }

        .carousel .list .item.active {
          z-index: 2;
        }

        .carousel .list .item.other_1,
        .carousel .list .item.other_2 {
          pointer-events: none;
        }

        .next .item.other_1 {
          z-index: 1;
        }

        .next .item .image img,
        .next .item .image figcaption {
          animation: effectNext 0.5s ease-in-out forwards;
        }

        @keyframes effectNext {
          from {
            transform: translateX(var(--transform-from));
          }
          to {
            transform: translateX(calc(var(--transform-from) - 500px));
          }
        }

        .next .item.active .image {
          --transform-from: 500px;
        }

        .next .item.other_1 .image {
          z-index: 3;
          --transform-from: 0px;
          overflow: hidden;
        }

        .next .item.other_2 .image {
          z-index: 3;
          --transform-from: 1000px;
        }

        .prev .item .image img,
        .prev .item .image figcaption {
          animation: effectPrev 0.5s ease-in-out forwards;
        }

        @keyframes effectPrev {
          from {
            transform: translateX(var(--transform-from));
          }
          to {
            transform: translateX(calc(var(--transform-from) + 500px));
          }
        }

        .prev .item.active .image {
          --transform-from: -500px;
          overflow: hidden;
        }

        .prev .item.other_1 .image {
          --transform-from: 0px;
          z-index: 3;
        }

        .prev .item.other_2 .image {
          z-index: 3;
          --transform-from: 500px;
        }

        .prev .item.other_2 .main-content {
          opacity: 0;
        }

        @media screen and (max-width: 1023px) {
          header {
            grid-template-columns: 80px 1fr 400px !important;
          }

          .carousel .list .item .main-content .content h2 {
            font-size: 3rem !important;
          }
        }

        @media screen and (max-width: 767px) {
          .carousel .list .item .image {
            width: 100% !important;
            left: 0 !important;
            justify-content: center;
          }

          .carousel .list .item .image figcaption {
            color: white !important;
            width: 100% !important;
            text-align: center;
          }

          .carousel .list .item .main-content .content {
            display: none !important;
          }

          .arrows {
            left: 50% !important;
            justify-content: center !important;
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}