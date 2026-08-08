// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedbackWidgetProvider } from "@/components/feedback/FeedbackWidgetContext";
import { TenantAwareAssistant } from "@/components/assistant/TenantAwareAssistant";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
}));

const mockUseTenantSlug = vi.fn();
vi.mock("@/lib/tenant/client-resolver", () => ({
  useTenantSlug: () => mockUseTenantSlug(),
}));

describe("TenantAwareAssistant", () => {
  it("SC-01 — renderiza WonderAssistantWidget (unica presencia flotante) en wondernails", () => {
    mockUseTenantSlug.mockReturnValue("wondernails");

    render(
      <FeedbackWidgetProvider>
        <TenantAwareAssistant />
      </FeedbackWidgetProvider>,
    );

    expect(screen.getByTestId("wonder-assistant-trigger")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir feedback" }),
    ).not.toBeInTheDocument();
  });

  it("SC-02 — renderiza el FeedbackWidget de siempre para otros tenants", () => {
    mockUseTenantSlug.mockReturnValue("centro-tenistico");

    render(
      <FeedbackWidgetProvider>
        <TenantAwareAssistant />
      </FeedbackWidgetProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Abrir feedback" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("wonder-assistant-trigger"),
    ).not.toBeInTheDocument();
  });
});
