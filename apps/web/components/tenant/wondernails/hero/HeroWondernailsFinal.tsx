/* eslint-disable no-undef */
"use client";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useCart } from "@/lib/cart/cart-store";
import { CarouselItem } from "./CarouselItem";
import { CarouselNavigation } from "./CarouselNavigation";
import {
  CAROUSEL_POSITIONS,
  ANIMATION_DURATIONS,
  ANIMATION_EASING,
  getAnimationDuration,
  clearFlipInline,
  applyBaseAnchor,
  createTextStaggerTimeline,
  applyParallax,
  resetParallax,
  DETAIL_IMAGE_POSITION,
  DETAIL_STAGGER_DELAYS,
} from "./wondernails-animations";
import styles from "./HeroWondernailsGSAP.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

export type WnSlide = {
  img: string;
  title?: string;
  topic?: string;
  description?: string;
  badge?: string;
  detailTitle?: string;
  detail?: string;
  specs?: { label: string; value: string }[];
  bgColor?: string;
  type?: "product" | "service"; // producto o servicio
};

export interface WondernailsCarouselProps {
  slides?: WnSlide[];
  className?: string;
  onAddToCart?: (slideIndex: number) => void;
  onCheckout?: (slideIndex: number) => void;
}

const defaultSlides: WnSlide[] = [
  {
    img: `/tenants/wondernails/hero/img1.webp`,
    title: "WONDERNAILS PRO",
    topic: "Manicure Premium",
    description: "Reserva en 2 clics · Garantía de acabado gel · Desde $35",
    badge: "-20% hoy",
    bgColor: "rgba(180, 140, 200, 0.15)", // Luxury Lilac
    type: "service",
    detailTitle: "Manicure Premium LED",
    detail:
      "Tecnología LED de última generación para un acabado profesional que dura hasta 4 semanas. Incluye diseño personalizado y acabado glossy.",
    specs: [
      { label: "Duración", value: "4 semanas" },
      { label: "Tecnología", value: "LED Pro" },
      { label: "Precio", value: "desde $35" },
    ],
  },
  {
    img: `/tenants/wondernails/hero/img2.webp`,
    title: "WONDERNAILS PRO",
    topic: "Nail Art",
    description: "Diseños únicos · Artistas certificados · Desde $45",
    badge: "Nuevo diseño",
    bgColor: "rgba(212, 175, 55, 0.1)", // Champagne Gold
    type: "service",
    detailTitle: "Nail Art Premium",
    detail:
      "Crea diseños únicos con nuestros artistas certificados. Desde minimalista hasta arte complejo.",
    specs: [
      { label: "Duración", value: "3 semanas" },
      { label: "Estilos", value: "Ilimitados" },
      { label: "Precio", value: "desde $45" },
    ],
  },
  {
    img: `/tenants/wondernails/hero/img3.webp`,
    title: "WONDERNAILS PRO",
    topic: "Pedicure Spa",
    description: "Relajación total · Acabado perfecto · Desde $50",
    bgColor: "rgba(180, 140, 200, 0.15)", // Luxury Lilac
    type: "service",
    detailTitle: "Pedicure Spa Premium",
    detail:
      "Tratamiento completo de pies con exfoliación, masaje y acabado gel profesional.",
    specs: [
      { label: "Duración", value: "90 min" },
      { label: "Incluye", value: "Masaje" },
      { label: "Precio", value: "desde $50" },
    ],
  },
  {
    img: `/tenants/wondernails/hero/img1.webp`, // Placeholder: img4.webp was incorrect (earbuds)
    title: "WONDERNAILS PRO",
    topic: "Acrílicas",
    description: "Resistentes y elegantes · Diseño incluido · Desde $60",
    badge: "Más popular",
    bgColor: "rgba(212, 175, 55, 0.1)", // Champagne Gold
    type: "product",
    detailTitle: "Uñas Acrílicas Premium",
    detail:
      "Sistema acrílico de alta calidad que se adapta a tu estilo de vida activo.",
    specs: [
      { label: "Duración", value: "6 semanas" },
      { label: "Resistencia", value: "Alta" },
      { label: "Precio", value: "desde $60" },
    ],
  },
  {
    img: `/tenants/wondernails/hero/img5.jpg`,
    title: "WONDERNAILS PRO",
    topic: "Fortalecedor",
    description: "Recupera uñas dañadas · Resultados en 2 semanas · $80",
    bgColor: "rgba(180, 140, 200, 0.15)", // Luxury Lilac
    type: "product",
    detailTitle: "Tratamiento Fortalecedor",
    detail:
      "Restaura la salud de tus uñas con nuestro tratamiento especializado.",
    specs: [
      { label: "Sesiones", value: "4" },
      { label: "Resultados", value: "2 semanas" },
      { label: "Precio", value: "$80" },
    ],
  },
  {
    img: `/tenants/wondernails/hero/img6.jpg`,
    title: "WONDERNAILS PRO",
    topic: "Pack Novia",
    description: "Manicure + Pedicure · Diseño personalizado · $120",
    badge: "Especial",
    bgColor: "rgba(212, 175, 55, 0.1)", // Champagne Gold
    type: "service",
    detailTitle: "Pack Novia Premium",
    detail: "Todo lo que necesitas para lucir perfecta en tu día especial.",
    specs: [
      { label: "Incluye", value: "Manicure + Pedicure" },
      { label: "Duración", value: "4 semanas" },
      { label: "Precio", value: "$120" },
    ],
  },
  {
    img: `/tenants/wondernails/hero/img7.png`,
    title: "WONDERNAILS PRO",
    topic: "Gift Card",
    description: "El regalo perfecto · Desde $25 · Válido por 1 año",
    badge: "Regalo",
    bgColor: "rgba(180, 140, 200, 0.15)", // Luxury Lilac
    type: "product",
    detailTitle: "Tarjeta de Regalo",
    detail: "Regala belleza y bienestar con nuestras tarjetas de regalo digitales o físicas.",
    specs: [
      { label: "Valor", value: "Flexible" },
      { label: "Validez", value: "12 meses" },
      { label: "Precio", value: "desde $25" },
    ],
  },
];

export default function WondernailsCarouselFinal({
  slides: initialSlides,
  className,
  onAddToCart,
  onCheckout,
}: WondernailsCarouselProps) {
  const slides = initialSlides?.length ? initialSlides : defaultSlides;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<gsap.core.Tween | null>(null);
  const detailTLRef = useRef<gsap.core.Timeline | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDetail, setIsDetail] = useState(false);
  const [navLocked, setNavLocked] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect test environment or reduced motion
  const isTestEnv = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    (typeof (window as any).__playwright !== 'undefined' || typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined');

  // Detect reduced motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Update background color reactively
  const updateBackground = useCallback(() => {
    if (!rootRef.current || !listRef.current) return;
    const items = listRef.current.querySelectorAll(`.${styles.item}`);
    const mainItem = items[1] as HTMLElement | undefined;
    const idx = Number(mainItem?.dataset.index ?? 0);
    const color = slides[idx]?.bgColor || "#FF2D6A";
    gsap.to(rootRef.current, {
      duration: ANIMATION_DURATIONS.BACKGROUND,
      ease: ANIMATION_EASING.SMOOTH,
      "--accent": color,
    } as any);
  }, [slides]);

  // Stagger text animation for MAIN item
  const staggerMainText = useCallback((mainItem: HTMLElement) => {
    const title = mainItem.querySelector(`.${styles.title}`) as HTMLElement | null;
    const topic = mainItem.querySelector(`.${styles.topic}`) as HTMLElement | null;
    const description = mainItem.querySelector(`.${styles.des}`) as HTMLElement | null;
    const button = mainItem.querySelector(`.${styles.seeMore}`) as HTMLElement | null;

    createTextStaggerTimeline({ title, topic, description, button });
  }, []);

  // Apply exact stack positions using yPercent (no drift)
  const applyPositions = useCallback((items: NodeListOf<Element>) => {
    items.forEach((item, i) => {
      const el = item as HTMLElement;

      // Apply base anchor to prevent drift with scale
      applyBaseAnchor(el);

      // Apply position based on index
      const positions = [
        CAROUSEL_POSITIONS.PEEK_LEFT,    // #1 Peek left
        CAROUSEL_POSITIONS.MAIN,          // #2 MAIN (active)
        CAROUSEL_POSITIONS.RIGHT_NEAR,    // #3 Right near
        CAROUSEL_POSITIONS.RIGHT_FAR,     // #4 Right far
        CAROUSEL_POSITIONS.OUT_OF_FOCUS,  // #5 Out of focus
      ];

      const position = positions[i] || positions[4]; // Default to OUT_OF_FOCUS
      gsap.set(el, position);
    });
  }, []);

  // Autoplay utilities
  const cancelAuto = useCallback(() => {
    if (autoRef.current) {
      autoRef.current.kill();
      autoRef.current = null;
    }
  }, []);

  const toNextRef = useRef<() => void>(() => {});

  const scheduleAuto = useCallback(() => {
    if (autoRef.current) {
      autoRef.current.kill();
      autoRef.current = null;
    }
    if (!isPaused && !isDetail && !prefersReducedMotion && toNextRef.current) {
      autoRef.current = gsap.delayedCall(ANIMATION_DURATIONS.AUTOPLAY, toNextRef.current);
    }
  }, [isPaused, isDetail, prefersReducedMotion]);

  // Next slide
  const toNext = useCallback(() => {
    if (navLocked || !listRef.current || !rootRef.current) return;
    cancelAuto();
    setNavLocked(true);

    const list = listRef.current;
    const root = rootRef.current;
    const items = list.querySelectorAll(
      `.${styles.item}`
    ) as NodeListOf<HTMLElement>;
    if (items.length < 2) {
      setNavLocked(false);
      return;
    }

    // Freeze container height
    const h = root.offsetHeight;
    gsap.set(root, { height: h });

    // Get elements for micro-parallax
    const mainImgWrap = items[1].querySelector(
      `.${styles.imgWrap}`
    ) as HTMLElement | null;
    const mainIntroduce = items[1].querySelector(
      `.${styles.introduce}`
    ) as HTMLElement | null;

    // Apply micro-parallax effect
    applyParallax(mainImgWrap, mainIntroduce, 'next');

    // Timeline para transiciones escalonadas
    const tl = gsap.timeline({
      onComplete: () => {
        // Reorder DOM al finalizar
        list.appendChild(items[0]);

        const newItems = list.querySelectorAll(
          `.${styles.item}`
        ) as NodeListOf<Element>;

        // Limpia y reaplica posiciones
        clearFlipInline(newItems);
        applyPositions(newItems);

        // Reset micro-parallax
        resetParallax(mainImgWrap, mainIntroduce);

        // Descongela altura y actualiza fondo
        gsap.set(root, { clearProps: "height" });
        updateBackground();

        // Stagger del nuevo MAIN (tras estar estable)
        const newMainItem = newItems[1] as HTMLElement;
        if (newMainItem) staggerMainText(newMainItem);

        setNavLocked(false);
        if (!isPaused && !isDetail) scheduleAuto();
      },
    });

    // Transiciones escalonadas con duraciones específicas
    // #1 MAIN → peek izquierdo
    tl.to(
      items[1],
      {
        ...CAROUSEL_POSITIONS.PEEK_LEFT,
        duration: getAnimationDuration(ANIMATION_DURATIONS.NEXT.MAIN_TO_PEEK, prefersReducedMotion, isTestEnv),
        ease: ANIMATION_EASING.SHARP,
      },
      0
    );

    // #2 Derecha cercana → MAIN - el más vistoso
    tl.to(
      items[2],
      {
        ...CAROUSEL_POSITIONS.MAIN,
        duration: getAnimationDuration(ANIMATION_DURATIONS.NEXT.RIGHT_TO_MAIN, prefersReducedMotion, isTestEnv),
        ease: ANIMATION_EASING.BOUNCE,
      },
      0
    );

    // #3 Derecha lejana → Derecha cercana
    if (items[3]) {
      tl.to(
        items[3],
        {
          ...CAROUSEL_POSITIONS.RIGHT_NEAR,
          duration: getAnimationDuration(ANIMATION_DURATIONS.NEXT.FAR_TO_NEAR, prefersReducedMotion, isTestEnv),
          ease: ANIMATION_EASING.SHARP,
        },
        0
      );
    }

    // #4 Fuera de foco → Derecha lejana
    if (items[4]) {
      tl.to(
        items[4],
        {
          ...CAROUSEL_POSITIONS.RIGHT_FAR,
          duration: getAnimationDuration(ANIMATION_DURATIONS.NEXT.OUT_TO_FAR, prefersReducedMotion, isTestEnv),
          ease: ANIMATION_EASING.SHARP,
        },
        0
      );
    }
  }, [
    navLocked,
    cancelAuto,
    scheduleAuto,
    applyPositions,
    isPaused,
    isDetail,
    prefersReducedMotion,
    updateBackground,
    staggerMainText,
    isTestEnv,
  ]);

  toNextRef.current = toNext;

  // Previous slide
  const toPrev = useCallback(() => {
    if (navLocked || !listRef.current || !rootRef.current) return;
    cancelAuto();
    setNavLocked(true);

    const list = listRef.current;
    const root = rootRef.current;
    const items = list.querySelectorAll(
      `.${styles.item}`
    ) as NodeListOf<HTMLElement>;
    if (items.length < 2) {
      setNavLocked(false);
      return;
    }

    const h = root.offsetHeight;
    gsap.set(root, { height: h });

    // Get elements for micro-parallax
    const mainImgWrap = items[1].querySelector(
      `.${styles.imgWrap}`
    ) as HTMLElement | null;
    const mainIntroduce = items[1].querySelector(
      `.${styles.introduce}`
    ) as HTMLElement | null;

    // Apply micro-parallax effect (reversed)
    applyParallax(mainImgWrap, mainIntroduce, 'prev');

    // Timeline para transiciones escalonadas inversas
    const tl = gsap.timeline({
      onComplete: () => {
        // Reorder DOM al finalizar
        list.prepend(items[items.length - 1]);

        const newItems = list.querySelectorAll(
          `.${styles.item}`
        ) as NodeListOf<Element>;

        // Limpia y reaplica posiciones
        clearFlipInline(newItems);
        applyPositions(newItems);

        // Reset micro-parallax
        resetParallax(mainImgWrap, mainIntroduce);

        // Descongela altura y actualiza fondo
        gsap.set(root, { clearProps: "height" });
        updateBackground();

        // Stagger del nuevo MAIN (tras estar estable)
        const newMainItem = newItems[1] as HTMLElement;
        if (newMainItem) staggerMainText(newMainItem);

        setNavLocked(false);
        if (!isPaused && !isDetail) scheduleAuto();
      },
    });

    // Transiciones escalonadas inversas con duraciones específicas
    // #1 Peek izquierdo → MAIN - el más dramático
    tl.to(
      items[0],
      {
        ...CAROUSEL_POSITIONS.MAIN,
        duration: getAnimationDuration(ANIMATION_DURATIONS.PREV.PEEK_TO_MAIN, prefersReducedMotion, isTestEnv),
        ease: ANIMATION_EASING.BOUNCE,
      },
      0
    );

    // #2 MAIN → Derecha cercana
    tl.to(
      items[1],
      {
        ...CAROUSEL_POSITIONS.RIGHT_NEAR,
        duration: getAnimationDuration(ANIMATION_DURATIONS.PREV.MAIN_TO_NEAR, prefersReducedMotion, isTestEnv),
        ease: ANIMATION_EASING.SHARP,
      },
      0
    );

    // #3 Derecha cercana → Derecha lejana
    if (items[2]) {
      tl.to(
        items[2],
        {
          ...CAROUSEL_POSITIONS.RIGHT_FAR,
          duration: getAnimationDuration(ANIMATION_DURATIONS.PREV.NEAR_TO_FAR, prefersReducedMotion, isTestEnv),
          ease: ANIMATION_EASING.SHARP,
        },
        0
      );
    }

    // #4 Derecha lejana → Fuera de foco
    if (items[3]) {
      tl.to(
        items[3],
        {
          ...CAROUSEL_POSITIONS.OUT_OF_FOCUS,
          duration: getAnimationDuration(ANIMATION_DURATIONS.PREV.FAR_TO_OUT, prefersReducedMotion, isTestEnv),
          ease: ANIMATION_EASING.SHARP,
        },
        0
      );
    }
  }, [
    navLocked,
    cancelAuto,
    scheduleAuto,
    applyPositions,
    isPaused,
    isDetail,
    prefersReducedMotion,
    updateBackground,
    staggerMainText,
    isTestEnv,
  ]);

  // Open detail (sin bloqueo por navLock)
  const openDetail = useCallback(() => {
    if (!listRef.current) return;
    cancelAuto();
    setIsDetail(true);

    const list = listRef.current;
    const items = list.querySelectorAll(
      `.${styles.item}`
    ) as NodeListOf<HTMLElement>;
    const mainItem = items[1];
    if (!mainItem) return;

    // Scroll the button into view if it's outside viewport
    const seeMoreBtn = mainItem.querySelector(
      `.${styles.seeMore}`
    ) as HTMLElement;
    if (seeMoreBtn) {
      const rect = seeMoreBtn.getBoundingClientRect();
      if (rect.bottom > window.innerHeight || rect.top < 0) {
        seeMoreBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    const mainImgWrap = mainItem.querySelector(
      `.${styles.imgWrap}`
    ) as HTMLElement;
    const mainIntroduce = mainItem.querySelector(
      `.${styles.introduce}`
    ) as HTMLElement;
    const mainDetail = mainItem.querySelector(
      `.${styles.detail}`
    ) as HTMLElement;

    if (!mainDetail) return;

    const tl = gsap.timeline();
    detailTLRef.current = tl;

    // Expand main item
    tl.to(mainItem, { width: "100%", duration: ANIMATION_DURATIONS.DETAIL.EXPAND, ease: ANIMATION_EASING.SHARP }, 0);

    // Hide other items
    if (items[2])
      tl.to(
        items[2],
        { opacity: 0, xPercent: 200, pointerEvents: "none", duration: ANIMATION_DURATIONS.DETAIL.HIDE_OTHERS },
        0
      );
    if (items[3])
      tl.to(
        items[3],
        { opacity: 0, xPercent: 200, pointerEvents: "none", duration: ANIMATION_DURATIONS.DETAIL.HIDE_OTHERS },
        0
      );

    // Center image properly - clear right first, then set left
    if (mainImgWrap) {
      tl.set(mainImgWrap, { clearProps: "right" }, 0);
      tl.to(
        mainImgWrap,
        {
          ...DETAIL_IMAGE_POSITION,
          duration: ANIMATION_DURATIONS.DETAIL.EXPAND,
          ease: ANIMATION_EASING.SHARP,
        },
        0
      );
    }

    // Hide introduce
    if (mainIntroduce) tl.to(mainIntroduce, { autoAlpha: 0, duration: ANIMATION_DURATIONS.DETAIL.SHOW_CONTENT * 0.75 }, 0);

    // Show detail with stagger
    if (mainDetail) {
      tl.set(mainDetail, { display: "block" }, ANIMATION_DURATIONS.DETAIL.SHOW_CONTENT * 0.75);
      const detailTitle = mainDetail.querySelector(`.${styles.detailTitle}`);
      const detailDes = mainDetail.querySelector(`.${styles.detailDes}`);
      const specs = mainDetail.querySelector(`.${styles.specifications}`);
      const buttons = mainDetail.querySelector(`.${styles.detailButtons}`);

      tl.fromTo(
        mainDetail,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: ANIMATION_DURATIONS.DETAIL.SHOW_CONTENT },
        DETAIL_STAGGER_DELAYS.FADE_IN
      );
      if (detailTitle)
        tl.fromTo(
          detailTitle,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: ANIMATION_DURATIONS.DETAIL.SHOW_CONTENT * 1.25 },
          DETAIL_STAGGER_DELAYS.TITLE
        );
      if (detailDes)
        tl.fromTo(
          detailDes,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: ANIMATION_DURATIONS.DETAIL.SHOW_CONTENT * 1.25 },
          DETAIL_STAGGER_DELAYS.DESCRIPTION
        );
      if (specs)
        tl.fromTo(
          specs,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: ANIMATION_DURATIONS.DETAIL.SHOW_CONTENT * 1.25 },
          DETAIL_STAGGER_DELAYS.SPECS
        );
      if (buttons)
        tl.fromTo(
          buttons,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: ANIMATION_DURATIONS.DETAIL.SHOW_CONTENT * 1.25 },
          DETAIL_STAGGER_DELAYS.BUTTONS
        );
    }
  }, [cancelAuto]);

  // Close detail
  const closeDetail = useCallback(() => {
    if (!detailTLRef.current) return;
    setIsDetail(false);

    detailTLRef.current.reverse().then(() => {
      const list = listRef.current;
      if (!list) return;
      const items = list.querySelectorAll(
        `.${styles.item}`
      ) as NodeListOf<Element>;
      applyPositions(items);

      // Re-schedule autoplay after delay
      setTimeout(() => {
        if (!isPaused) scheduleAuto();
      }, 800);
    });
  }, [applyPositions, scheduleAuto, isPaused]);

  // Initial setup
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !listRef.current) return;

    const ctx = gsap.context(() => {
      const items = listRef.current!.querySelectorAll(
        `.${styles.item}`
      ) as NodeListOf<Element>;
      applyPositions(items);
      updateBackground();

      // Stagger initial MAIN text
      const mainItem = items[1] as HTMLElement;
      if (mainItem) staggerMainText(mainItem);
    }, listRef);

    return () => ctx.revert();
  }, [applyPositions, updateBackground, staggerMainText]);

  // Autoplay effect
  useEffect(() => {
    if (isPaused || isDetail || prefersReducedMotion) {
      cancelAuto();
      return;
    }

    scheduleAuto();

    return () => cancelAuto();
  }, [isPaused, isDetail, prefersReducedMotion, scheduleAuto, cancelAuto]);

  // Hover/focus handlers
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
    cancelAuto();
  }, [cancelAuto]);

  const handleMouseLeave = useCallback(() => {
    setTimeout(() => {
      setIsPaused(false);
    }, 800);
  }, []);

  const { addItem } = useCart();

  const handleAddToCart = useCallback(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(`.${styles.item}`);
    const mainIdx = Number((items[1] as HTMLElement)?.dataset.index ?? 0);

    if (onAddToCart) {
      onAddToCart(mainIdx);
    } else {
      const slide = slides[mainIdx];
      const priceStr =
        slide.specs?.find((s) => s.label === "Precio")?.value || "0";
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));

      addItem({
        sku: `wondernails-${mainIdx}`,
        name: slide.detailTitle || slide.topic || "",
        price: price,
        image: slide.img,
      });
    }
  }, [onAddToCart, slides, addItem]);

  const handleCheckout = useCallback(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(`.${styles.item}`);
    const mainIdx = Number((items[1] as HTMLElement)?.dataset.index ?? 0);

    if (onCheckout) {
      onCheckout(mainIdx);
    } else {
      const slide = slides[mainIdx];
      const priceStr =
        slide.specs?.find((s) => s.label === "Precio")?.value || "0";
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));

      addItem({
        sku: `wondernails-service-${mainIdx}`,
        name: slide.detailTitle || slide.topic || "",
        price: price,
        image: slide.img,
      });
    }
  }, [onCheckout, slides, addItem]);

  return (
    <section
      data-tenant-hero="wondernails"
      data-testid="carousel-container"
      role="region"
      aria-label="Carrusel Wonder Nails"
      aria-roledescription="carousel"
      className={`${styles.wncRoot} ${className || ""}`}
      ref={rootRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") toNext();
        if (e.key === "ArrowLeft") toPrev();
      }}
    >
      <div className={styles.glow} />
      <div className={styles.carousel}>
        <div className={styles.list} ref={listRef} data-testid="carousel-list">
          {slides.map((slide, idx) => (
            <CarouselItem
              key={slide.img}
              slide={slide}
              index={idx}
              onSeeMore={openDetail}
              onAddToCart={handleAddToCart}
              onCheckout={handleCheckout}
              onCloseDetail={closeDetail}
            />
          ))}
        </div>

        <CarouselNavigation
          onPrev={toPrev}
          onNext={toNext}
          disabled={navLocked || isDetail}
        />
      </div>
    </section>
  );
}
