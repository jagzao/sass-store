"use client";

import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { useCircleText } from "./useCircleText";
import styles from "./HeroDelirios.module.css";

// GSAP SSR-safe imports
type GSAPType = typeof import("gsap").gsap;
let gsap: GSAPType | null = null;

if (typeof window !== 'undefined') {
  const GS = require("gsap");
  gsap = GS.gsap;
}

export type DeliriosSlide = {
  img: string;
  title: string;
  eyebrow?: string;
  ctaText?: string;
  bgFrom?: string;
  bgTo?: string;
  accent?: string;
};

export interface HeroDeliriosProps {
  slides: DeliriosSlide[];
  initialIndex?: number;
  autoplayMs?: number;
  className?: string;
  onPrev?: (i: number) => void;
  onNext?: (i: number) => void;
  onCta?: (i: number) => void;
}

export default function HeroDelirios({
  slides,
  initialIndex = 0,
  autoplayMs = 4500,
  className = "",
  onPrev,
  onNext,
  onCta
}: HeroDeliriosProps) {
  const [active, setActive] = useState(initialIndex);
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctxRef = useRef<ReturnType<typeof gsap.context> | null>(null);
  const isPausedRef = useRef(false);
  const veil1Ref = useRef<HTMLDivElement>(null);
  const veil2Ref = useRef<HTMLDivElement>(null);
  const ornament1Ref = useRef<HTMLDivElement>(null);
  const ornament2Ref = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const circleTextChars = useCircleText();
  const slideCount = slides.length;

  // Calculate carousel horizontal slide (desplazamiento real)
  const calculateTransform = useCallback(() => {
    if (!listRef.current || !itemRefs.current[active]) return 0;
    const itemWidth = itemRefs.current[active]?.getBoundingClientRect().width || 0;
    const offset = active * itemWidth * 0.5; // 0.5 para mayor overlap
    return -offset;
  }, [active]);

  // Navigation handlers
  const goPrev = useCallback(() => {
    if (active === 0) return;
    const nextIndex = active - 1;
    setActive(nextIndex);
    onPrev?.(nextIndex);
  }, [active, onPrev]);

  const goNext = useCallback(() => {
    if (active === slideCount - 1) return;
    const nextIndex = active + 1;
    setActive(nextIndex);
    onNext?.(nextIndex);
  }, [active, slideCount, onNext]);

  const handleCta = useCallback(() => {
    onCta?.(active);
  }, [active, onCta]);

  // Autoplay control
  const startAutoplay = useCallback(() => {
    if (!gsap || isPausedRef.current || !autoplayMs) return;

    if (autoplayTimerRef.current) {
      autoplayTimerRef.current.kill();
    }

    // Progress bar animation
    if (progressRef.current) {
      gsap.fromTo(progressRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: autoplayMs / 1000,
          ease: "none",
          onComplete: () => {
            if (!isPausedRef.current && active < slideCount - 1) {
              goNext();
            }
          }
        }
      );
    }
  }, [autoplayMs, active, slideCount, goNext]);

  const pauseAutoplay = useCallback(() => {
    isPausedRef.current = true;
    if (gsap && autoplayTimerRef.current) {
      autoplayTimerRef.current.kill();
      gsap.killTweensOf(progressRef.current);
    }
  }, []);

  const resumeAutoplay = useCallback(() => {
    isPausedRef.current = false;
    startAutoplay();
  }, [startAutoplay]);

  // Mount animation - Luxury mystical theme with specific timeline phases
  useLayoutEffect(() => {
    if (!gsap || !rootRef.current) return;

    const ctx = gsap.context(() => {
      const currentSlide = slides[active];
      const bgFrom = currentSlide.bgFrom || "#0b0b10";
      const bgTo = currentSlide.bgTo || "#2a0f3e";

      // Set initial states - all hidden
      gsap.set(rootRef.current, {
        background: `radial-gradient(circle at center, ${bgFrom}, ${bgFrom})`
      });

      // Configurar todos los items visibles desde el inicio - todos del mismo tamaño
      gsap.set(itemRefs.current.filter(Boolean), {
        opacity: 1,
        scale: 1.0, // Mismo tamaño que el activo
        y: 0,
        rotateZ: 0
      });

      // Item activo nítido
      gsap.set(itemRefs.current[active], {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateZ: 0,
        filter: "blur(0px)"
      });

      // Asegura que el <img> esté sobre los velos (refuerza en runtime)
      itemRefs.current.forEach((item, i) => {
        const img = item?.querySelector(`.${styles.heroImg}`) as HTMLElement | null;
        const veil = item?.querySelector(`.${styles.heroVeil}`) as HTMLElement | null;
        if (img) {
          gsap.set(img, { zIndex: 10, opacity: 1 });
          // Establecer scale inicial según posición
          if (i === active) {
            gsap.set(img, { scale: 1.0 });
          } else if (Math.abs(i - active) === 1) {
            gsap.set(img, { scale: 0.95 });
          } else {
            gsap.set(img, { scale: 0.9 });
          }
        }
        if (veil) gsap.set(veil, { zIndex: 5, opacity: 0.45 });

        if (i !== active && item) {
          gsap.set(item, {
            filter: "blur(6px) brightness(0.85)",
            scale: 1.0, // Mismo tamaño que el activo
            opacity: 0.6
          });
        }
      });

      gsap.set([veil1Ref.current, veil2Ref.current], { opacity: 0, y: 50 });
      gsap.set([ornament1Ref.current, ornament2Ref.current], { opacity: 0, scale: 0.5 });
      gsap.set([eyebrowRef.current, titleRef.current, ctaRef.current], { opacity: 0, y: 30 });

      if (titleRef.current) {
        gsap.set(titleRef.current.children, { opacity: 0, y: 30 });
      }

      gsap.set(circleRef.current, { opacity: 0, scale: 0.9 });

      // LUXURY TIMELINE - Phases F0-F4 (3.6s total)
      const tl = gsap.timeline();

      // F0-F1 (0-900ms): Background fade + veils enter
      tl.to(rootRef.current, {
        background: `radial-gradient(circle at center, ${bgTo}, ${bgFrom})`,
        duration: 0.9,
        ease: "power1.inOut"
      }, 0);

      tl.to([veil1Ref.current, veil2Ref.current], {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: "power2.out"
      }, 0.2);

      // F2 (900-1600ms): Ornaments scale + glow + main image
      tl.to([ornament1Ref.current, ornament2Ref.current], {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: "elastic.out(1, 0.6)"
      }, 0.9);

      // Animar el contenedor del item activo
      tl.to(itemRefs.current[active], {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "power2.out"
      }, 1.0);

      // Asegurar que la imagen dentro también tenga el scale correcto
      const activeImg = itemRefs.current[active]?.querySelector(`.${styles.heroImg}`);
      if (activeImg) {
        tl.to(activeImg, {
          scale: 1.0,
          duration: 0.7,
          ease: "power2.out"
        }, 1.0);
      }

      // Circle fade in early
      tl.to(circleRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power2.out"
      }, 0.5);

      // F3 (1600-2400ms): Title + subtitle fade in (eyebrow + title words)
      if (eyebrowRef.current) {
        tl.to(eyebrowRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power3.out"
        }, 1.6);
      }

      if (titleRef.current?.children) {
        tl.to(titleRef.current.children, {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.6,
          ease: "power3.out"
        }, 1.7);
      }

      // F4 (2400-3000ms): CTA appears
      tl.to(ctaRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.4)"
      }, 2.4);

      // Start continuous breathing loops
      // Veils - slow parallax drift (3.4s cycle)
      if (veil1Ref.current) {
        gsap.to(veil1Ref.current, {
          y: -15,
          x: 10,
          rotation: 2,
          duration: 3.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }

      if (veil2Ref.current) {
        gsap.to(veil2Ref.current, {
          y: 20,
          x: -8,
          rotation: -1.5,
          duration: 3.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }

      // Ornaments - gentle scale breathing (3.2s cycle)
      if (ornament1Ref.current) {
        gsap.to(ornament1Ref.current, {
          scale: 1.08,
          opacity: 0.9,
          duration: 3.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }

      if (ornament2Ref.current) {
        gsap.to(ornament2Ref.current, {
          scale: 1.05,
          opacity: 0.85,
          duration: 3.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }

      // Circle rotation - rueda de carro completa
      if (circleRef.current) {
        const svg = circleRef.current.querySelector(`.${styles.circleSvg}`);
        if (svg) {
          gsap.to(svg, {
            rotation: 360,
            transformOrigin: "50% 50%",
            duration: 16,
            ease: 'none',
            repeat: -1
          });
        }
      }

      // Velo translúcido - loop respirante elegante
      itemRefs.current.forEach((item) => {
        if (!item) return;
        const veil = item.querySelector(`.${styles.heroVeil}`);
        if (veil) {
          gsap.to(veil, {
            opacity: 0.55,
            duration: 3.4,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
          });
        }
      });

    }, rootRef);

    ctxRef.current = ctx;

    return () => {
      if (ctxRef.current) {
        ctxRef.current.revert();
      }
      // Limpiar también cualquier animación pendiente
      if (typeof window !== 'undefined' && gsap) {
        gsap.killTweensOf('*');
      }
    };
  }, [active, slides]);

  // Slide transition animation
  useLayoutEffect(() => {
    if (!gsap || !rootRef.current || !listRef.current) return;

    const currentSlide = slides[active];
    const bgFrom = currentSlide.bgFrom || "#17232A";
    const bgTo = currentSlide.bgTo || bgFrom;

    // Background transition
    gsap.to(rootRef.current, {
      background: `radial-gradient(circle at center, ${bgTo}, ${bgFrom})`,
      duration: 0.8,
      ease: "power1.out"
    });

    // List translation - Desplazamiento horizontal del carrusel
    const translateX = calculateTransform();
    gsap.to(listRef.current, {
      x: translateX,
      duration: 1.2,
      ease: "power2.inOut"
    });

    // Update item states - Todas las imágenes visibles durante el desplazamiento
    itemRefs.current.forEach((item, i) => {
      if (!item) return;
      const img = item.querySelector(`.${styles.heroImg}`);

      if (i === active) {
        // Active item: nítida, escala normal
        gsap.to(item, {
          filter: "blur(0px) brightness(1)",
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: "power2.inOut"
        });

        if (img) {
          gsap.to(img, {
            opacity: 1,
            scale: 1.0, // Escala normal para imagen activa
            duration: 1.2,
            ease: "power2.inOut"
          });
        }
      } else if (Math.abs(i - active) === 1) {
        // Items adyacentes: ligeramente borrosos pero mismo tamaño
        gsap.to(item, {
          filter: "blur(4px) brightness(0.9)", // Menos blur para que se vean mejor
          scale: 1.0, // Mismo tamaño que el activo
          opacity: 0.85, // Muy visibles
          duration: 1.2,
          ease: "power2.inOut"
        });

        if (img) {
          gsap.to(img, {
            opacity: 1,
            scale: 1.0,
            duration: 1.2,
            ease: "power2.inOut"
          });
        }
      } else {
        // Items lejanos: borrosos pero mismo tamaño
        gsap.to(item, {
          filter: "blur(8px) brightness(0.85)",
          scale: 1.0, // Mismo tamaño que el activo
          opacity: 0.7, // Bastante visibles
          duration: 1.2,
          ease: "power2.inOut"
        });

        if (img) {
          gsap.to(img, {
            opacity: 0.9,
            scale: 1.0,
            duration: 1.2,
            ease: "power2.inOut"
          });
        }
      }
    });

    // Circle mini-spin (sincronizado, no coincide con H1) - rueda completa
    if (circleRef.current) {
      const svg = circleRef.current.querySelector(`.${styles.circleSvg}`);
      if (svg) {
        gsap.to(svg, {
          rotation: '+=45',
          duration: 0.6,
          ease: "power2.out"
        });
      }
    }

    // Content refresh (entrada del H1 después del swap de imagen, sin coincidencia)
    if (titleRef.current?.children) {
      gsap.fromTo(titleRef.current.children,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.05,
          duration: 0.6,
          delay: 0.6, // Sincronía: swap termina a 1.2s, H1 empieza a 1.8s
          ease: "power3.out"
        }
      );
    }

    // Restart autoplay
    startAutoplay();

  }, [active, slides, calculateTransform, startAutoplay]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext]);

  // Fuerza medición tras carga de imágenes
  useEffect(() => {
    const imgs = Array.from(document.querySelectorAll(`.${styles.heroImg}`)) as HTMLImageElement[];
    const ro = new ResizeObserver(() => {
      if (!listRef.current) return;
      const tx = calculateTransform();
      if (gsap) {
        gsap.set(listRef.current, { x: tx });
      }
    });

    imgs.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', () => {
          if (listRef.current && gsap) {
            gsap.set(listRef.current, { x: calculateTransform() });
          }
        }, { once: true });
      }
      ro.observe(img);
    });

    return () => { ro.disconnect(); };
  }, [calculateTransform]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (listRef.current && gsap) {
        const translateX = calculateTransform();
        gsap.set(listRef.current, { x: translateX });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateTransform]);

  // Circle hover interaction (sutil)
  useEffect(() => {
    const circle = circleRef.current;
    if (!circle || !gsap) return;

    const handleMouseEnter = () => {
      gsap.to(circle, {
        scale: 1.04,
        duration: 0.4,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(circle, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    circle.addEventListener("mouseenter", handleMouseEnter);
    circle.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      circle.removeEventListener("mouseenter", handleMouseEnter);
      circle.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const currentSlide = slides[active];

  return (
    <section
      ref={rootRef}
      className={`${styles.hero} ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-live="polite"
      onPointerEnter={pauseAutoplay}
      onPointerLeave={resumeAutoplay}
    >
      <div className={styles.slider}>
        {/* z-10: Semi-transparent veils for parallax */}
        <div className={styles.veil1} ref={veil1Ref} aria-hidden="true" />
        <div className={styles.veil2} ref={veil2Ref} aria-hidden="true" />

        {/* z-20: Soft ornaments with low opacity */}
        <div className={styles.ornament1} ref={ornament1Ref} aria-hidden="true" />
        <div className={styles.ornament2} ref={ornament2Ref} aria-hidden="true" />

        {/* Item List */}
        <div className={styles.list} ref={listRef}>
          {slides.map((slide, i) => (
            <figure
              key={i}
              ref={el => { itemRefs.current[i] = el; }}
              className={`${styles.item} ${i === active ? styles.active : ''}`}
            >
              <img src={slide.img} alt={slide.title} className={styles.heroImg} />
              {/* Velo translúcido elegante */}
              <div className={styles.heroVeil} aria-hidden="true" />
            </figure>
          ))}
        </div>

        {/* Circle with text - SVG textPath rotating ring */}
        <div className={styles.circle} ref={circleRef} aria-hidden="true">
          <svg className={styles.circleSvg} viewBox="0 0 500 500">
            <defs>
              <path
                id="circlePath"
                d="M 250, 250
                   m -200, 0
                   a 200,200 0 1,1 400,0
                   a 200,200 0 1,1 -400,0"
              />
            </defs>
            {/* Círculo visible transparente */}
            <circle
              cx="250"
              cy="250"
              r="200"
              fill="none"
              stroke="rgba(212, 175, 55, 0.25)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            {/* Texto pegado al círculo */}
            <text className={styles.circleText}>
              <textPath href="#circlePath" startOffset="0%">
                {circleTextChars.map(c => c.char).join('')}
              </textPath>
            </text>
          </svg>
        </div>

        {/* z-30: Typography (primary anchor) */}
        <div className={styles.content}>
          {currentSlide.eyebrow && (
            <div className={styles.eyebrow} ref={eyebrowRef}>{currentSlide.eyebrow}</div>
          )}
          <h1 className={styles.title} ref={titleRef}>
            {currentSlide.title.split(' ').map((word, i) => (
              <span key={i}>{word} </span>
            ))}
          </h1>
          {/* z-40: CTA with subtle gold border */}
          <button
            ref={ctaRef}
            className={styles.cta}
            onClick={handleCta}
            style={{ '--accent': currentSlide.accent || '#d4af37' } as React.CSSProperties}
          >
            {currentSlide.ctaText || 'See More'}
          </button>
        </div>

        {/* Navigation Buttons */}
        <button
          className={`${styles.prev} ${active === 0 ? styles.disabled : ''}`}
          aria-label="Previous"
          onClick={goPrev}
          disabled={active === 0}
        >
          ‹
        </button>
        <button
          className={`${styles.next} ${active === slideCount - 1 ? styles.disabled : ''}`}
          aria-label="Next"
          onClick={goNext}
          disabled={active === slideCount - 1}
        >
          ›
        </button>

        {/* Progress Bar */}
        <div className={styles.progress}>
          <i ref={progressRef} />
        </div>
      </div>
    </section>
  );
}