# Detalles de Implementación: Cotizaciones

## Archivos a Crear/Modificar

### 1. Base de Datos

#### Nuevo archivo: `packages/database/migrations/quotes.sql`

```sql
-- Crear tabla de cotizaciones
CREATE TABLE service_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    service_id UUID REFERENCES services(id) NOT NULL,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration DECIMAL(4,1) NOT NULL,
    validity_days INTEGER NOT NULL DEFAULT 7,
    terms_conditions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    customer_name VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,

    CONSTRAINT tenant_quote_unique UNIQUE (tenant_id, quote_number)
);

-- Crear índices
CREATE INDEX idx_service_quotes_tenant ON service_quotes(tenant_id);
CREATE INDEX idx_service_quotes_service ON service_quotes(service_id);
CREATE INDEX idx_service_quotes_status ON service_quotes(status);
CREATE INDEX idx_service_quotes_expires ON service_quotes(expires_at);

-- Actualizar schema.ts con las relaciones
```

#### Modificar: `packages/database/schema.ts`

```typescript
// Agregar después de la tabla de services
export const serviceQuotes = pgTable(
  "service_quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    serviceId: uuid("service_id")
      .references(() => services.id)
      .notNull(),
    quoteNumber: varchar("quote_number", { length: 50 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    duration: decimal("duration", { precision: 4, scale: 1 }).notNull(),
    validityDays: integer("validity_days").notNull().default(7),
    termsConditions: text("terms_conditions"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    customerName: varchar("customer_name", { length: 100 }),
    customerEmail: varchar("customer_email", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 20 }),
    notes: text("notes"),
    metadata: jsonb("metadata").notNull().default("{}"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => ({
    tenantQuoteUnique: uniqueIndex("service_quotes_tenant_quote_unique_idx").on(
      table.tenantId,
      table.quoteNumber,
    ),
    tenantIdx: index("service_quotes_tenant_idx").on(table.tenantId),
    serviceIdx: index("service_quotes_service_idx").on(table.serviceId),
    statusIdx: index("service_quotes_status_idx").on(table.status),
    expiresIdx: index("service_quotes_expires_idx").on(table.expiresAt),
  }),
);

// Agregar relaciones
export const serviceQuotesRelations = relations(serviceQuotes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [serviceQuotes.tenantId],
    references: [tenants.id],
  }),
  service: one(services, {
    fields: [serviceQuotes.serviceId],
    references: [services.id],
  }),
}));

// Agregar a las relaciones de tenants
export const tenantsRelations = relations(tenants, ({ many }) => ({
  // ... existing relations
  serviceQuotes: many(serviceQuotes),
}));

// Agregar a las relaciones de services
export const servicesRelations = relations(services, ({ one, many }) => ({
  // ... existing relations
  quotes: many(serviceQuotes),
}));
```

### 2. API Endpoints

#### Nuevo archivo: `apps/web/app/api/tenants/[tenant]/quotes/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { serviceQuotes, tenants, services } from "@sass-store/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createQuoteSchema = z.object({
  serviceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  duration: z.number().positive(),
  validityDays: z.number().positive().default(7),
  termsConditions: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

// Función para generar número de cotización único
const generateQuoteNumber = async (tenantId: string): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Obtener el último número de cotización para este tenant y mes
  const lastQuote = await db
    .select({ quoteNumber: serviceQuotes.quoteNumber })
    .from(serviceQuotes)
    .where(
      and(
        eq(serviceQuotes.tenantId, tenantId),
        sql`EXTRACT(MONTH FROM ${serviceQuotes.createdAt}) = ${month + 1}`,
        sql`EXTRACT(YEAR FROM ${serviceQuotes.createdAt}) = ${year}`,
      ),
    )
    .orderBy(desc(serviceQuotes.createdAt))
    .limit(1);

  let sequence = 1;
  if (lastQuote.length > 0) {
    const match = lastQuote[0].quoteNumber.match(/-(\d+)$/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  return `COT-${year}${month}-${String(sequence).padStart(4, "0")}`;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Build query
    let query = db
      .select()
      .from(serviceQuotes)
      .where(eq(serviceQuotes.tenantId, tenant.id));

    if (status) {
      query = query.where(eq(serviceQuotes.status, status));
    }

    const quotes = await query.orderBy(desc(serviceQuotes.createdAt));

    return NextResponse.json({ data: quotes });
  } catch (error) {
    console.error("Quotes GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const quoteData = createQuoteSchema.parse(body);

    // Verify service exists and belongs to tenant
    const [service] = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.id, quoteData.serviceId),
          eq(services.tenantId, tenant.id),
        ),
      )
      .limit(1);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Generate quote number
    const quoteNumber = await generateQuoteNumber(tenant.id);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + quoteData.validityDays);

    // Create quote
    const [newQuote] = await db
      .insert(serviceQuotes)
      .values({
        tenantId: tenant.id,
        serviceId: quoteData.serviceId,
        quoteNumber,
        name: quoteData.name || service.name,
        description: quoteData.description || service.description,
        price: quoteData.price.toString(),
        duration: quoteData.duration.toString(),
        validityDays: quoteData.validityDays,
        termsConditions: quoteData.termsConditions,
        customerName: quoteData.customerName,
        customerEmail: quoteData.customerEmail,
        customerPhone: quoteData.customerPhone,
        notes: quoteData.notes,
        expiresAt,
      })
      .returning();

    return NextResponse.json({ data: newQuote }, { status: 201 });
  } catch (error) {
    console.error("Quotes POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

#### Nuevo archivo: `apps/web/app/api/tenants/[tenant]/quotes/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { serviceQuotes, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateQuoteSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  validityDays: z.number().positive().optional(),
  termsConditions: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "accepted", "rejected", "expired", "converted"])
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Find quote
    const [quote] = await db
      .select()
      .from(serviceQuotes)
      .where(
        and(eq(serviceQuotes.id, id), eq(serviceQuotes.tenantId, tenant.id)),
      )
      .limit(1);

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({ data: quote });
  } catch (error) {
    console.error("Quote GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const updateData = updateQuoteSchema.parse(body);

    // Update quote
    const [updatedQuote] = await db
      .update(serviceQuotes)
      .set({
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && {
          description: updateData.description,
        }),
        ...(updateData.price && { price: updateData.price.toString() }),
        ...(updateData.duration && {
          duration: updateData.duration.toString(),
        }),
        ...(updateData.validityDays && {
          validityDays: updateData.validityDays,
          expiresAt: new Date(
            Date.now() + updateData.validityDays * 24 * 60 * 60 * 1000,
          ),
        }),
        ...(updateData.termsConditions !== undefined && {
          termsConditions: updateData.termsConditions,
        }),
        ...(updateData.customerName !== undefined && {
          customerName: updateData.customerName,
        }),
        ...(updateData.customerEmail !== undefined && {
          customerEmail: updateData.customerEmail,
        }),
        ...(updateData.customerPhone !== undefined && {
          customerPhone: updateData.customerPhone,
        }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
        ...(updateData.status && { status: updateData.status }),
        updatedAt: new Date(),
      })
      .where(
        and(eq(serviceQuotes.id, id), eq(serviceQuotes.tenantId, tenant.id)),
      )
      .returning();

    if (!updatedQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedQuote });
  } catch (error) {
    console.error("Quote PUT error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Delete quote
    const deletedQuote = await db
      .delete(serviceQuotes)
      .where(
        and(eq(serviceQuotes.id, id), eq(serviceQuotes.tenantId, tenant.id)),
      )
      .returning();

    if (!deletedQuote.length) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

#### Nuevo archivo: `apps/web/app/api/tenants/[tenant]/quotes/[id]/convert-to-service/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { serviceQuotes, services, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Find quote
    const [quote] = await db
      .select()
      .from(serviceQuotes)
      .where(
        and(eq(serviceQuotes.id, id), eq(serviceQuotes.tenantId, tenant.id)),
      )
      .limit(1);

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Create service from quote
    const [newService] = await db
      .insert(services)
      .values({
        tenantId: tenant.id,
        name: quote.name,
        description: quote.description || null,
        price: quote.price,
        duration: quote.duration,
        active: true,
        metadata: {
          convertedFromQuote: quote.id,
          quoteNumber: quote.quoteNumber,
        },
      })
      .returning();

    // Update quote status
    await db
      .update(serviceQuotes)
      .set({
        status: "converted",
        updatedAt: new Date(),
      })
      .where(eq(serviceQuotes.id, id));

    return NextResponse.json({
      data: {
        service: newService,
        quote: {
          ...quote,
          status: "converted",
        },
      },
    });
  } catch (error) {
    console.error("Quote convert error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### 3. Componentes UI

#### Nuevo archivo: `apps/web/components/quotes/QuoteButton.tsx`

```typescript
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface QuoteButtonProps {
  service: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
  };
  tenantSlug: string;
  onQuoteCreated?: (quote: any) => void;
}

export function QuoteButton({ service, tenantSlug, onQuoteCreated }: QuoteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateQuote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tenants/${tenantSlug}/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          validityDays: 7, // Default 7 days
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create quote");
      }

      const { data } = await response.json();
      onQuoteCreated?.(data);

      // Show success message or redirect to quote details
      alert(`Cotización creada: ${data.quoteNumber}`);
    } catch (error) {
      console.error("Error creating quote:", error);
      alert("Error al crear la cotización");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreateQuote}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? "Creando..." : "Guardar como Cotización"}
    </Button>
  );
}
```

#### Nuevo archivo: `apps/web/components/quotes/QuoteCard.tsx`

```typescript
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuoteCardProps {
  quote: {
    id: string;
    quoteNumber: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    status: string;
    expiresAt: string;
    customerName?: string;
    customerPhone?: string;
  };
  tenantSlug: string;
  onEdit?: (quote: any) => void;
  onDelete?: (id: string) => void;
  onConvert?: (quote: any) => void;
  onSendWhatsApp?: (quote: any) => void;
}

export function QuoteCard({
  quote,
  tenantSlug,
  onEdit,
  onDelete,
  onConvert,
  onSendWhatsApp
}: QuoteCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      case "converted": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pendiente";
      case "accepted": return "Aceptada";
      case "rejected": return "Rechazada";
      case "expired": return "Expirada";
      case "converted": return "Convertida";
      default: return status;
    }
  };

  const handleSendWhatsApp = () => {
    if (quote.customerPhone) {
      const message = `*Cotización ${quote.quoteNumber}*\n\n` +
        `*Servicio:* ${quote.name}\n` +
        `*Descripción:* ${quote.description}\n` +
        `*Precio:* $${quote.price} MXN\n` +
        `*Duración:* ${quote.duration} horas\n` +
        `*Válida hasta:* ${new Date(quote.expiresAt).toLocaleDateString()}\n\n` +
        `Para aceptar esta cotización, responda a este mensaje.`;

      const encodedMessage = encodeURIComponent(message);
      const cleanPhone = quote.customerPhone.replace(/[^\d]/g, "");
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      window.open(whatsappUrl, "_blank");
    } else {
      alert("El cliente no tiene número de teléfono registrado");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{quote.name}</CardTitle>
          <Badge className={getStatusColor(quote.status)}>
            {getStatusText(quote.status)}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">Cotización: {quote.quoteNumber}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">{quote.description}</p>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">${quote.price}</span>
          <span className="text-sm text-gray-500">{quote.duration} horas</span>
        </div>

        {quote.customerName && (
          <div className="text-sm">
            <span className="font-medium">Cliente:</span> {quote.customerName}
          </div>
        )}

        <div className="text-sm text-gray-500">
          <span className="font-medium">Válida hasta:</span>{" "}
          {new Date(quote.expiresAt).toLocaleDateString()}
        </div>

        <div className="flex gap-2 flex-wrap">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(quote)}
            >
              Editar
            </Button>
          )}

          {onSendWhatsApp && quote.customerPhone && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendWhatsApp}
            >
              WhatsApp
            </Button>
          )}

          {onConvert && quote.status !== "converted" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConvert(quote)}
            >
              Convertir a Servicio
            </Button>
          )}

          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(quote.id)}
            >
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Modificar: `apps/web/components/services/ServiceCard.tsx`

```typescript
// Agregar import al inicio
import { QuoteButton } from "@/components/quotes/QuoteButton";

// En el componente ServiceCard, después del botón "Reservar Ahora" (línea ~200)
{isAdmin && (
  <div className="px-6 pb-6">
    <QuoteButton
      service={{
        id: id,
        name: name,
        description: shortDescription || description,
        price: price,
        duration: duration || 0,
      }}
      tenantSlug={tenantSlug}
    />
  </div>
)}
```

#### Modificar: `apps/web/app/t/[tenant]/services/services-client.tsx`

```typescript
// Agregar estado para isAdmin
const [isAdmin, setIsAdmin] = useState(false);

// Efecto para verificar si es admin
useEffect(() => {
  const checkAdmin = async () => {
    try {
      const response = await fetch("/api/auth/check-admin");
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  checkAdmin();
}, []);

// Pasar isAdmin a los componentes que lo necesiten
```

### 4. Páginas de Administración

#### Nuevo archivo: `apps/web/app/t/[tenant]/admin/quotes/page.tsx`

```typescript
import { notFound } from "next/navigation";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { QuotesClient } from "./quotes-client";

interface QuotesPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function QuotesPage({ params }: QuotesPageProps) {
  const resolvedParams = await params;
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Cotizaciones</h1>
      <QuotesClient tenantData={tenantData} />
    </div>
  );
}
```

#### Nuevo archivo: `apps/web/app/t/[tenant]/admin/quotes/quotes-client.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { QuoteCard } from "@/components/quotes/QuoteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuotesClientProps {
  tenantData: {
    slug: string;
    name: string;
    branding: {
      primaryColor: string;
    };
  };
}

export function QuotesClient({ tenantData }: QuotesClientProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/tenants/${tenantData.slug}/quotes?${params}`);
      const data = await response.json();
      setQuotes(data.data || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [tenantData.slug, statusFilter]);

  const handleDeleteQuote = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cotización?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tenants/${tenantData.slug}/quotes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchQuotes();
      } else {
        alert("Error al eliminar la cotización");
      }
    } catch (error) {
      console.error("Error deleting quote:", error);
      alert("Error al eliminar la cotización");
    }
  };

  const handleConvertQuote = async (quote: any) => {
    if (!confirm("¿Estás seguro de que quieres convertir esta cotización en un servicio?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tenants/${tenantData.slug}/quotes/${quote.id}/convert-to-service`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Cotización convertida a servicio exitosamente");
        await fetchQuotes();
      } else {
        alert("Error al convertir la cotización");
      }
    } catch (error) {
      console.error("Error converting quote:", error);
      alert("Error al convertir la cotización");
    }
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quote.customerName && quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-8">Cargando cotizaciones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar cotizaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="accepted">Aceptadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
            <SelectItem value="converted">Convertidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotes Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No se encontraron cotizaciones
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              tenantSlug={tenantData.slug}
              onDelete={handleDeleteQuote}
              onConvert={handleConvertQuote}
              onSendWhatsApp={(quote) => {
                if (quote.customerPhone) {
                  const message = `*Cotización ${quote.quoteNumber}*\n\n` +
                    `*Servicio:* ${quote.name}\n` +
                    `*Descripción:* ${quote.description}\n` +
                    `*Precio:* $${quote.price} MXN\n` +
                    `*Duración:* ${quote.duration} horas\n` +
                    `*Válida hasta:* ${new Date(quote.expiresAt).toLocaleDateString()}\n\n` +
                    `Para aceptar esta cotización, responda a este mensaje.`;

                  const encodedMessage = encodeURIComponent(message);
                  const cleanPhone = quote.customerPhone.replace(/[^\d]/g, "");
                  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

                  window.open(whatsappUrl, "_blank");
                } else {
                  alert("El cliente no tiene número de teléfono registrado");
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Tipos TypeScript

#### Nuevo archivo: `apps/web/types/quotes.ts`

```typescript
export interface Quote {
  id: string;
  tenantId: string;
  serviceId: string;
  quoteNumber: string;
  name: string;
  description: string | null;
  price: string;
  duration: string;
  validityDays: number;
  termsConditions: string | null;
  status: "pending" | "accepted" | "rejected" | "expired" | "converted";
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface CreateQuoteRequest {
  serviceId: string;
  name?: string;
  description?: string;
  price: number;
  duration: number;
  validityDays?: number;
  termsConditions?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export interface UpdateQuoteRequest {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  validityDays?: number;
  termsConditions?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  status?: "pending" | "accepted" | "rejected" | "expired" | "converted";
}
```

Este documento proporciona todos los detalles necesarios para implementar la funcionalidad de cotizaciones en el proyecto.
