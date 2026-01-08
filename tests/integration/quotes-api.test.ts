import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import {
  tenants,
  products,
  serviceQuotes,
  services,
} from "@sass-store/database/schema";
import { eq, sql } from "drizzle-orm";
// Direct handler imports
import {
  POST as createQuote,
  GET as listQuotes,
} from "@/app/api/tenants/[tenant]/quotes/route";
import {
  GET as getQuote,
  PUT as updateQuote,
  DELETE as deleteQuote,
} from "@/app/api/tenants/[tenant]/quotes/[id]/route";
import { POST as convertQuote } from "@/app/api/tenants/[tenant]/quotes/[id]/convert-to-service/route";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

let tenantId: string;
let slug: string;
let serviceId: string;

beforeAll(async () => {
  const timestamp = Date.now();
  slug = `test-quotes-${timestamp}`;

  const [t] = await db
    .insert(tenants)
    .values({
      name: `Quotes Tenant`,
      slug,
      branding: {},
      contact: {},
      location: {},
      quotas: {},
    })
    .returning();
  tenantId = t.id;

  const [s] = await db
    .insert(services)
    .values({
      tenantId,
      name: "Test Service",
      description: "Base service for quotes",
      price: "500.00",
      duration: "1.0",
      active: true,
    })
    .returning();
  serviceId = s.id;
});

afterAll(async () => {
  // Cleanup
  await db.delete(serviceQuotes).where(eq(serviceQuotes.tenantId, tenantId));
  await db.delete(services).where(eq(services.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
});

describe("Quotes API Integration", () => {
  let quoteId: string;

  it("should create a new quote", async () => {
    const body = {
      serviceId,
      customerName: "John Doe",
      customerEmail: "john@example.com",
      notes: "Test quote",
      validityDays: 15,
    };

    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(body),
    });

    // Use params object as 2nd arg
    const res = await createQuote(req, { params: { tenant: slug } });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.quoteNumber).toBeDefined();
    expect(data.customerName).toBe("John Doe");
    expect(data.status).toBe("pending");
    quoteId = data.id;
  });

  it("should list quotes for the tenant", async () => {
    const req = new NextRequest("http://localhost");
    const res = await listQuotes(req, { params: { tenant: slug } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((q: any) => q.id === quoteId)).toBe(true);
  });

  it("should get quote details", async () => {
    const req = new NextRequest("http://localhost");
    const res = await getQuote(req, { params: { tenant: slug, id: quoteId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(quoteId);
    expect(data.service).toBeDefined();
  });

  it("should update quote status", async () => {
    const body = { status: "accepted", notes: "Updated notes" };
    const req = new NextRequest("http://localhost", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    const res = await updateQuote(req, {
      params: { tenant: slug, id: quoteId },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("accepted");
    expect(data.notes).toBe("Updated notes");
  });

  it("should convert quote to service", async () => {
    const req = new NextRequest("http://localhost", { method: "POST" });
    const res = await convertQuote(req, {
      params: { tenant: slug, id: quoteId },
    });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.name).toBe("Test Service"); // Inherited from quote

    // Verify quote status updated
    const quoteRes = await getQuote(new NextRequest("http://localhost"), {
      params: { tenant: slug, id: quoteId },
    });
    const quoteData = await quoteRes.json();
    expect(quoteData.status).toBe("converted");
  });

  it("should delete the quote", async () => {
    const req = new NextRequest("http://localhost", { method: "DELETE" });
    const res = await deleteQuote(req, {
      params: { tenant: slug, id: quoteId },
    });

    expect(res.status).toBe(200);

    // Verify gone
    const check = await getQuote(new NextRequest("http://localhost"), {
      params: { tenant: slug, id: quoteId },
    });
    expect(check.status).toBe(404);
  });
});
