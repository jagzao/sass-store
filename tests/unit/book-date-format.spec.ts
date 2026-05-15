import { describe, it, expect } from "vitest";
import { getOrdinal } from "@/lib/booking/book-date-format";

describe("getOrdinal", () => {
  it("returns st for 1 and 21", () => {
    expect(getOrdinal("1")).toBe("st");
    expect(getOrdinal("21")).toBe("st");
  });

  it("returns nd for 2 and 22", () => {
    expect(getOrdinal("2")).toBe("nd");
    expect(getOrdinal("22")).toBe("nd");
  });

  it("returns rd for 3 and 23", () => {
    expect(getOrdinal("3")).toBe("rd");
    expect(getOrdinal("23")).toBe("rd");
  });

  it("returns th for 11, 12, 13", () => {
    expect(getOrdinal("11")).toBe("th");
    expect(getOrdinal("12")).toBe("th");
    expect(getOrdinal("13")).toBe("th");
  });

  it("returns th for other days", () => {
    expect(getOrdinal("14")).toBe("th");
    expect(getOrdinal("30")).toBe("th");
  });
});
