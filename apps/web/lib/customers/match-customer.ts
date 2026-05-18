import { db } from "@sass-store/database";
import { customers } from "@sass-store/database/schema";
import { and, eq, ilike, or } from "drizzle-orm";

export interface CustomerMatchInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CustomerMatchResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number;
  reasons: string[];
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizePhone(phone: string): string {
  let d = digitsOnly(phone);
  if (d.length === 10) d = `52${d}`;
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

/**
 * Quick tenant-scoped customer lookup for booking ↔ client linking.
 */
export async function findCustomerMatches(
  tenantId: string,
  input: CustomerMatchInput,
  limit = 5,
): Promise<CustomerMatchResult[]> {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const phoneNorm = input.phone ? normalizePhone(input.phone) : "";

  if (!name && !email && !phoneNorm) {
    return [];
  }

  const conditions = [];
  if (email) {
    conditions.push(ilike(customers.email, email));
  }
  if (name.length >= 2) {
    conditions.push(ilike(customers.name, `%${name}%`));
  }
  if (phoneNorm.length >= 7) {
    const last10 = phoneNorm.slice(-10);
    conditions.push(ilike(customers.phone, `%${last10}%`));
  }

  if (conditions.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
    })
    .from(customers)
    .where(and(eq(customers.tenantId, tenantId), or(...conditions)))
    .limit(20);

  const scored: CustomerMatchResult[] = [];

  for (const row of rows) {
    let score = 0;
    const reasons: string[] = [];

    if (phoneNorm && row.phone) {
      const rowPhone = normalizePhone(row.phone);
      if (
        rowPhone === phoneNorm ||
        rowPhone.endsWith(phoneNorm.slice(-10)) ||
        phoneNorm.endsWith(rowPhone.slice(-10))
      ) {
        score += 100;
        reasons.push("teléfono");
      }
    }

    if (email && row.email?.toLowerCase() === email) {
      score += 80;
      reasons.push("email");
    }

    if (name.length >= 2 && row.name) {
      const rowName = row.name.toLowerCase();
      const searchName = name.toLowerCase();
      if (rowName === searchName) {
        score += 60;
        reasons.push("nombre exacto");
      } else if (rowName.includes(searchName) || searchName.includes(rowName)) {
        score += 30;
        reasons.push("nombre similar");
      }
    }

    if (score > 0) {
      scored.push({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        score,
        reasons,
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function pickBestCustomerMatch(
  matches: CustomerMatchResult[],
): CustomerMatchResult | null {
  if (matches.length === 0) return null;
  const best = matches[0];
  if (matches.length === 1) return best;
  if (best.score >= 80 && best.score - matches[1].score >= 20) {
    return best;
  }
  return null;
}
