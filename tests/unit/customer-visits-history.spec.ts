/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CustomerVisitsHistory from "../../apps/web/components/customers/CustomerVisitsHistory";

vi.mock("@/components/customers/AddEditVisitModal", () => ({
  default: ({ onClose }: { onClose: (refresh?: boolean) => void }) =>
    React.createElement(
      "div",
      null,
      React.createElement("p", null, "Mock AddEditVisitModal"),
      React.createElement(
        "button",
        { onClick: () => onClose(true) },
        "Close Visit Modal",
      ),
    ),
}));

vi.mock("@/components/customers/VisitDetailModal", () => ({
  default: ({ onClose }: { onClose: () => void }) =>
    React.createElement(
      "div",
      null,
      React.createElement("p", null, "Mock VisitDetailModal"),
      React.createElement("button", { onClick: onClose }, "Close Detail Modal"),
    ),
}));

type MockResponse = {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
};

const makeResponse = (body: unknown, status = 200): MockResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const visitFixture = {
  id: "visit-1",
  visitNumber: 1,
  visitDate: new Date("2026-01-10T10:00:00Z").toISOString(),
  totalAmount: 450,
  notes: "test",
  status: "scheduled" as const,
  services: [
    {
      id: "service-1",
      serviceName: "Gel X",
      quantity: 1,
      unitPrice: 450,
      subtotal: 450,
    },
  ],
};

describe("CustomerVisitsHistory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders visits fetched from API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => makeResponse({ visits: [visitFixture] })) as unknown,
    );

    render(
      React.createElement(CustomerVisitsHistory, {
        tenantSlug: "wondernails",
        customerId: "customer-1",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Historial de Visitas/i)).toBeInTheDocument();
    });

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Gel X")).toBeInTheDocument();
    expect(screen.getByText("Programada")).toBeInTheDocument();
  });

  it("opens AddEditVisitModal when clicking Nueva Visita", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => makeResponse({ visits: [visitFixture] })) as unknown,
    );

    render(
      React.createElement(CustomerVisitsHistory, {
        tenantSlug: "wondernails",
        customerId: "customer-1",
      }),
    );

    const newVisitButton = await screen.findByTestId("btn-new-visit");
    fireEvent.click(newVisitButton);

    expect(screen.getByText("Mock AddEditVisitModal")).toBeInTheDocument();
  });

  it("deletes a visit and refreshes list when confirmed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeResponse({ visits: [visitFixture] }))
      .mockResolvedValueOnce(makeResponse({}, 200))
      .mockResolvedValueOnce(makeResponse({ visits: [] }));

    vi.stubGlobal("fetch", fetchMock as unknown);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );

    render(
      React.createElement(CustomerVisitsHistory, {
        tenantSlug: "wondernails",
        customerId: "customer-1",
      }),
    );

    await screen.findByText("#1");

    const deleteButton = screen.getByTitle("Eliminar");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/tenants/wondernails/customers/customer-1/visits/visit-1",
        { method: "DELETE" },
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Sin visitas registradas/i)).toBeInTheDocument();
    });
  });
});
