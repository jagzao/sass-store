"use client";

import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import gsap from "gsap";
import { useCircleText } from "./useCircleText";
import styles from "./HeroDelirios.module.css";

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
  initialIndex = 1,
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
  const autoplayTimerRef = useRef<gsap.core.Tween | null>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const isPausedRef = useRef(false);

  const circleTextChars = useCircleText();
  const slideCount = slides.length;

  // Calculate item width and translateX
  const calculateTransform = useCallback(() => {
    if (!itemRefs.current[active]) return 0;
    const itemWidth = itemRefs.current[active]?.getBoundingClientRect().width || 0;
    return itemWidth * (active - 1) * -1;
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
    if (isPausedRef.current || !autoplayMs) return;

    autoplayTimerRef.current?.kill();

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
    autoplayTimerRef.current?.kill();
    gsap.killTweensOf(progressRef.current);
  }, []);

  const resumeAutoplay = useCallback(() => {
    isPausedRef.current = false;
    startAutoplay();
  }, [startAutoplay]);

  // Mount animation
  useLayoutEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const currentSlide = slides[active];
      const bgFrom = currentSlide.bgFrom || "#17232A";
      const bgTo = currentSlide.bgTo || bgFrom;

      // Set initial states
      gsap.set(rootRef.current, {
        background: `radial-gradient(circle at center, ${bgTo}, ${bgFrom})`
      });

      gsap.set(itemRefs.current.filter(Boolean), {
        opacity: 0,
        scale: 0.94,
        y: 20,
        rotateZ: -3
      });

      gsap.set(itemRefs.current[active], {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateZ: 0,
        filter: "blur(0px)"
      });

      // Set other items with blur and rotation
      itemRefs.current.forEach((item, i) => {
        if (i !== active && item) {
          gsap.set(item, {
            filter: "blur(6px) brightness(0.9)",
            rotateZ: 45
          });
        }
      });

      if (titleRef.current) {
        gsap.set(titleRef.current.children, { opacity: 0, y: 30 });
      }

      gsap.set(circleRef.current, { opacity: 0, scale: 0.9 });

      // Intro timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(itemRefs.current[active], {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateZ: 0,
        duration: 0.7
      }, 0.10);

      if (titleRef.current?.children) {
        tl.to(titleRef.current.children, {
          y: 0,
          opacity: 1,
          stagger: 0.05,
          duration: 0.6
        }, 0.15);
      }

      tl.to(circleRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.6
      }, 0.35);

      // Start circle rotation loop
      if (circleRef.current) {
        gsap.to(circleRef.current, {
          rotate: '+=360',
          duration: 20,
          ease: 'none',
          repeat: -1
        });
      }

    }, rootRef);

    ctxRef.current = ctx;

    return () => ctx.revert();
  }, []);

  // Slide transition animation
  useLayoutEffect(() => {
    if (!rootRef.current || !listRef.current) return;

    const currentSlide = slides[active];
    const bgFrom = currentSlide.bgFrom || "#17232A";
    const bgTo = currentSlide.bgTo || bgFrom;

    // Background transition
    gsap.to(rootRef.current, {
      background: `radial-gradient(circle at center, ${bgTo}, ${bgFrom})`,
      duration: 0.8,
      ease: "power1.out"
    });

    // List translation
    const translateX = calculateTransform();
    gsap.to(listRef.current, {
      x: translateX,
      duration: 0.8,
      ease: "power2.out"
    });

    // Update item states (blur, rotation)
    itemRefs.current.forEach((item, i) => {
      if (!item) return;

      if (i === active) {
        // Active item: clear, no rotation
        gsap.to(item, {
          filter: "blur(0px) brightness(1)",
          rotateZ: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out"
        });
      } else {
        // Inactive: blur + 45deg rotation
        gsap.to(item, {
          filter: "blur(6px) brightness(0.9)",
          rotateZ: 45,
          scale: 0.98,
          duration: 0.5,
          ease: "power2.inOut"
        });
      }
    });

    // Circle mini-spin
    if (circleRef.current) {
      gsap.to(circleRef.current, {
        rotate: '+=45',
        duration: 0.6,
        ease: "power2.out"
      });
    }

    // Content refresh
    if (titleRef.current?.children) {
      gsap.fromTo(titleRef.current.children,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.6, ease: "power3.out" }
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

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (listRef.current) {
        const translateX = calculateTransform();
        gsap.set(listRef.current, { x: translateX });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateTransform]);

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
        {/* Item List */}
        <div className={styles.list} ref={listRef}>
          {slides.map((slide, i) => (
            <figure
              key={i}
              ref={el => { itemRefs.current[i] = el; }}
              className={`${styles.item} ${i === active ? styles.active : ''}`}
            >
              <img src={slide.img} alt={slide.title} />
            </figure>
          ))}
        </div>

        {/* Circle with text */}
        <div className={styles.circle} ref={circleRef} aria-hidden="true">
          <div className={styles.circleText}>
            {circleTextChars.map((charObj, i) => (
              <span
                key={i}
                className={styles.circleChar}
                style={{ '--rotate': `${charObj.rotate}deg` } as React.CSSProperties}
              >
                {charObj.char}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {currentSlide.eyebrow && (
            <div className={styles.eyebrow}>{currentSlide.eyebrow}</div>
          )}
          <h1 className={styles.title} ref={titleRef}>
            {currentSlide.title.split(' ').map((word, i) => (
              <span key={i}>{word} </span>
            ))}
          </h1>
          <button
            className={styles.cta}
            onClick={handleCta}
            style={{ '--accent': currentSlide.accent || '#fff' } as React.CSSProperties}
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
