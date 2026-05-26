import type gsap from "gsap";
import type { ScrollTrigger as ScrollTriggerPlugin } from "gsap/ScrollTrigger";
import { TENNIS_BALL_FRAME_COUNT } from "./tennis-ball-frames";

export type TennisBallScrollyEngineOptions = {
  gsap: typeof gsap;
  scrollTrigger: typeof ScrollTriggerPlugin;
  trigger: HTMLElement;
  scrub?: number | boolean;
};

type ScrollyScene = {
  frame: number;
  x: number;
  y: number;
  scale: number;
};

type AlphaBounds = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

/**
 * Canvas único + timeline GSAP: frame 0→119 y transformaciones espaciales.
 */
export class TennisBallScrollyEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly images: HTMLImageElement[];
  /** Objeto intermedio que GSAP anima: frame + coordenadas reales de viewport. */
  readonly ballState: ScrollyScene = { frame: 0, x: 0, y: 0, scale: 1.5 };
  /** Alias para tests/debuggers existentes. */
  readonly scene = this.ballState;
  private timeline: gsap.core.Timeline | null = null;
  private readonly bounds = new Map<number, AlphaBounds>();
  private displayWidth = 0;
  private displayHeight = 0;
  private gsapInstance: typeof gsap | null = null;
  private trigger: HTMLElement | null = null;
  private scrubDuration = 1;

  constructor(canvas: HTMLCanvasElement, images: HTMLImageElement[]) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("2D canvas context unavailable");
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.images = images;
  }

  private resizeBuffer(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;

    this.displayWidth = w;
    this.displayHeight = h;
    const bw = Math.floor(w * dpr);
    const bh = Math.floor(h * dpr);

    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private getAlphaBounds(index: number): AlphaBounds {
    const cached = this.bounds.get(index);
    if (cached) return cached;

    const img = this.images[index];
    const scratch = document.createElement("canvas");
    scratch.width = img.naturalWidth;
    scratch.height = img.naturalHeight;
    const scratchCtx = scratch.getContext("2d", { willReadFrequently: true });
    if (!scratchCtx) {
      return { sx: 0, sy: 0, sw: img.naturalWidth, sh: img.naturalHeight };
    }

    scratchCtx.drawImage(img, 0, 0);
    const { data, width, height } = scratchCtx.getImageData(
      0,
      0,
      scratch.width,
      scratch.height,
    );

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX > maxX || minY > maxY) {
      const fallback = {
        sx: 0,
        sy: 0,
        sw: img.naturalWidth,
        sh: img.naturalHeight,
      };
      this.bounds.set(index, fallback);
      return fallback;
    }

    const pad = 18;
    const bounds = {
      sx: Math.max(0, minX - pad),
      sy: Math.max(0, minY - pad),
      sw: Math.min(width, maxX + pad) - Math.max(0, minX - pad),
      sh: Math.min(height, maxY + pad) - Math.max(0, minY - pad),
    };
    this.bounds.set(index, bounds);
    return bounds;
  }

  private drawFrameCentered(index: number, alpha: number): void {
    const img = this.images[index];
    if (!img.naturalWidth || alpha <= 0) return;

    const { sx, sy, sw, sh } = this.getAlphaBounds(index);

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.translate(this.ballState.x, this.ballState.y);
    this.ctx.scale(this.ballState.scale, this.ballState.scale);
    this.ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
    this.ctx.restore();
  }

  render = (): void => {
    this.resizeBuffer();
    if (this.displayWidth === 0) return;

    const maxFrame = this.images.length - 1;
    const f = Math.min(maxFrame, Math.max(0, this.ballState.frame));
    const i0 = Math.floor(f);
    const i1 = Math.min(maxFrame, i0 + 1);
    const blend = f - i0;

    this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

    if (blend < 0.001 || i0 === i1) {
      this.drawFrameCentered(i0, 1);
    } else {
      this.drawFrameCentered(i0, 1 - blend);
      this.drawFrameCentered(i1, blend);
    }

    this.ctx.globalAlpha = 1;
    this.canvas.dataset.ctvFrame = String(Math.round(f));
    this.canvas.dataset.ctvX = String(Math.round(this.ballState.x));
    this.canvas.dataset.ctvY = String(Math.round(this.ballState.y));
    this.canvas.dataset.ctvScale = this.ballState.scale.toFixed(3);
  };

  mount(options: TennisBallScrollyEngineOptions): void {
    const { gsap, trigger, scrub = 1 } = options;
    const maxFrame = TENNIS_BALL_FRAME_COUNT - 1;
    const timelineDuration = 6.2;

    this.gsapInstance = gsap;
    this.trigger = trigger;
    this.scrubDuration = typeof scrub === "number" ? scrub : 0;
    this.resizeBuffer();
    const w = this.displayWidth;
    const h = this.displayHeight;
    Object.assign(this.ballState, {
      frame: 0,
      scale: 1.55,
      x: w * 0.76,
      y: h * 0.42,
    });
    this.render();

    this.timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: "top top",
        end: "bottom bottom",
        scrub,
        invalidateOnRefresh: true,
        onUpdate: () => this.render(),
      },
    });

    this.timeline
      .to(
        this.ballState,
        { frame: maxFrame, ease: "none", duration: timelineDuration },
        0,
      )
      // Clases Grupales: derecha alta, enorme, sin bloquear el copy izquierdo.
      .to(
        this.ballState,
        {
          scale: 1.36,
          x: w * 0.86,
          y: h * 0.3,
          ease: "power1.inOut",
          duration: 0.65,
        },
        0,
      )
      // Salida del hero: baja por el canal derecho antes de cruzar.
      .to(
        this.ballState,
        {
          scale: 1.08,
          x: w * 0.66,
          y: h * 0.58,
          ease: "power1.inOut",
          duration: 0.55,
        },
        ">",
      )
      // Servicios: contenido a la derecha, pelota se va a la izquierda.
      .to(
        this.ballState,
        {
          scale: 0.74,
          x: w * 0.17,
          y: h * 0.34,
          ease: "power1.inOut",
          duration: 1,
        },
        ">",
      )
      // Servicios detalle: rebote bajo izquierdo para dar profundidad Z.
      .to(
        this.ballState,
        {
          scale: 0.92,
          x: w * 0.3,
          y: h * 0.66,
          ease: "power1.inOut",
          duration: 0.75,
        },
        ">",
      )
      // Reserva en 3 pasos: centro libre entre las tarjetas glass.
      .to(
        this.ballState,
        {
          scale: 0.66,
          x: w * 0.52,
          y: h * 0.48,
          ease: "power1.inOut",
          duration: 0.8,
        },
        ">",
      )
      // Reserva: centro bajo, por debajo del copy principal.
      .to(
        this.ballState,
        {
          scale: 0.58,
          x: w * 0.5,
          y: h * 0.82,
          ease: "power1.inOut",
          duration: 0.9,
        },
        ">",
      )
      // CTA/Footer: salida al lado derecho y luego hacia centro-alto.
      .to(
        this.ballState,
        {
          scale: 0.86,
          x: w * 0.8,
          y: h * 0.32,
          ease: "power1.inOut",
          duration: 0.85,
        },
        ">",
      )
      .to(
        this.ballState,
        {
          scale: 0.72,
          x: w * 0.43,
          y: h * 0.24,
          ease: "power1.inOut",
          duration: 0.7,
        },
        ">",
      );
  }

  syncToScroll(): void {
    if (!this.timeline || !this.trigger || !this.gsapInstance) return;
    const scrollable = this.trigger.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const rect = this.trigger.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    this.gsapInstance.to(this.timeline, {
      progress,
      duration: this.scrubDuration,
      ease: "power1.out",
      overwrite: true,
      onUpdate: this.render,
    });
  }

  resize(): void {
    this.resizeBuffer();
    this.render();
  }

  refresh(): void {
    this.timeline?.scrollTrigger?.refresh();
    this.render();
  }

  destroy(): void {
    this.timeline?.kill();
    this.timeline = null;
    this.gsapInstance = null;
    this.trigger = null;
  }
}
