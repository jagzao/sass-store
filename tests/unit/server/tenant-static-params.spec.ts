import { describe, expect, it } from "vitest";
import {
  DEFAULT_BUILD_TENANT_SLUGS,
  isEphemeralTestTenantSlug,
} from "../../../apps/web/lib/server/tenant-static-params";

describe("tenant-static-params", () => {
  it("flags ephemeral E2E tenant slugs", () => {
    expect(
      isEphemeralTestTenantSlug("branded-tenant-1777310767346-iamcmvk"),
    ).toBe(true);
    expect(isEphemeralTestTenantSlug("e2e-tenant-abc")).toBe(true);
    expect(isEphemeralTestTenantSlug("test-foo")).toBe(true);
  });

  it("allows production tenant slugs", () => {
    for (const slug of DEFAULT_BUILD_TENANT_SLUGS) {
      expect(isEphemeralTestTenantSlug(slug)).toBe(false);
    }
    expect(isEphemeralTestTenantSlug("wondernails")).toBe(false);
    expect(isEphemeralTestTenantSlug("centro-tenistico")).toBe(false);
  });
});
