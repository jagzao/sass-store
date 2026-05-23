import type gsap from "gsap";
import type { ScrollTrigger as ScrollTriggerPlugin } from "gsap/ScrollTrigger";
import { TENNIS_BALL_FRAME_COUNT } from "./tennis-ball-frames";

/** Resolución nativa de los WebP (ajustar si cambian los assets). */
const CANVAS_SOURCE_SIZE = 1080;

export type TennisBallScrollyEngineOptions = {
  gsap: typeof gsap;
  scrollTrigger: typeof ScrollTriggerPlugin;
  trigger: HTMLElement;
  scrub?: number | boolean;
};

/**
 * Patrón GSAP image-sequence: ballSequence.frame 0→119, snap + scrub, render en onUpdate.
 * @see https://gsap.com/docs/v3/GSAP/scrollTrigger/
 */
export class TennisBallScrollyEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly images: HTMLImageElement[];
  /** Objeto que GSAP interpola — el scroll “dibuja” este índice. */
  readonly ballSequence = { frame: 0 };
  private scrollTrigger: ScrollTriggerPlugin | null = null;
  private tween: gsap.core.Tween | null = null;
  private sourceWidth = CANVAS_SOURCE_SIZE;
  private sourceHeight = CANVAS_SOURCE_SIZE;

  constructor(canvas: HTMLCanvasElement, images: HTMLImageElement[]) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("2D canvas context unavailable");
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.images = images;

    const first = images[0];
    if (first?.naturalWidth && first.naturalHeight) {
      this.sourceWidth = first.naturalWidth;
      this.sourceHeight = first.naturalHeight;
    }
  }

  /** Tamaño interno del buffer (resolución de los WebP). */
  private applyCanvasBufferSize(): void {
    this.canvas.width = this.sourceWidth;
    this.canvas.height = this.sourceHeight;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** Dibuja el frame actual en el lienzo (llamado desde onUpdate de ScrollTrigger). */
  render = (): void => {
    const index = Math.min(
      this.images.length - 1,
      Math.max(0, Math.round(this.ballSequence.frame)),
    );
    const img = this.images[index];
    if (!img?.complete || !img.naturalWidth) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(img, 0, 0);
    this.canvas.dataset.ctvFrame = String(index);
  };

  mount(options: TennisBallScrollyEngineOptions): void {
    const { gsap, trigger, scrub = 0.5 } = options;

    this.applyCanvasBufferSize();
    this.render();

    this.tween = gsap.to(this.ballSequence, {
      frame: TENNIS_BALL_FRAME_COUNT - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger,
        start: "top top",
        end: "bottom bottom",
        scrub,
        invalidateOnRefresh: true,
        onUpdate: this.render,
      },
    });

    this.scrollTrigger = this.tween.scrollTrigger ?? null;
  }

  refresh(): void {
    this.scrollTrigger?.refresh();
    this.render();
  }

  destroy(): void {
    this.tween?.kill();
    this.scrollTrigger?.kill();
    this.tween = null;
    this.scrollTrigger = null;
  }
}
