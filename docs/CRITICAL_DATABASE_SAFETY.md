# 🚨 CRITICAL: Database Safety Protocol

## What Happened (Dec 16, 2025)

During a `git push`, the pre-push hook ran tests that executed `TRUNCATE CASCADE` on the **production database**, wiping all data.

### Root Cause

1. Tests in `tests/setup/vitest.setup.ts` run `cleanupTestData()` after each test
2. `cleanupTestData()` executes `TRUNCATE TABLE CASCADE` on all tables
3. `DATABASE_URL` was pointing to production (Supabase)
4. `TEST_DATABASE_URL` was not configured
5. Tests used production DB and wiped it clean ❌

## ✅ Safety Measures Implemented

### 1. Cleanup Protection

`tests/setup/test-database.ts` now has a critical safety check:

```typescript
export async function cleanupTestData() {
  // 🚨 CRITICAL SAFETY CHECK: Only cleanup if using explicit test database
  if (!process.env.TEST_DATABASE_URL) {
    console.warn(
      "⚠️  SKIPPING cleanup - TEST_DATABASE_URL not set (safety protection)",
    );
    return;
  }
  // ... cleanup code
}
```

### 2. Vitest Setup Modified

`tests/setup/vitest.setup.ts` now only runs cleanup when `TEST_DATABASE_URL` is set:

```typescript
afterEach(async () => {
  if (process.env.TEST_DATABASE_URL) {
    await cleanupTestData();
  }
  // Skips cleanup if using DATABASE_URL (production protection)
});
```

## 📋 Required Setup

### Option A: Use a Separate Test Database (RECOMMENDED)

1. Create a separate database for testing:
   - Local PostgreSQL: `createdb sass_store_test`
   - Or create a separate Supabase project for testing

2. Create `.env.test` or add to `.env.local`:

   ```bash
   TEST_DATABASE_URL="postgresql://user:password@localhost:5432/sass_store_test"
   ```

3. Tests will now use the test database and cleanup safely

### Option B: Run Tests Without Database Cleanup

If you don't configure `TEST_DATABASE_URL`:

- Tests will still run
- Database cleanup will be **SKIPPED** (safe)
- You may need to manually clean test data

## 🔒 Git Hooks

### Pre-push Hook

Located in `.husky/pre-push`:

- Runs type checking
- Runs unit tests (logger, alerts, complete-flows)
- **Will NOT cleanup database unless TEST_DATABASE_URL is set**

## 🆘 Data Recovery

If production data was lost:

1. **Supabase Dashboard**: https://supabase.com/dashboard
2. Navigate to: **Database** → **Backups**
3. Find the most recent backup before the incident
4. Click **Restore** to recover data

## ⚠️ Prevention Checklist

- [ ] Never put production `DATABASE_URL` in `.env` without `TEST_DATABASE_URL`
- [ ] Always use separate test database
- [ ] Review `.husky/pre-push` before running `git push`
- [ ] Keep Supabase backups enabled (automatic daily backups)
- [ ] Test database setup with non-critical data first

## 📞 Emergency Contacts

If this happens again:

1. **IMMEDIATELY** restore from Supabase backup
2. Check `.env.local` for `TEST_DATABASE_URL`
3. Review this document
4. Contact database admin if needed

---

**Last Updated**: December 16, 2025
**Incident**: Production database wiped during git push
**Status**: ✅ Safety measures implemented
