"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import styles from "./HeroNomNom.module.css";
import { useCart } from "@/lib/cart/cart-store";

type Slide = { id: string; img: string; title: string; desc: string; price: string; bgColor: string };

const defaultSlides: Slide[] = [
  { id: "1", img: "/tenants/nom-nom/hero/taco1.png", title: "Tacos al Pastor", desc: "Deliciosos tacos al pastor con piña asada, cebolla y cilantro.", price: "$12", bgColor: "#9c4d2f" },
  { id: "2", img: "/tenants/nom-nom/hero/taco2.png", title: "Tacos de Carnitas", desc: "Carnitas estilo Michoacán, tiernas y jugosas.", price: "$13", bgColor: "#f5bfaf" },
  { id: "3", img: "/tenants/nom-nom/hero/taco3.png", title: "Tacos de Birria", desc: "Birria de res con queso fundido, cebolla y cilantro.", price: "$15", bgColor: "#dedfe1" },
  { id: "4", img: "/tenants/nom-nom/hero/taco4.png", title: "Tacos Vegetarianos", desc: "Champiñones salteados, pimientos y aguacate fresco.", price: "$11", bgColor: "#7eb63d" },
];

export default function HeroNomNom({ slides = defaultSlides }: { slides?: Slide[] }) {
  const router = useRouter();
  const { addItem } = useCart();
  const len = slides.length;
  const [currIndex, setCurrIndex] = useState(0);
  const [textContent, setTextContent] = useState(slides[0]);

  const containerRef = useRef<HTMLElement>(null);
  const imgCurrRef = useRef<HTMLImageElement>(null);
  const imgNextRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const priceRef = useRef<HTMLParagraphElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const autoplayRef = useRef<gsap.core.Tween | null>(null);
  const isLockedRef = useRef(false);

  // Preload images
  useEffect(() => {
    slides.forEach(slide => {
      const img = new Image();
      img.src = slide.img;
    });
  }, [slides]);

  const animate = useCallback(async (direction: "next" | "prev") => {
    // Guardas: lock e ignore si ya está animando
    if (isLockedRef.current || !imgCurrRef.current || !imgNextRef.current || !containerRef.current || !maskRef.current) return;

    // Kill timelines previos
    timelineRef.current?.kill();
    autoplayRef.current?.kill();
    isLockedRef.current = true;

    const dir = direction === "next" ? 1 : -1;
    const nextIndex = (currIndex + dir + len) % len;
    const nextSlide = slides[nextIndex];

    const root = containerRef.current;
    const mask = maskRef.current;
    const imgCurr = imgCurrRef.current;
    const imgNext = imgNextRef.current;
    const title = titleRef.current;
    const desc = descRef.current;
    const price = priceRef.current;

    // Preload seguro (evita flicker)
    const preload = new Image();
    preload.src = nextSlide.img;
    await preload.decode?.();

    imgNext.src = nextSlide.img;

    const isMob = window.matchMedia("(max-width: 767px)").matches;
    const dx = isMob ? 36 : 60;
    const center = window.matchMedia("(min-width:1280px)").matches ? "70% 50%" : "66% 54%";

    // Estados iniciales
    gsap.set(imgCurr, { zIndex: 2, transformOrigin: "60% 80%" });
    gsap.set(imgNext, {
      zIndex: 3,
      transformOrigin: "60% 80%"
    });
    gsap.set([title, desc, price], { y: 14, opacity: 0, filter: "blur(2px)" });
    gsap.set(mask, {
      pointerEvents: "none",
      zIndex: 1,
      willChange: "clip-path",
      backgroundColor: nextSlide.bgColor
    });

    const tl = gsap.timeline({
      onComplete: () => {
        imgCurr.src = nextSlide.img;
        gsap.set(mask, { display: "none" });
        gsap.set([imgCurr, imgNext, title, desc, price], {
          clearProps: "x,y,opacity,scale,filter,zIndex"
        });
        setTextContent(nextSlide);
        setCurrIndex(nextIndex);
        isLockedRef.current = false;
        autoplayRef.current = gsap.delayedCall(4, () => animate("next"));
      }
    });

    timelineRef.current = tl;

    tl.add("start")
      // BG + círculo (exact sync)
      .to(root, { backgroundColor: nextSlide.bgColor, duration: 0.45 }, "start")
      .fromTo(mask,
        { display: "block", clipPath: `circle(0% at ${center})`, WebkitClipPath: `circle(0% at ${center})` },
        {
          clipPath: `circle(160% at ${center})`,
          WebkitClipPath: `circle(160% at ${center})`,
          duration: 1,
          ease: "power3.out",
          onComplete: () => gsap.set(mask, { display: "none" })
        },
        "start"
      )
      // Saliente (menos salto, más natural)
      .to(imgCurr, {
        x: dir === 1 ? -dx : dx,
        y: 6,
        opacity: 0,
        scale: 0.985,
        filter: "blur(2px)",
        duration: 0.55,
        ease: "power2.out"
      }, "start")
      // Entrante (parallax + leve lift, antes)
      .fromTo(imgNext,
        { x: dir === 1 ? dx : -dx, y: -4, opacity: 0, scale: 1.035, filter: "blur(2px)" },
        { x: 0, y: 0, opacity: 1, scale: 1, filter: "blur(0)", duration: 0.55, ease: "power2.out" },
        "start+=0.04"
      )
      // Textos (adelantar un poco)
      .to(title, { y: 0, opacity: 1, filter: "blur(0)", duration: 0.33 }, "start+=0.10")
      .to(desc, { y: 0, opacity: 1, filter: "blur(0)", duration: 0.33 }, ">0.05")
      .to(price, { y: 0, opacity: 1, filter: "blur(0)", duration: 0.33 }, ">0.05");
  }, [currIndex, len, slides]);

  const goNext = useCallback(() => {
    if (!isLockedRef.current) {
      animate("next");
    }
  }, [animate]);

  const goPrev = useCallback(() => {
    if (!isLockedRef.current) {
      animate("prev");
    }
  }, [animate]);

  const pause = useCallback(() => {
    if (autoplayRef.current) {
      autoplayRef.current.kill();
      autoplayRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (!autoplayRef.current && !isLockedRef.current) {
      autoplayRef.current = gsap.delayedCall(4, () => animate("next"));
    }
  }, [animate]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Initial setup
  useEffect(() => {
    // Set initial states
    if (imgCurrRef.current) {
      gsap.set(imgCurrRef.current, { x: 0, opacity: 1, scale: 1, filter: "blur(0px)", zIndex: 1 });
    }
    if (imgNextRef.current) {
      gsap.set(imgNextRef.current, { opacity: 0, zIndex: 1 });
    }
    if (panelRef.current) {
      gsap.set(panelRef.current, { clipPath: "circle(100% at 70% 50%)" });
    }
    if (containerRef.current) {
      gsap.set(containerRef.current, { backgroundColor: slides[0].bgColor });
    }

    // Start autoplay
    autoplayRef.current = gsap.delayedCall(4, () => animate("next"));

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      if (autoplayRef.current) {
        autoplayRef.current.kill();
        autoplayRef.current = null;
      }
    };
  }, []);

  const currentSlide = slides[currIndex];
  const nextIndex = (currIndex + 1) % len;

  const handleAddToCart = () => {
    // Parse price (remove $ and convert to number)
    const price = parseFloat(textContent.price.replace('$', '')) || 0;

    // Add to cart
    addItem({
      sku: textContent.id,
      name: textContent.title,
      price: price,
      image: '🌮', // Taco emoji for nom-nom
      variant: {
        tenant: 'nom-nom',
        type: 'product'
      }
    }, 1);

    // Navigate to cart
    setTimeout(() => {
      router.push('/t/nom-nom/cart');
    }, 100);
  };

  return (
    <section
      ref={containerRef}
      className={styles.carousel}
      role="region"
      aria-label="Carrusel Nom Nom"
      aria-roledescription="carousel"
      aria-live="polite"
      onMouseEnter={pause}
      onFocus={pause}
      onMouseLeave={resume}
      onBlur={resume}
    >
      {/* Reveal mask overlay */}
      <div ref={maskRef} className={styles.revealMask} />

      {/* Panel with content */}
      <div ref={panelRef} className={styles.panel}>
        <div className={styles.content}>
          <h1 ref={titleRef}>{textContent.title}</h1>
          <p ref={priceRef} className={styles.price}>{textContent.price}</p>
          <p ref={descRef} className={styles.description}>{textContent.desc}</p>
          <button onClick={handleAddToCart} className={styles.addToCard}>Agregar</button>
        </div>
      </div>

      {/* Images */}
      <div className={styles.imageContainer}>
        <img
          ref={imgCurrRef}
          src={currentSlide.img}
          alt={currentSlide.title || currentSlide.desc || "Imagen del producto"}
          className={styles.imageCurr}
        />
        <img
          ref={imgNextRef}
          src={slides[nextIndex].img}
          alt={slides[nextIndex].title || slides[nextIndex].desc || "Siguiente imagen del carrusel"}
          className={styles.imageNext}
        />
      </div>

      {/* Controls */}
      <div className={styles.arrows}>
        <button onClick={goPrev} aria-label="Anterior" disabled={isLockedRef.current}>{"<"}</button>
        <button onClick={goNext} aria-label="Siguiente" disabled={isLockedRef.current}>{">"}</button>
      </div>
    </section>
  );
}
