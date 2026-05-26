"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { TennisBallScrollyEngine } from "@/lib/centro-tenistico/tennis-ball-scrolly-engine";
import { preloadTennisBallFrames } from "@/lib/centro-tenistico/tennis-ball-preload";
import { TENNIS_BALL_FRAME_COUNT } from "@/lib/centro-tenistico/tennis-ball-frames";
import "./centro-tenistico-scrollytelling.css";

const SCROLL_SCRUB = 1.5;
const MOBILE_MAX_WIDTH = 767;

type Props = {
  children: ReactNode;
};

export default function CentroTenisticoScrollyShell({ children }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TennisBallScrollyEngine | null>(null);
  const [canvasEnabled, setCanvasEnabled] = useState(true);
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    const mqMobile = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const update = () => setCanvasEnabled(!mqMobile.matches);
    update();
    mqMobile.addEventListener("change", update);
    return () => mqMobile.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!canvasEnabled || !canvasRef.current || !contentRef.current) {
      engineRef.current?.destroy();
      engineRef.current = null;
      setLoadState("idle");
      return;
    }

    let cancelled = false;
    let removeResize: (() => void) | undefined;
    let removeLoad: (() => void) | undefined;

    setLoadState("loading");

    void (async () => {
      try {
        const images = await preloadTennisBallFrames((loaded, total) => {
          if (!cancelled) {
            setLoadState(loaded === total ? "ready" : "loading");
          }
        });

        if (cancelled || !canvasRef.current || !contentRef.current) return;

        const [gsapModule, stModule] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);

        const gsap = gsapModule.default;
        const { ScrollTrigger } = stModule;
        gsap.registerPlugin(ScrollTrigger);

        engineRef.current?.destroy();
        const engine = new TennisBallScrollyEngine(canvasRef.current, images);
        engine.mount({
          gsap,
          scrollTrigger: ScrollTrigger,
          trigger: contentRef.current,
          scrub: SCROLL_SCRUB,
        });
        engineRef.current = engine;
        ScrollTrigger.refresh();
        engine.refresh();

        const onResize = () => {
          engine.resize();
          ScrollTrigger.refresh();
        };
        const onScroll = () => engine.syncToScroll();
        const onLoad = () => {
          ScrollTrigger.refresh();
          engine.refresh();
        };

        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("load", onLoad);
        removeResize = () => {
          window.removeEventListener("resize", onResize);
          window.removeEventListener("scroll", onScroll);
        };
        removeLoad = () => window.removeEventListener("load", onLoad);

        if (!cancelled) setLoadState("ready");
      } catch (err) {
        console.error("[CTV scrolly] init failed", err);
        if (!cancelled) setLoadState("error");
      }
    })();

    return () => {
      cancelled = true;
      removeResize?.();
      removeLoad?.();
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [canvasEnabled]);

  const showCanvas = canvasEnabled && loadState === "ready";

  return (
    <div className="zo-workspace-container ctv-scrolly-root">
      {canvasEnabled ? (
        <div
          className="ctv-scrolly-container"
          data-ctv-ready={showCanvas ? "true" : "false"}
          aria-hidden
        >
          <canvas
            id="hero-canvas"
            ref={canvasRef}
            className="ctv-hero-canvas"
          />
        </div>
      ) : null}

      {loadState === "loading" && canvasEnabled ? (
        <div className="ctv-scrolly-loading" aria-live="polite">
          Cargando animación…
        </div>
      ) : null}

      <div
        ref={contentRef}
        className="content-wrapper ctv-scrolly-content"
        data-ctv-scrolly-enabled={canvasEnabled ? "true" : "false"}
        data-ctv-load-state={loadState}
        data-ctv-frame-count={TENNIS_BALL_FRAME_COUNT}
      >
        {children}
      </div>
    </div>
  );
}
