import gsap from "gsap";
import type { TennisBallScrollyEngine } from "./tennis-ball-scrolly-engine";

type GsapCore = typeof gsap;

const FOCUS_SCALE = 1.035;
const FOCUS_DURATION = 0.45;
const FOCUS_EASE = "power2.out";
const BLUR_EASE = "power2.inOut";

/** Profundidad de solapamiento círculo ↔ rect (0 = sin contacto). */
export function circleRectOverlapDepth(
  cx: number,
  cy: number,
  radius: number,
  rect: DOMRect,
): number {
  if (rect.width <= 0 || rect.height <= 0) return 0;
  const closestX = Math.max(rect.left, Math.min(cx, rect.right));
  const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));
  const dist = Math.hypot(cx - closestX, cy - closestY);
  if (dist >= radius) return 0;
  return radius - dist;
}

/**
 * Zoom suave en la card con mayor solapamiento con la pelota del canvas.
 */
export class TennisBallCardFocus {
  private readonly cards: HTMLElement[];
  private activeCard: HTMLElement | null = null;
  private readonly reducedMotion: boolean;

  constructor(
    private readonly gsapLib: GsapCore,
    root: HTMLElement,
  ) {
    this.cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-ctv-focus-card]"),
    );
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    for (const card of this.cards) {
      card.dataset.ctvBallFocused = "false";
      this.gsapLib.set(card, {
        transformOrigin: "center center",
        scale: 1,
        force3D: true,
      });
    }
  }

  update(engine: TennisBallScrollyEngine): void {
    if (this.reducedMotion || this.cards.length === 0) return;

    const { cx, cy, radius } = engine.getBallHitCircle();
    let best: { card: HTMLElement; depth: number } | null = null;

    for (const card of this.cards) {
      const depth = circleRectOverlapDepth(
        cx,
        cy,
        radius,
        card.getBoundingClientRect(),
      );
      if (depth > 0 && (!best || depth > best.depth)) {
        best = { card, depth };
      }
    }

    const next = best?.card ?? null;
    if (next === this.activeCard) return;

    if (this.activeCard) {
      this.blurCard(this.activeCard);
    }
    if (next) {
      this.focusCard(next);
    }
    this.activeCard = next;
  }

  private focusCard(card: HTMLElement): void {
    card.dataset.ctvBallFocused = "true";
    this.gsapLib.killTweensOf(card);
    this.gsapLib.to(card, {
      scale: FOCUS_SCALE,
      boxShadow:
        "0 28px 90px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      duration: FOCUS_DURATION,
      ease: FOCUS_EASE,
      overwrite: true,
    });
  }

  private blurCard(card: HTMLElement): void {
    card.dataset.ctvBallFocused = "false";
    this.gsapLib.killTweensOf(card);
    this.gsapLib.to(card, {
      scale: 1,
      boxShadow:
        "0 24px 80px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      duration: FOCUS_DURATION * 0.85,
      ease: BLUR_EASE,
      overwrite: true,
    });
  }

  destroy(): void {
    for (const card of this.cards) {
      this.gsapLib.killTweensOf(card);
      card.dataset.ctvBallFocused = "false";
      this.gsapLib.set(card, { clearProps: "scale,boxShadow" });
    }
    this.activeCard = null;
  }
}
