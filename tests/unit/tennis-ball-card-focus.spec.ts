import { describe, expect, it } from "vitest";
import { circleRectOverlapDepth } from "@/lib/centro-tenistico/tennis-ball-card-focus";

const rect = (
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect =>
  ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  }) as DOMRect;

describe("circleRectOverlapDepth", () => {
  it("returns 0 when circle does not touch rect", () => {
    expect(circleRectOverlapDepth(50, 50, 40, rect(400, 200, 200, 120))).toBe(
      0,
    );
  });

  it("returns positive depth when circle overlaps rect", () => {
    const depth = circleRectOverlapDepth(
      200,
      160,
      80,
      rect(100, 100, 200, 120),
    );
    expect(depth).toBeGreaterThan(0);
  });

  it("returns larger depth for deeper overlap", () => {
    const box = rect(100, 100, 200, 120);
    const shallow = circleRectOverlapDepth(280, 160, 50, box);
    const deep = circleRectOverlapDepth(200, 160, 120, box);
    expect(deep).toBeGreaterThan(shallow);
  });
});
