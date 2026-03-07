// Using globals instead of imports since globals: true in Vitest config
import { dateBucketService } from "../../../apps/web/lib/services/DateBucketService";
import { Result } from "@sass-store/core/src/result";
import { DomainError } from "@sass-store/core/src/errors/types";

describe("DateBucketService", () => {
  it("generates ISO week buckets across year boundary", () => {
    const result = dateBucketService.generateBuckets(
      "week",
      "2026-12-28",
      "2027-01-10",
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.map((bucket) => bucket.id)).toEqual([
      "W2026-53",
      "W2027-01",
    ]);
    expect(result.data[0].startDate).toBe("2026-12-28");
    expect(result.data[0].endDate).toBe("2027-01-03");
    expect(result.data[1].startDate).toBe("2027-01-04");
    expect(result.data[1].endDate).toBe("2027-01-10");
  });

  it("generates fortnight buckets for leap year February", () => {
    const result = dateBucketService.generateBuckets(
      "fortnight",
      "2024-02-01",
      "2024-02-29",
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe("F2024-02-Q1");
    expect(result.data[0].startDate).toBe("2024-02-01");
    expect(result.data[0].endDate).toBe("2024-02-15");
    expect(result.data[1].id).toBe("F2024-02-Q2");
    expect(result.data[1].startDate).toBe("2024-02-16");
    expect(result.data[1].endDate).toBe("2024-02-29");
  });

  it("generates fortnight buckets for non-leap year February", () => {
    const result = dateBucketService.generateBuckets(
      "fortnight",
      "2025-02-01",
      "2025-02-28",
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toHaveLength(2);
    expect(result.data[1].startDate).toBe("2025-02-16");
    expect(result.data[1].endDate).toBe("2025-02-28");
  });

  it("returns typed error for invalid range", () => {
    const result = dateBucketService.generateBuckets(
      "month",
      "2026-03-31",
      "2026-03-01",
    );

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorResult = result as any;
      expect(errorResult.error.type).toBe("InvalidDateRangeError");
    }
  });
});

