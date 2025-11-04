"use client";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import defaultSlidesData from "./slides.json";
import styles from "./HeroWondernailsGSAP.module.css";

// GSAP SSR-safe imports
let gsap: any, Flip: any;
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const GS = require("gsap");
  gsap = GS.gsap;
  Flip = require("gsap/Flip").Flip;
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
};

export interface WondernailsCarouselProps {
  slides?: WnSlide[];
  className?: string;
  onAddToCart?: (slideIndex: number) => void;
  onCheckout?: (slideIndex: number) => void;
}

const HeroWondernailsGSAP: React.FC<WondernailsCarouselProps> = ({
  slides = defaultSlidesData as WnSlide[],
  className = "",
  onAddToCart,
  onCheckout,
}) => {
  const rootRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<any>(null);
  const gsapCtxRef = useRef<any>(null);
  const navLockRef = useRef(false);
  const hoverTimeoutRef = useRef<any>(null);
  const detailTimelineRef = useRef<any>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [activeIndex, setActiveIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // Detect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // ==================== POSITIONING ====================

  // Apply positions based on index (stack layout) - NO nth-child CSS
  const applyPositions = useCallback(() => {
    if (!gsap || !listRef.current) return;

    const items = Array.from(listRef.current.children) as HTMLElement[];
    items.forEach((item, i) => {
      let config: any = {};

      switch (i) {
        case 0: // peek left
          config = {
            x: "-100%",
            y: "-5%",
            scale: 1.35,
            filter: "blur(26px)",
            zIndex: 11,
            opacity: 0.35,
            pointerEvents: "none",
          };
          break;
        case 1: // main - principal
          config = {
            x: "0%",
            y: "0%",
            scale: 1,
            filter: "blur(0px)",
            zIndex: 12,
            opacity: 1,
            pointerEvents: "auto",
          };
          break;
        case 2: // right near
          config = {
            x: "50%",
            y: "10%",
            scale: 0.8,
            filter: "blur(10px)",
            zIndex: 10,
            opacity: 0.6,
            pointerEvents: "none",
          };
          break;
        case 3: // right medium
          config = {
            x: "90%",
            y: "20%",
            scale: 0.5,
            filter: "blur(30px)",
            zIndex: 9,
            opacity: 0.3,
            pointerEvents: "none",
          };
          break;
        case 4: // right far
          config = {
            x: "120%",
            y: "30%",
            scale: 0.3,
            filter: "blur(40px)",
            zIndex: 8,
            opacity: 0,
            pointerEvents: "none",
          };
          break;
        default: // hidden
          config = { opacity: 0, zIndex: 1, pointerEvents: "none" };
      }

      gsap.set(item, config);
    });
  }, []);

  // ==================== AUTOPLAY MANAGEMENT ====================

  const cancelAuto = useCallback(() => {
    if (autoPlayRef.current) {
      autoPlayRef.current.kill();
      autoPlayRef.current = null;
    }
  }, []);

  const scheduleAuto = useCallback(() => {
    if (prefersReducedMotion || isPaused || showDetail) return;

    cancelAuto();

    if (gsap) {
      autoPlayRef.current = gsap.delayedCall(5, () => {
        toNext();
      });
    }
  }, [isPaused, showDetail, prefersReducedMotion]);

  // ==================== PARALLAX & STAGGER ====================

  const parallaxAndStagger = useCallback((direction: "next" | "prev") => {
    if (!gsap || !listRef.current) return;

    const mainItem = listRef.current.children[1] as HTMLElement;
    if (!mainItem) return;

    const imgWrap = mainItem.querySelector(`.${styles.imgWrap}`) as HTMLElement;
    const introduce = mainItem.querySelector(`.${styles.introduce}`) as HTMLElement;
    const title = mainItem.querySelector(`.${styles.title}`);
    const topic = mainItem.querySelector(`.${styles.topic}`);
    const des = mainItem.querySelector(`.${styles.des}`);
    const seeMore = mainItem.querySelector(`.${styles.seeMore}`);

    const tl = gsap.timeline();

    // Parallax effect
    const imgX = direction === "next" ? 14 : -14;
    const copyX = direction === "next" ? -7 : 7;

    if (imgWrap) {
      tl.fromTo(
        imgWrap,
        { x: 0 },
        { x: imgX, duration: 0.42, ease: "cubic-bezier(0.22, 1, 0.36, 1)" },
        0
      );
      tl.to(imgWrap, { x: 0, duration: 0.3, delay: 0.42 }, 0.42);
    }

    if (introduce) {
      tl.fromTo(
        introduce,
        { x: 0 },
        { x: copyX, duration: 0.42, ease: "cubic-bezier(0.22, 1, 0.36, 1)" },
        0
      );
      tl.to(introduce, { x: 0, duration: 0.3, delay: 0.42 }, 0.42);
    }

    // Stagger intro for copy elements
    gsap.set([title, topic, des, seeMore], { autoAlpha: 0, y: -30 });

    tl.to(title, { autoAlpha: 1, y: 0, duration: 0.4 }, 1.0)
      .to(topic, { autoAlpha: 1, y: 0, duration: 0.4 }, 1.2)
      .to(des, { autoAlpha: 1, y: 0, duration: 0.4 }, 1.4)
      .to(seeMore, { autoAlpha: 1, y: 0, duration: 0.4 }, 1.6);
  }, []);

  // ==================== ACCENT COLOR UPDATE ====================

  const updateAccentColor = useCallback(() => {
    if (!rootRef.current || !listRef.current) return;

    const mainItem = listRef.current.children[1] as HTMLElement;
    if (!mainItem) return;

    const idx = parseInt(mainItem.dataset.index || "1", 10);
    const color = slides[idx]?.bgColor || "#FF2D6A";

    if (gsap && rootRef.current) {
      gsap.to(rootRef.current, {
        "--accent": color,
        duration: 0.35,
        ease: "power2.out",
      });
    }

    setActiveIndex(idx);
  }, [slides]);

  // ==================== NAVIGATION WITH FLIP ====================

  const unlock = useCallback(() => {
    navLockRef.current = false;
  }, []);

  const toNext = useCallback(() => {
    if (!gsap || !Flip || !listRef.current || navLockRef.current || showDetail) return;

    // Lock navigation
    navLockRef.current = true;
    setIsAnimating(true);

    // Cancel and reschedule autoplay
    cancelAuto();

    const list = listRef.current;
    const items = Array.from(list.children) as HTMLElement[];

    // Capture state BEFORE reordering
    const state = Flip.getState(items);

    // Reorder DOM
    const firstChild = list.firstElementChild;
    if (firstChild) {
      list.appendChild(firstChild);
    }

    // Force reflow
    void rootRef.current?.offsetWidth;

    // Animate with FLIP
    const flipDuration = prefersReducedMotion ? 0.3 : 1.1;
    Flip.from(state, {
      duration: flipDuration,
      ease: "power3.inOut",
      absolute: true,
      scale: true,
      prune: true,
      stagger: 0.03,
      onComplete: () => {
        // Apply exact positions after FLIP completes
        applyPositions();
        updateAccentColor();
                   parallaxAndStagger("next");
                   unlock();
                   scheduleAuto();
                   setIsAnimating(false);
                 },    });
  }, [
    applyPositions,
    updateAccentColor,
    parallaxAndStagger,
    unlock,
    cancelAuto,
    scheduleAuto,
    showDetail,
    prefersReducedMotion,
  ]);

  const toPrev = useCallback(() => {
    if (!gsap || !Flip || !listRef.current || navLockRef.current || showDetail) return;

    // Lock navigation
    navLockRef.current = true;
    setIsAnimating(true);

    // Cancel and reschedule autoplay
    cancelAuto();

    const list = listRef.current;
    const items = Array.from(list.children) as HTMLElement[];

    // Capture state BEFORE reordering
    const state = Flip.getState(items);

    // Reorder DOM
    const lastChild = list.lastElementChild;
    if (lastChild) {
      list.prepend(lastChild);
    }

    // Force reflow
    void rootRef.current?.offsetWidth;

    // Animate with FLIP
    const flipDuration = prefersReducedMotion ? 0.3 : 1.1;
    Flip.from(state, {
      duration: flipDuration,
      ease: "power3.inOut",
      absolute: true,
      scale: true,
      prune: true,
      stagger: 0.03,
      onComplete: () => {
        // Apply exact positions after FLIP completes
        applyPositions();
        updateAccentColor();
        parallaxAndStagger("prev");
        unlock();
        scheduleAuto();
        setIsAnimating(false);
      },
    });
  }, [
    applyPositions,
    updateAccentColor,
    parallaxAndStagger,
    unlock,
    cancelAuto,
    scheduleAuto,
    showDetail,
    prefersReducedMotion,
  ]);

  // ==================== DETAIL MODE ====================

  const openDetail = useCallback(() => {
    if (!gsap || !listRef.current || navLockRef.current) return;

    navLockRef.current = true;
    setShowDetail(true);
    setIsPaused(true);
    cancelAuto();

    const mainItem = listRef.current.children[1] as HTMLElement;
    const detailPanel = mainItem.querySelector(`.${styles.detail}`) as HTMLElement;
    const imgWrap = mainItem.querySelector(`.${styles.imgWrap}`) as HTMLElement;
    const items = Array.from(listRef.current.children) as HTMLElement[];
    const glow = rootRef.current?.querySelector(`.${styles.glow}`) as HTMLElement;

    // Kill previous timeline if exists
    if (detailTimelineRef.current) {
      detailTimelineRef.current.kill();
    }

    const tl = gsap.timeline({
      onComplete: () => {
        unlock();
      },
    });

    detailTimelineRef.current = tl;

    // Expand main item to 100% width
    tl.to(mainItem, { width: "100%", duration: 0.5, ease: "power3.out" }, 0);

    // Hide items at index 2 and 3
    tl.to([items[2], items[3]], { opacity: 0, x: "200%", duration: 0.3 }, 0);

    // Move image to center (right: 50%)
    if (imgWrap) {
      tl.to(imgWrap, { xPercent: -50, duration: 0.5, ease: "power3.out" }, 0);
    }

    // Animate glow
    if (glow) {
      tl.to(glow, { rotation: 45, scale: 1.2, duration: 0.6, ease: "power2.out" }, 0);
    }

    // Show detail panel with stagger
    if (detailPanel) {
      const detailTitle = detailPanel.querySelector(`.${styles.detailTitle}`);
      const detailDes = detailPanel.querySelector(`.${styles.detailDes}`);
      const specs = detailPanel.querySelector(`.${styles.specifications}`);
      const buttons = detailPanel.querySelector(`.${styles.detailButtons}`);

      tl.set(detailPanel, { display: "block" }, 0.3);
      tl.fromTo(
        [detailTitle, detailDes, specs, buttons],
        { autoAlpha: 0, x: 30 },
        { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        0.5
      );
    }
  }, [cancelAuto, unlock]);

  const closeDetail = useCallback(() => {
    if (!gsap || !listRef.current || navLockRef.current) return;

    navLockRef.current = true;

    const mainItem = listRef.current.children[1] as HTMLElement;
    const detailPanel = mainItem.querySelector(`.${styles.detail}`) as HTMLElement;
    const imgWrap = mainItem.querySelector(`.${styles.imgWrap}`) as HTMLElement;
    const items = Array.from(listRef.current.children) as HTMLElement[];
    const glow = rootRef.current?.querySelector(`.${styles.glow}`) as HTMLElement;

    // Kill previous timeline if exists
    if (detailTimelineRef.current) {
      detailTimelineRef.current.kill();
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setShowDetail(false);
        setIsPaused(false);
        unlock();
        // Resume autoplay after 800ms
        setTimeout(() => {
          scheduleAuto();
        }, 800);
      },
    });

    detailTimelineRef.current = tl;

    // Hide detail panel
    if (detailPanel) {
      tl.to(detailPanel, { autoAlpha: 0, duration: 0.3 }, 0);
      tl.set(detailPanel, { display: "none" });
    }

    // Reset image position
    if (imgWrap) {
      tl.to(imgWrap, { xPercent: 0, duration: 0.5, ease: "power3.out" }, 0);
    }

    // Show items 2 and 3 again
    tl.to([items[2], items[3]], { opacity: 0.6, x: "50%", duration: 0.3 }, 0.2);

    // Reset main item width
    tl.to(mainItem, { width: "70%", duration: 0.5, ease: "power3.out" }, 0);

    // Reset glow
    if (glow) {
      tl.to(glow, { rotation: 0, scale: 1, duration: 0.6, ease: "power2.out" }, 0);
    }

    // Reapply positions after close
    tl.call(applyPositions, [], 0.5);
  }, [applyPositions, unlock, scheduleAuto]);

  // ==================== HOVER/FOCUS MANAGEMENT ====================

  const pauseAutoPlay = useCallback(() => {
    cancelAuto();
    setIsPaused(true);
  }, [cancelAuto]);

  const resumeAutoPlay = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (!showDetail) {
        setIsPaused(false);
        scheduleAuto();
      }
    }, 800);
  }, [scheduleAuto, showDetail]);

  // ==================== INITIALIZATION ====================

  useLayoutEffect(() => {
    if (!gsap || !rootRef.current) return;

    gsapCtxRef.current = gsap.context(() => {
      applyPositions();
      updateAccentColor();

      // Initial stagger for first load
      if (listRef.current) {
        const mainItem = listRef.current.children[1] as HTMLElement;
        if (mainItem) {
          const title = mainItem.querySelector(`.${styles.title}`);
          const topic = mainItem.querySelector(`.${styles.topic}`);
          const des = mainItem.querySelector(`.${styles.des}`);
          const seeMore = mainItem.querySelector(`.${styles.seeMore}`);

          gsap.set([title, topic, des, seeMore], { autoAlpha: 0, y: -30 });

          const tl = gsap.timeline();
          tl.to(title, { autoAlpha: 1, y: 0, duration: 0.4, delay: 0.5 })
            .to(topic, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.7)
            .to(des, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.9)
            .to(seeMore, { autoAlpha: 1, y: 0, duration: 0.4 }, 1.1);
        }
      }
    }, rootRef.current);

    return () => {
      if (gsapCtxRef.current) {
        gsapCtxRef.current.revert();
      }
    };
  }, [applyPositions, updateAccentColor]);

  // Start autoplay
  useEffect(() => {
    if (!prefersReducedMotion) {
      scheduleAuto();
    }

    return () => {
      cancelAuto();
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (detailTimelineRef.current) {
        detailTimelineRef.current.kill();
      }
    };
  }, [scheduleAuto, cancelAuto, prefersReducedMotion]);

  // ==================== EVENT HANDLERS ====================

  const handleAddToCart = () => {
    onAddToCart?.(activeIndex);
  };

  const handleCheckout = () => {
    onCheckout?.(activeIndex);
  };

  const handleChangeImage = () => {
    if (!navLockRef.current) {
      toNext();
    }
  };

  // ==================== RENDER ====================

  return (
    <section
      ref={rootRef}
      className={`${styles.wncRoot} ${className}`}
      role="region"
      aria-label="Carrusel Wonder Nails"
      aria-roledescription="carousel"
      data-is-animating={isAnimating}
      aria-live={isPaused ? "off" : "polite"}
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
      onFocus={pauseAutoPlay}
      onBlur={resumeAutoPlay}
    >
      <div className={styles.glow} />

      <div ref={carouselRef} className={styles.carousel}>
        <div ref={listRef} className={styles.list}>
          {slides.map((slide, idx) => (
            <div key={idx} className={styles.item} data-index={idx}>
              <div className={styles.imgWrap}>
                <Image
                  src={slide.img}
                  alt={slide.topic || "Wonder Nails"}
                  fill
                  priority={idx === 0}
                  sizes="(max-width: 768px) 40vw, (max-width: 1200px) 50vw, 800px"
                  style={{ objectFit: "contain" }}
                />
              </div>

              <div className={styles.introduce}>
                {slide.badge && <div className={styles.badge}>{slide.badge}</div>}
                <h1 className={styles.title}>{slide.title}</h1>
                <div className={styles.topic}>{slide.topic}</div>
                <div className={styles.des}>{slide.description}</div>
                <button
                  className={styles.seeMore}
                  onClick={openDetail}
                  aria-label={`Ver más del producto ${slide.topic}`}
                  data-testid="see-more-button"
                  style={{ position: 'relative', zIndex: 9999 }}
                >
                  VER MÁS ↗
                </button>
              </div>

              <div className={styles.detail}>
                <div className={styles.detailTitle}>{slide.detailTitle}</div>
                <div className={styles.detailDes}>{slide.detail}</div>

                {slide.specs && slide.specs.length > 0 && (
                  <div className={styles.specifications}>
                    {slide.specs.map((spec, i) => (
                      <div key={i} className={styles.spec}>
                        <span className={styles.specLabel}>{spec.label}</span>
                        <span className={styles.specValue}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.detailButtons}>
                  <button className={styles.addToCart} onClick={handleAddToCart}>
                    Agregar al carrito
                  </button>
                  <button className={styles.checkout} onClick={handleCheckout}>
                    Reservar ahora
                  </button>
                  <button className={styles.closeDetail} onClick={closeDetail}>
                    ← Ver todos
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.arrows}>
          <button
            id="prev"
            onClick={toPrev}
            disabled={navLockRef.current}
            aria-label="Slide anterior"
            className={styles.arrowBtn}
          >
            &lt;
          </button>
          <button
            id="change"
            onClick={handleChangeImage}
            disabled={navLockRef.current}
            aria-label="Cambiar imagen"
            className={styles.changeBtn}
          >
            Cambiar
          </button>
          <button
            id="next"
            onClick={toNext}
            disabled={navLockRef.current}
            aria-label="Siguiente slide"
            className={styles.arrowBtn}
          >
            &gt;
          </button>
        </div>
      </div>
    </section>
  );
};

export default React.memo(HeroWondernailsGSAP);
