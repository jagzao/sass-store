// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FeedbackWidgetProvider,
  useFeedbackWidget,
} from "@/components/feedback/FeedbackWidgetContext";
import { FeedbackErrorTrigger } from "@/components/feedback/FeedbackErrorTrigger";

function Consumer() {
  const { isOpen, initialCategory, initialContext, initialMessage } =
    useFeedbackWidget();
  return (
    <div>
      <span data-testid="open">{isOpen ? "open" : "closed"}</span>
      <span data-testid="category">{initialCategory}</span>
      <span data-testid="message">{initialMessage}</span>
      <span data-testid="source">
        {(initialContext?.source as string) ?? ""}
      </span>
    </div>
  );
}

function OpenButton() {
  const { open } = useFeedbackWidget();
  return (
    <button onClick={() => open({ category: "problema", message: "hola" })}>
      Open
    </button>
  );
}

describe("FeedbackWidgetContext", () => {
  it("inicia cerrado con valores por defecto", () => {
    render(
      <FeedbackWidgetProvider>
        <Consumer />
      </FeedbackWidgetProvider>,
    );

    expect(screen.getByTestId("open").textContent).toBe("closed");
    expect(screen.getByTestId("category").textContent).toBe("opinion");
    expect(screen.getByTestId("message").textContent).toBe("");
  });

  it("open actualiza estado inicial y marca isOpen", () => {
    render(
      <FeedbackWidgetProvider>
        <Consumer />
        <OpenButton />
      </FeedbackWidgetProvider>,
    );

    fireEvent.click(screen.getByText("Open"));

    expect(screen.getByTestId("open").textContent).toBe("open");
    expect(screen.getByTestId("category").textContent).toBe("problema");
    expect(screen.getByTestId("message").textContent).toBe("hola");
  });
});

describe("FeedbackErrorTrigger", () => {
  it("abre widget con datos del error", () => {
    render(
      <FeedbackWidgetProvider>
        <Consumer />
        <FeedbackErrorTrigger
          error={{ digest: "abc123", name: "ChunkLoadError", message: "fail" }}
        />
      </FeedbackWidgetProvider>,
    );

    fireEvent.click(screen.getByText("Reportar problema"));

    expect(screen.getByTestId("open").textContent).toBe("open");
    expect(screen.getByTestId("category").textContent).toBe("problema");
    expect(screen.getByTestId("source").textContent).toBe("error_page");
  });
});
