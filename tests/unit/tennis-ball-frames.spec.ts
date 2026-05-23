import { describe, expect, it } from "vitest";
import {
  frameIndexToNumber,
  scrollProgressToFrameIndex,
  tennisBallFrameSrc,
  TENNIS_BALL_FRAME_COUNT,
} from "../../apps/web/lib/centro-tenistico/tennis-ball-frames";

describe("tennis-ball-frames", () => {
  it("maps scroll progress to correct segment boundaries", () => {
    expect(scrollProgressToFrameIndex(0)).toBe(0);
    expect(scrollProgressToFrameIndex(0.3)).toBe(39);
    expect(scrollProgressToFrameIndex(0.31)).toBe(41);
    expect(scrollProgressToFrameIndex(0.7)).toBe(79);
    expect(scrollProgressToFrameIndex(0.71)).toBe(81);
    expect(scrollProgressToFrameIndex(1)).toBe(119);
  });

  it("clamps out-of-range progress", () => {
    expect(scrollProgressToFrameIndex(-0.5)).toBe(0);
    expect(scrollProgressToFrameIndex(2)).toBe(119);
  });

  it("builds sequential asset paths", () => {
    expect(tennisBallFrameSrc(1)).toBe(
      "/assets/sprites/tennis-ball/ball_001.webp",
    );
    expect(tennisBallFrameSrc(120)).toBe(
      "/assets/sprites/tennis-ball/ball_120.webp",
    );
  });

  it("converts frame index to 1-based number", () => {
    expect(frameIndexToNumber(0)).toBe(1);
    expect(frameIndexToNumber(119)).toBe(TENNIS_BALL_FRAME_COUNT);
  });
});
