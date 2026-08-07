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

  it.each(["default", "transparent", "dark"] as const)(
    "SC-01/02/03: variante %s usa var(--color-foreground)/var(--color-muted) para contraste consistente",
    (variant) => {
      render(
        <FeedbackWidgetProvider>
          <FeedbackHeaderButton variant={variant} />
        </FeedbackWidgetProvider>,
      );

      const button = screen.getByTestId("feedback-header-icon");
      expect(button.style.color).toBe("var(--color-foreground)");
      expect(button.style.backgroundColor).toBe("var(--color-muted)");
    },
  );
});
