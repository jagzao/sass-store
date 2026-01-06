import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { db } from "@sass-store/database";
import { tenants, products } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Configuración del servidor de prueba
const app = next({ dev: false, port: 0 });
const handle = app.getRequestHandler();

let server: any;
let port: number;
let tenant1Id: string;
let tenant2Id: string;
let product1Id: string;
let product2Id: string;

beforeAll(async () => {
  await app.prepare();

  server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  });

  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      resolve(null);
    });
  });

  // Crear tenants de prueba
  const tenant1 = await db
    .insert(tenants)
    .values({
      name: "Tenant 1",
      slug: "tenant-1",
      domain: "tenant1.example.com",
    })
    .returning();

  const tenant2 = await db
    .insert(tenants)
    .values({
      name: "Tenant 2",
      slug: "tenant-2",
      domain: "tenant2.example.com",
    })
    .returning();

  tenant1Id = tenant1[0].id;
  tenant2Id = tenant2[0].id;

  // Crear productos de prueba para cada tenant
  const product1 = await db
    .insert(products)
    .values({
      tenantId: tenant1Id,
      sku: "PROD-001",
      name: "Producto Tenant 1",
      description: "Descripción del producto del tenant 1",
      price: "100.00",
      category: "Categoría 1",
      featured: true,
      active: true,
      metadata: {},
    })
    .returning();

  const product2 = await db
    .insert(products)
    .values({
      tenantId: tenant2Id,
      sku: "PROD-002",
      name: "Producto Tenant 2",
      description: "Descripción del producto del tenant 2",
      price: "200.00",
      category: "Categoría 2",
      featured: true,
      active: true,
      metadata: {},
    })
    .returning();

  product1Id = product1[0].id;
  product2Id = product2[0].id;
});

afterAll(async () => {
  // Limpiar datos de prueba
  await db.delete(products).where(eq(products.tenantId, tenant1Id));
  await db.delete(products).where(eq(products.tenantId, tenant2Id));
  await db.delete(tenants).where(eq(tenants.id, tenant1Id));
  await db.delete(tenants).where(eq(tenants.id, tenant2Id));

  await server.close();
  await app.close();
});

beforeEach(async () => {
  // Establecer contexto de tenant para las pruebas
  await db.execute(sql`SELECT set_tenant_context(${tenant1Id}::uuid)`);
});

describe("API de Productos - Aislamiento de Tenant", () => {
  it("debería obtener solo los productos del tenant actual", async () => {
    // Establecer contexto del tenant 1
    await db.execute(sql`SELECT set_tenant_context(${tenant1Id}::uuid)`);

    const response = await fetch(`http://localhost:${port}/api/v1/products`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Headers de autenticación simulados
        Cookie: `next-auth.session-token=test-session-tenant-1`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe("Producto Tenant 1");
    expect(data.data[0].tenantId).toBe(tenant1Id);
  });

  it("debería crear un producto solo para el tenant actual", async () => {
    // Establecer contexto del tenant 2
    await db.execute(sql`SELECT set_tenant_context(${tenant2Id}::uuid)`);

    const newProduct = {
      sku: "PROD-003",
      name: "Nuevo Producto Tenant 2",
      description: "Descripción del nuevo producto",
      price: "150.00",
      category: "Nueva Categoría",
      featured: false,
      active: true,
    };

    const response = await fetch(`http://localhost:${port}/api/v1/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Headers de autenticación simulados
        Cookie: `next-auth.session-token=test-session-tenant-2`,
      },
      body: JSON.stringify(newProduct),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe("Nuevo Producto Tenant 2");

    // Verificar que el producto se creó con el tenantId correcto
    const createdProduct = await db
      .select()
      .from(products)
      .where(eq(products.sku, "PROD-003"))
      .limit(1);

    expect(createdProduct[0].tenantId).toBe(tenant2Id);

    // Limpiar el producto creado
    await db.delete(products).where(eq(products.sku, "PROD-003"));
  });

  it("no debería permitir acceder a productos de otro tenant", async () => {
    // Establecer contexto del tenant 1
    await db.execute(sql`SELECT set_tenant_context(${tenant1Id}::uuid)`);

    // Intentar obtener el producto del tenant 2
    const response = await fetch(
      `http://localhost:${port}/api/v1/products/${product2Id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Headers de autenticación simulados
          Cookie: `next-auth.session-token=test-session-tenant-1`,
        },
      },
    );

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Product not found");
  });

  it("no debería permitir modificar productos de otro tenant", async () => {
    // Establecer contexto del tenant 1
    await db.execute(sql`SELECT set_tenant_context(${tenant1Id}::uuid)`);

    const updateData = {
      sku: "PROD-002-MODIFIED",
      name: "Producto Modificado",
      description: "Descripción modificada",
      price: "250.00",
      category: "Categoría Modificada",
      featured: false,
      active: true,
    };

    // Intentar modificar el producto del tenant 2
    const response = await fetch(
      `http://localhost:${port}/api/v1/products/${product2Id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // Headers de autenticación simulados
          Cookie: `next-auth.session-token=test-session-tenant-1`,
        },
        body: JSON.stringify(updateData),
      },
    );

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Product not found");

    // Verificar que el producto no fue modificado
    const unchangedProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, product2Id))
      .limit(1);

    expect(unchangedProduct[0].name).toBe("Producto Tenant 2");
    expect(unchangedProduct[0].price).toBe("200.00");
  });

  it("no debería permitir eliminar productos de otro tenant", async () => {
    // Establecer contexto del tenant 1
    await db.execute(sql`SELECT set_tenant_context(${tenant1Id}::uuid)`);

    // Intentar eliminar el producto del tenant 2
    const response = await fetch(
      `http://localhost:${port}/api/v1/products/${product2Id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          // Headers de autenticación simulados
          Cookie: `next-auth.session-token=test-session-tenant-1`,
        },
      },
    );

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Product not found");

    // Verificar que el producto no fue eliminado
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, product2Id))
      .limit(1);

    expect(existingProduct).toHaveLength(1);
  });

  it("debería permitir modificar productos del propio tenant", async () => {
    // Establecer contexto del tenant 1
    await db.execute(sql`SELECT set_tenant_context(${tenant1Id}::uuid)`);

    const updateData = {
      sku: "PROD-001-MODIFIED",
      name: "Producto Tenant 1 Modificado",
      description: "Descripción modificada",
      price: "150.00",
      category: "Categoría Modificada",
      featured: false,
      active: true,
    };

    // Modificar el producto del tenant 1
    const response = await fetch(
      `http://localhost:${port}/api/v1/products/${product1Id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // Headers de autenticación simulados
          Cookie: `next-auth.session-token=test-session-tenant-1`,
        },
        body: JSON.stringify(updateData),
      },
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe("Producto Tenant 1 Modificado");
    expect(data.data.price).toBe("150.00");

    // Verificar que el producto fue modificado
    const modifiedProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, product1Id))
      .limit(1);

    expect(modifiedProduct[0].name).toBe("Producto Tenant 1 Modificado");
    expect(modifiedProduct[0].price).toBe("150.00");
  });

  it("debería permitir eliminar productos del propio tenant", async () => {
    // Establecer contexto del tenant 1
    await db.execute(sql`SELECT set_tenant_context(${tenant1Id}::uuid)`);

    // Eliminar el producto del tenant 1
    const response = await fetch(
      `http://localhost:${port}/api/v1/products/${product1Id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          // Headers de autenticación simulados
          Cookie: `next-auth.session-token=test-session-tenant-1`,
        },
      },
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Product deleted successfully");

    // Verificar que el producto fue eliminado
    const deletedProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, product1Id))
      .limit(1);

    expect(deletedProduct).toHaveLength(0);
  });
});
