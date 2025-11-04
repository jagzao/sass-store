"use client";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useCart } from "@/lib/cart/cart-store";
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
    bgColor: "#FF2D6A",
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
    bgColor: "#B025FF",
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
    bgColor: "#FF2D6A",
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
    img: `/tenants/wondernails/hero/img4.webp`,
    title: "WONDERNAILS PRO",
    topic: "Acrílicas",
    description: "Resistentes y elegantes · Diseño incluido · Desde $60",
    badge: "Más popular",
    bgColor: "#B025FF",
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
    img: `/tenants/wondernails/hero/img5.webp`,
    title: "WONDERNAILS PRO",
    topic: "Fortalecedor",
    description: "Recupera uñas dañadas · Resultados en 2 semanas · $80",
    bgColor: "#FF2D6A",
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
    img: `/tenants/wondernails/hero/img6.webp`,
    title: "WONDERNAILS PRO",
    topic: "Pack Novia",
    description: "Manicure + Pedicure · Diseño personalizado · $120",
    badge: "Especial",
    bgColor: "#B025FF",
    type: "service",
    detailTitle: "Pack Novia Premium",
    detail: "Todo lo que necesitas para lucir perfecta en tu día especial.",
    specs: [
      { label: "Incluye", value: "Manicure + Pedicure" },
      { label: "Duración", value: "4 semanas" },
      { label: "Precio", value: "$120" },
    ],
  },
];

// Helper: Limpia props inline que Flip deja (evita drift)
const clearFlipInline = (nodes: NodeListOf<Element>) => {
  gsap.set(nodes, { clearProps: "top,left,width,height,margin" }); // NO limpiar transform aquí
};

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

  // Animation durations based on environment
  const getAnimationDuration = (baseSeconds: number) => {
    if (isTestEnv) return baseSeconds * 0.15; // 85% faster in tests
    if (prefersReducedMotion) return baseSeconds * 0.5; // 50% faster for reduced motion
    return baseSeconds;
  };

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
      duration: 0.35,
      ease: "power2.out",
      "--accent": color,
    } as any);
  }, [slides]);

  // Stagger text animation for MAIN item
  const staggerMainText = useCallback((mainItem: HTMLElement) => {
    const title = mainItem.querySelector(`.${styles.title}`) as HTMLElement;
    const topic = mainItem.querySelector(`.${styles.topic}`) as HTMLElement;
    const des = mainItem.querySelector(`.${styles.des}`) as HTMLElement;
    const seeMore = mainItem.querySelector(`.${styles.seeMore}`) as HTMLElement;

    const tl = gsap.timeline();

    if (title) {
      tl.fromTo(
        title,
        { y: -30, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
        },
        0
      );
    }

    if (topic) {
      tl.fromTo(
        topic,
        { y: -30, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
        },
        0.1
      );
    }

    if (des) {
      tl.fromTo(
        des,
        { y: -30, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
        },
        0.2
      );
    }

    if (seeMore) {
      tl.fromTo(
        seeMore,
        { y: -30, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
        },
        0.3
      );
    }
  }, []);

  // Apply exact stack positions using yPercent (no drift)
  const applyPositions = useCallback((items: NodeListOf<Element>) => {
    items.forEach((item, i) => {
      const el = item as HTMLElement;

      // ANCLAJE BASE (siempre) - fuerza el anclaje para evitar drift con scale
      gsap.set(el, {
        position: "absolute",
        top: "50%",
        left: 0,
        transformOrigin: "50% 50%",
      });

      if (i === 0) {
        // #1 Peek left - oculto a la izquierda
        gsap.set(el, {
          xPercent: -100,
          yPercent: -55, // -5% ajustado por el anclaje en 50%
          scale: 1.5,
          opacity: 0,
          filter: "blur(30px)",
          zIndex: 10,
          pointerEvents: "none",
        });
      } else if (i === 1) {
        // #2 MAIN - centrado, nítido, dominante
        gsap.set(el, {
          xPercent: 0,
          yPercent: -50, // centrado vertical perfecto
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          zIndex: 20,
          pointerEvents: "auto",
        });
      } else if (i === 2) {
        // #3 Derecha cercana - 50% derecha, +10% abajo
        gsap.set(el, {
          xPercent: 50,
          yPercent: -40, // -50% + 10% = -40%
          scale: 0.8,
          filter: "blur(10px)",
          zIndex: 9,
          opacity: 1,
          pointerEvents: "none",
        });
      } else if (i === 3) {
        // #4 Derecha lejana - 90% derecha, +20% abajo
        gsap.set(el, {
          xPercent: 90,
          yPercent: -30, // -50% + 20% = -30%
          scale: 0.5,
          filter: "blur(30px)",
          zIndex: 8,
          opacity: 1,
          pointerEvents: "none",
        });
      } else {
        // #5 Fuera de foco - extremo derecho, +30% abajo
        gsap.set(el, {
          xPercent: 120,
          yPercent: -20, // -50% + 30% = -20%
          scale: 0.3,
          filter: "blur(40px)",
          opacity: 0,
          zIndex: 7,
          pointerEvents: "none",
        });
      }
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
      autoRef.current = gsap.delayedCall(5, toNextRef.current);
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
    ) as HTMLElement;
    const mainIntroduce = items[1].querySelector(
      `.${styles.introduce}`
    ) as HTMLElement;

    // Micro-parallax en el MAIN saliente (12-14px)
    if (mainImgWrap)
      gsap.to(mainImgWrap, { x: 14, duration: 0.5, ease: "power2.out" });
    if (mainIntroduce)
      gsap.to(mainIntroduce, { x: -7, duration: 0.5, ease: "power2.out" });

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
        if (mainImgWrap) gsap.set(mainImgWrap, { x: 0 });
        if (mainIntroduce) gsap.set(mainIntroduce, { x: 0 });

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
    // #1 MAIN → peek izquierdo (0.5s)
    tl.to(
      items[1],
      {
        xPercent: -100,
        yPercent: -55,
        scale: 1.5,
        opacity: 0,
        filter: "blur(30px)",
        duration: getAnimationDuration(0.5),
        ease: "power2.inOut",
      },
      0
    );

    // #2 Derecha cercana → MAIN (0.7s) - el más vistoso
    tl.to(
      items[2],
      {
        xPercent: 0,
        yPercent: -50,
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        duration: getAnimationDuration(0.7),
        ease: "power3.out",
      },
      0
    );

    // #3 Derecha lejana → Derecha cercana (0.9s)
    if (items[3]) {
      tl.to(
        items[3],
        {
          xPercent: 50,
          yPercent: -40,
          scale: 0.8,
          opacity: 1,
          filter: "blur(10px)",
          duration: getAnimationDuration(0.9),
          ease: "power2.inOut",
        },
        0
      );
    }

    // #4 Fuera de foco → Derecha lejana (1.1s)
    if (items[4]) {
      tl.to(
        items[4],
        {
          xPercent: 90,
          yPercent: -30,
          scale: 0.5,
          opacity: 1,
          filter: "blur(30px)",
          duration: getAnimationDuration(1.1),
          ease: "power2.inOut",
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

    // Get elements for micro-parallax invertido
    const mainImgWrap = items[1].querySelector(
      `.${styles.imgWrap}`
    ) as HTMLElement;
    const mainIntroduce = items[1].querySelector(
      `.${styles.introduce}`
    ) as HTMLElement;

    // Micro-parallax invertido en el MAIN saliente
    if (mainImgWrap)
      gsap.to(mainImgWrap, { x: -14, duration: 0.5, ease: "power2.out" });
    if (mainIntroduce)
      gsap.to(mainIntroduce, { x: 7, duration: 0.5, ease: "power2.out" });

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
        if (mainImgWrap) gsap.set(mainImgWrap, { x: 0 });
        if (mainIntroduce) gsap.set(mainIntroduce, { x: 0 });

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
    // #1 Peek izquierdo → MAIN (1.1s) - el más dramático
    tl.to(
      items[0],
      {
        xPercent: 0,
        yPercent: -50,
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        duration: getAnimationDuration(1.1),
        ease: "power3.out",
      },
      0
    );

    // #2 MAIN → Derecha cercana (0.9s)
    tl.to(
      items[1],
      {
        xPercent: 50,
        yPercent: -40,
        scale: 0.8,
        opacity: 1,
        filter: "blur(10px)",
        duration: getAnimationDuration(0.9),
        ease: "power2.inOut",
      },
      0
    );

    // #3 Derecha cercana → Derecha lejana (0.7s)
    if (items[2]) {
      tl.to(
        items[2],
        {
          xPercent: 90,
          yPercent: -30,
          scale: 0.5,
          opacity: 1,
          filter: "blur(30px)",
          duration: getAnimationDuration(0.7),
          ease: "power2.inOut",
        },
        0
      );
    }

    // #4 Derecha lejana → Fuera de foco (0.5s)
    if (items[3]) {
      tl.to(
        items[3],
        {
          xPercent: 120,
          yPercent: -20,
          scale: 0.3,
          opacity: 0,
          filter: "blur(40px)",
          duration: getAnimationDuration(0.5),
          ease: "power2.inOut",
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
    tl.to(mainItem, { width: "100%", duration: 0.6, ease: "power2.inOut" }, 0);

    // Hide other items
    if (items[2])
      tl.to(
        items[2],
        { opacity: 0, xPercent: 200, pointerEvents: "none", duration: 0.5 },
        0
      );
    if (items[3])
      tl.to(
        items[3],
        { opacity: 0, xPercent: 200, pointerEvents: "none", duration: 0.5 },
        0
      );

    // Center image properly - clear right first, then set left
    if (mainImgWrap) {
      tl.set(mainImgWrap, { clearProps: "right" }, 0);
      tl.to(
        mainImgWrap,
        {
          left: "30%",
          xPercent: -50,
          top: "45%",
          width: "55%",
          height: "55%",
          duration: 0.6,
          ease: "power2.inOut",
        },
        0
      );
    }

    // Hide introduce
    if (mainIntroduce) tl.to(mainIntroduce, { autoAlpha: 0, duration: 0.3 }, 0);

    // Show detail with stagger
    if (mainDetail) {
      tl.set(mainDetail, { display: "block" }, 0.3);
      const detailTitle = mainDetail.querySelector(`.${styles.detailTitle}`);
      const detailDes = mainDetail.querySelector(`.${styles.detailDes}`);
      const specs = mainDetail.querySelector(`.${styles.specifications}`);
      const buttons = mainDetail.querySelector(`.${styles.detailButtons}`);

      tl.fromTo(
        mainDetail,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.4 },
        0.4
      );
      if (detailTitle)
        tl.fromTo(
          detailTitle,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          0.5
        );
      if (detailDes)
        tl.fromTo(
          detailDes,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          0.6
        );
      if (specs)
        tl.fromTo(
          specs,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          0.7
        );
      if (buttons)
        tl.fromTo(
          buttons,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          0.8
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
            <article
              key={slide.img}
              className={styles.item}
              data-testid="carousel-item"
              data-index={idx}
              role="tabpanel"
              aria-label={`Slide ${idx + 1}: ${slide.topic || "Service"}`}
            >
              <div className={styles.introduce}>
                {slide.badge && (
                  <div className={styles.badge}>{slide.badge}</div>
                )}
                {slide.title && (
                  <div className={styles.title}>{slide.title}</div>
                )}
                {slide.topic && (
                  <div className={styles.topic}>{slide.topic}</div>
                )}
                {slide.description && (
                  <div className={styles.des}>{slide.description}</div>
                )}
                <button
                  className={styles.seeMore}
                  onClick={openDetail}
                  data-testid="see-more-button"
                  aria-label="Ver más del producto"
                >
                  VER MÁS ↗
                </button>
              </div>

              <div className={styles.imgWrap}>
                <Image
                  src={slide.img}
                  alt={slide.topic || "Servicio Wonder Nails"}
                  fill
                  priority={idx === 1}
                  sizes="(max-width:768px) 40vw, (max-width:1200px) 50vw, 800px"
                />
              </div>

              <div className={styles.detail} data-testid="detail-view">
                <div className={styles.detailTitle}>
                  {slide.detailTitle || slide.title}
                </div>
                {slide.detail && (
                  <div className={styles.detailDes}>{slide.detail}</div>
                )}
                {!!slide.specs?.length && (
                  <div
                    className={styles.specifications}
                    data-testid="detail-specifications"
                  >
                    {slide.specs.map((sp, i) => (
                      <div key={i} className={styles.spec}>
                        <p className={styles.specLabel}>{sp.label}</p>
                        <p className={styles.specValue}>{sp.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.detailButtons}>
                  {slide.type === "product" ? (
                    <button
                      className={styles.addToCart}
                      onClick={handleAddToCart}
                    >
                      COMPRAR
                    </button>
                  ) : (
                    <button
                      className={styles.checkout}
                      onClick={handleCheckout}
                    >
                      RESERVAR
                    </button>
                  )}
                  <button
                    className={styles.closeDetail}
                    onClick={closeDetail}
                    data-testid="back-button"
                  >
                    VER TODOS
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.arrows}>
          <button
            className={styles.arrowBtn}
            onClick={toPrev}
            aria-label="Anterior"
            data-testid="prev-button"
            disabled={navLocked || isDetail}
          >
            ←
          </button>
          <button
            className={styles.arrowBtn}
            onClick={toNext}
            aria-label="Siguiente"
            data-testid="next-button"
            disabled={navLocked || isDetail}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
