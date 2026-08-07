// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FeedbackWidgetProvider,
  useFeedbackWidget,
} from "@/components/feedback/FeedbackWidgetContext";
import { FeedbackHeaderButton } from "@/components/feedback/FeedbackHeaderButton";

function OpenState() {
  const { isOpen, initialCategory } = useFeedbackWidget();
  return (
    <div>
      <span data-testid="open">{isOpen ? "open" : "closed"}</span>
      <span data-testid="category">{initialCategory}</span>
    </div>
  );
}

describe("FeedbackHeaderButton", () => {
  it("SC-04: abre el widget con categoria opinion por defecto al hacer click", () => {
    render(
      <FeedbackWidgetProvider>
        <OpenState />
        <FeedbackHeaderButton variant="default" />
      </FeedbackWidgetProvider>,
    );

    fireEvent.click(screen.getByTestId("feedback-header-icon"));

    expect(screen.getByTestId("open").textContent).toBe("open");
    expect(screen.getByTestId("category").textContent).toBe("opinion");
  });

  it("SC-01: variante default usa texto oscuro para contraste sobre header claro", () => {
    render(
      <FeedbackWidgetProvider>
        <FeedbackHeaderButton variant="default" />
      </FeedbackWidgetProvider>,
    );

    expect(screen.getByTestId("feedback-header-icon").className).toContain(
      "text-gray-700",
    );
  });

  it("SC-02: variante transparent usa texto blanco para contraste", () => {
    render(
      <FeedbackWidgetProvider>
        <FeedbackHeaderButton variant="transparent" />
      </FeedbackWidgetProvider>,
    );

    expect(screen.getByTestId("feedback-header-icon").className).toContain(
      "text-white",
    );
  });

  it("SC-03: variante dark usa texto blanco para contraste", () => {
    render(
      <FeedbackWidgetProvider>
        <FeedbackHeaderButton variant="dark" />
      </FeedbackWidgetProvider>,
    );

    expect(screen.getByTestId("feedback-header-icon").className).toContain(
      "text-white",
    );
  });
});
