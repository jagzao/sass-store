// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FeedbackWidgetProvider,
  useFeedbackWidget,
} from "@/components/feedback/FeedbackWidgetContext";
import { FeedbackErrorTrigger } from "@/components/feedback/FeedbackErrorTrigger";
import { ErrorBoundary } from "@/components/error-boundary";

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

  it("trunca y sanitiza paths locales del mensaje de error", () => {
    const longMessage = "a".repeat(300);
    render(
      <FeedbackWidgetProvider>
        <Consumer />
        <FeedbackErrorTrigger
          error={{
            digest: "abc123",
            name: "ChunkLoadError",
            message: `/home/user/app/broken.js ${longMessage}`,
          }}
        />
      </FeedbackWidgetProvider>,
    );

    fireEvent.click(screen.getByText("Reportar problema"));

    const message = screen.getByTestId("message").textContent ?? "";
    expect(message.length).toBeLessThanOrEqual(260);
    expect(message).not.toContain("/home/user/app/broken.js");
    expect(message).toContain("[path]");
  });
});

function Kaboom() {
  throw new Error("component boundary failure");
}

describe("ErrorBoundary", () => {
  it("muestra trigger de feedback cuando un componente hijo falla", () => {
    render(
      <FeedbackWidgetProvider>
        <Consumer />
        <ErrorBoundary>
          <Kaboom />
        </ErrorBoundary>
      </FeedbackWidgetProvider>,
    );

    expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
    expect(screen.getByTestId("feedback-error-trigger")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("feedback-error-trigger"));

    expect(screen.getByTestId("open").textContent).toBe("open");
    expect(screen.getByTestId("category").textContent).toBe("problema");
  });
});
