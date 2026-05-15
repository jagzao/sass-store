import { describe, it, expect } from "vitest";
import {
  CTV_BOOK_BG,
  CTV_CLAY_ORANGE,
  CTV_CREAM_TEXT,
  CTV_PAGE_BG,
} from "@/lib/design/centro-tenistico-brand";

describe("centro-tenistico-brand", () => {
  it("uses fixed hex clay orange (no shorthand)", () => {
    expect(CTV_CLAY_ORANGE).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(CTV_CLAY_ORANGE.toUpperCase()).toBe("#B85C38");
  });

  it("defines readable cream and light mint page background (homologado con hero)", () => {
    expect(CTV_CREAM_TEXT).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(CTV_PAGE_BG).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(CTV_BOOK_BG).toBe(CTV_PAGE_BG);
  });
});
