# Campaigns & Reels Migration Guide

## 📋 Overview

This migration adds two new tables to support social media content management:
- **`campaigns`**: Marketing campaigns for video content
- **`reels`**: Instagram/TikTok reels with automated generation

## 🎯 What's Included

### Database Changes
1. **Campaigns Table**
   - Stores campaign information (type, slug, LUT files)
   - Linked to tenants for multi-tenant support
   - Includes 4 pre-populated campaigns for WonderNails

2. **Reels Table**
   - Stores reel content and generation settings
   - Links to campaigns for organization
   - Supports image sequences, music, overlays, and hashtags

3. **RLS Policies**
   - Full Row Level Security for tenant isolation
   - Service role: Full access
   - Authenticated: Full access (app-level tenant filtering)
   - Anonymous: Read-only access

### Schema Updates
- Added to `packages/database/schema.ts`
- Full Drizzle ORM integration with relations
- TypeScript types automatically generated

## 🚀 How to Apply the Migration

### Option 1: Using the TypeScript Script (Recommended)

```bash
# From project root
npx tsx scripts/apply-campaigns-reels-migration.ts
```

This script will:
- ✅ Apply the migration
- ✅ Verify campaigns were created
- ✅ Show detailed output

### Option 2: Manual Application via Supabase

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/jedryjmljffuvegggjmw/editor

2. **Run the SQL**
   - Copy contents from: `packages/database/migrations/add-campaigns-reels-tables.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Results**
   - Should see: "Success. No rows returned"
   - Check campaigns table for 4 WonderNails campaigns

### Option 3: Using psql CLI

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.jedryjmljffuvegggjmw.supabase.co:5432/postgres"

# Apply migration
psql $DATABASE_URL -f packages/database/migrations/add-campaigns-reels-tables.sql
```

## ✅ Verification Steps

### 1. Check Campaigns Created

Run this query in Supabase SQL Editor:

```sql
SELECT id, name, type, slug, lut_file
FROM campaigns
WHERE tenant_id = '3da221b3-d5f8-4c33-996a-b46b68843d99'
ORDER BY name;
```

**Expected Result:** 4 campaigns
- Belleza WonderNails
- Navidad WonderNails
- Promociones WonderNails
- Verano WonderNails

### 2. Check RLS Policies

```sql
-- List all policies for campaigns
SELECT * FROM pg_policies WHERE tablename = 'campaigns';

-- List all policies for reels
SELECT * FROM pg_policies WHERE tablename = 'reels';
```

**Expected Result:** 3 policies per table (service_role, authenticated, anon)

### 3. Test Table Structure

```sql
-- Check campaigns table structure
\d campaigns

-- Check reels table structure
\d reels
```

## 📊 Pre-populated Data

### WonderNails Campaigns

| Campaign | Type | Slug | LUT File |
|----------|------|------|----------|
| Belleza WonderNails | belleza | belleza-wondernails | assets/luts/zo-system/belleza_warm.cube |
| Navidad WonderNails | navidad | navidad-wondernails | assets/luts/zo-system/navidad_gold.cube |
| Promociones WonderNails | promocional | promocional-wondernails | assets/luts/HardBoost.cube |
| Verano WonderNails | verano | verano-wondernails | assets/luts/BlueHour.cube |

## 🔧 Using the New Tables

### TypeScript/Drizzle ORM

```typescript
import { campaigns, reels, db } from '@sass-store/database';
import { eq } from 'drizzle-orm';

// Get all campaigns for a tenant
const tenantCampaigns = await db
  .select()
  .from(campaigns)
  .where(eq(campaigns.tenantId, tenantId));

// Create a new reel
const newReel = await db
  .insert(reels)
  .values({
    tenantId: 'wondernails-tenant-id',
    campaignId: 'campaign-id',
    title: 'Summer Nails 2025',
    status: 'pending',
    imageUrls: ['image1.jpg', 'image2.jpg'],
    overlayType: 'beauty',
    musicFile: 'summer-vibes.mp3',
    hashtags: ['#nails', '#beauty', '#wondernails'],
    caption: 'Check out our summer collection!',
  })
  .returning();
```

### API Endpoints (Next.js)

```typescript
// Example: GET /api/v1/campaigns
export async function GET(request: NextRequest) {
  const tenant = await resolveTenant(request);

  const campaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.tenantId, tenant.id));

  return NextResponse.json({ campaigns });
}

// Example: POST /api/v1/reels
export async function POST(request: NextRequest) {
  const tenant = await resolveTenant(request);
  const body = await request.json();

  const reel = await db
    .insert(reels)
    .values({
      tenantId: tenant.id,
      ...body,
    })
    .returning();

  return NextResponse.json({ reel });
}
```

## 🔒 Security Notes

### RLS Policies Applied

1. **campaigns_service_role_all**: Service role has full access
2. **campaigns_authenticated_all**: Authenticated users can CRUD
3. **campaigns_anon_read**: Anonymous users can read only

Same policies apply to `reels` table.

### Tenant Isolation

- Application-level tenant filtering via `tenant_id`
- RLS ensures database-level security
- All queries should filter by `tenant_id`

## 🐛 Troubleshooting

### Migration Fails with "relation already exists"

The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to re-run. If tables exist, they won't be recreated.

### Campaigns Not Created

Check if WonderNails tenant exists:

```sql
SELECT id, slug, name FROM tenants
WHERE slug = 'wondernails';
```

If tenant doesn't exist, update the INSERT statements with the correct tenant ID.

### RLS Policy Errors

Verify RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('campaigns', 'reels');
```

Both should show `rowsecurity = true`.

## 📝 Rollback Instructions

If you need to rollback the migration:

```sql
-- Drop tables (this will also drop all policies)
DROP TABLE IF EXISTS reels CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

-- Drop the update trigger function if no other tables use it
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## 🎉 Next Steps

After migration is complete:

1. ✅ Create API endpoints for campaigns and reels
2. ✅ Build UI for reel generation
3. ✅ Implement video rendering pipeline
4. ✅ Test with WonderNails tenant
5. ✅ Roll out to other tenants

## 📞 Support

If you encounter issues:
- Check logs: `npx tsx scripts/apply-campaigns-reels-migration.ts`
- Verify in Supabase: https://supabase.com/dashboard/project/jedryjmljffuvegggjmw/editor
- Review migration file: `packages/database/migrations/add-campaigns-reels-tables.sql`

---

**Migration File:** `packages/database/migrations/add-campaigns-reels-tables.sql`
**Schema File:** `packages/database/schema.ts`
**Apply Script:** `scripts/apply-campaigns-reels-migration.ts`
