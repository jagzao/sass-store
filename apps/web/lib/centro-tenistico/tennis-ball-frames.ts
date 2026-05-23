/** Total pre-rendered WebP frames for Centro Tenístico scrollytelling. */
export const TENNIS_BALL_FRAME_COUNT = 120;

export const TENNIS_BALL_SPRITE_BASE = "/assets/sprites/tennis-ball";

/** 1-based frame number → public URL (ball_001.webp … ball_120.webp). */
export function tennisBallFrameSrc(frameNumber: number): string {
  const clamped = Math.min(
    TENNIS_BALL_FRAME_COUNT,
    Math.max(1, Math.round(frameNumber)),
  );
  return `${TENNIS_BALL_SPRITE_BASE}/ball_${String(clamped).padStart(3, "0")}.webp`;
}

/**
 * Maps ScrollTrigger progress [0, 1] to 0-based frame index.
 * 0–30% → frames 1–40, 30–70% → 41–80, 70–100% → 81–120.
 */
export function scrollProgressToFrameIndex(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));

  if (p <= 0.3) {
    return Math.round((p / 0.3) * 39);
  }
  if (p <= 0.7) {
    return 40 + Math.round(((p - 0.3) / 0.4) * 39);
  }
  return 80 + Math.round(((p - 0.7) / 0.3) * 39);
}

/** 0-based index → 1-based frame number for asset path. */
export function frameIndexToNumber(index: number): number {
  return (
    Math.min(TENNIS_BALL_FRAME_COUNT - 1, Math.max(0, Math.round(index))) + 1
  );
}
