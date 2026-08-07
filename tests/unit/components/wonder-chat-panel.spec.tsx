// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WonderChatPanel } from "@/components/assistant/WonderChatPanel";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
}));

const baseProps = {
  tenantSlug: "wondernails",
  initialCategory: "opinion" as const,
  initialMessage: "",
  initialContext: {},
  onClose: () => {},
};

describe("WonderChatPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("SC-03 — arranca en vista chat con mensaje de bienvenida cuando no hay contexto de error", () => {
    render(<WonderChatPanel {...baseProps} />);

    expect(screen.getByTestId("wonder-chat-messages")).toBeInTheDocument();
    expect(screen.getByText(/Soy Wonder/)).toBeInTheDocument();
  });

  it("SC-07 — arranca en vista feedback cuando initialCategory es problema (reporte de error)", () => {
    render(
      <WonderChatPanel
        {...baseProps}
        initialCategory="problema"
        initialMessage="algo falló"
        initialContext={{ source: "error_page" }}
      />,
    );

    expect(screen.getByText("Enviar feedback")).toBeInTheDocument();
    expect(
      screen.queryByTestId("wonder-chat-messages"),
    ).not.toBeInTheDocument();
  });

  it("SC-07 — click en Enviar comentario dentro del chat muestra el formulario embebido", () => {
    render(<WonderChatPanel {...baseProps} />);

    fireEvent.click(screen.getByText("Enviar comentario"));

    expect(screen.getByText("Enviar feedback")).toBeInTheDocument();
    expect(screen.getByText("← Volver al chat")).toBeInTheDocument();
  });

  it("SC-04 — envía un mensaje y muestra la respuesta de Wonder", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { reply: "Claro, te ayudo con eso 🐾" },
        }),
      }),
    );

    render(<WonderChatPanel {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText("Escríbele a Wonder..."), {
      target: { value: "¿Tienen manicure?" },
    });
    fireEvent.click(screen.getByLabelText("Enviar mensaje"));

    expect(screen.getByText("¿Tienen manicure?")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Claro, te ayudo con eso 🐾"),
      ).toBeInTheDocument();
    });
  });

  it("SC-05 — muestra mensaje de fallback si /api/ai-chat falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));

    render(<WonderChatPanel {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText("Escríbele a Wonder..."), {
      target: { value: "hola" },
    });
    fireEvent.click(screen.getByLabelText("Enviar mensaje"));

    await waitFor(() => {
      expect(
        screen.getByText("Wonder no puede responder en este momento 🐾"),
      ).toBeInTheDocument();
    });
  });
});
