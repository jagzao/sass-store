#!/usr/bin/env tsx

/**
 * Script to generate and store a new API key for a tenant
 * Usage: npx tsx scripts/generate-api-key.ts <tenant-slug> <key-name>
 */

import crypto from 'crypto';
import { db } from '../packages/database';
import { apiKeys, tenants } from '../packages/database/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a secure random API key
 * Format: ss_live_<32 random chars>
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomBytes = crypto.randomBytes(24);
  const randomPart = randomBytes.toString('base64url');
  const key = `ss_live_${randomPart}`;
  const prefix = key.substring(0, 15); // First 15 chars for identification
  const hash = crypto.createHash('sha256').update(key).digest('hex');

  return { key, prefix, hash };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    // SECURITY: Redacted sensitive log;
    // SECURITY: Redacted sensitive log;
    process.exit(1);
  }

  const [tenantSlug, keyName] = args;
  const permissions = args[2] ? JSON.parse(args[2]) : ['read', 'write'];

  try {
    // Find the tenant
    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantSlug}`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.slug})`);
    console.log('');

    // Generate the API key
    const { key, prefix, hash } = generateApiKey();

    // Store in database
    const [insertedKey] = await db
      .insert(apiKeys)
      .values({
        tenantId: tenant.id,
        key: hash,
        name: keyName,
        prefix,
        status: 'active',
        permissions: permissions as any,
      })
      .returning({ id: apiKeys.id, createdAt: apiKeys.createdAt });

    // SECURITY: Redacted sensitive log;
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    // SECURITY: Redacted sensitive log;
    console.log('');
    // SECURITY: Redacted sensitive log;
    console.log(`Prefix:      ${prefix}`);
    console.log(`Tenant:      ${tenant.slug}`);
    // SECURITY: Redacted sensitive log;
    console.log(`Permissions: ${JSON.stringify(permissions)}`);
    // SECURITY: Redacted sensitive log;
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Usage in API requests:');
    console.log('');
    // SECURITY: Redacted sensitive log;
    console.log('       -H "X-Tenant: ' + tenant.slug + '" \\');
    console.log('       https://your-api-url.com/api/endpoint');
    console.log('');

  } catch (error) {
    // SECURITY: Redacted sensitive log;
    process.exit(1);
  }

  process.exit(0);
}

main();
