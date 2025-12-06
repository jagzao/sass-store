# Deployment Log - First Production Deploy

**Date**: December 6, 2024
**Environment**: Vercel Production
**Projects**: API (sass-store-api) and Web (sass-store-web)

## Summary

Successfully deployed a Next.js monorepo application to Vercel with API and Web as separate projects.

---

## Initial Issues Encountered

### 1. Header Navigation Not Visible

**Problem**: TenantHeader was using conditional positioning that caused visibility issues.

**Root Cause**:

- File: `apps/web/components/ui/TenantHeader.tsx`
- Header used `position: absolute` for transparent variant
- This caused the header to not display properly on initial render

**Solution**:

- Changed to always use `position: sticky`
- Added inline style `style={{ position: "sticky", top: 0 }}`
- Commit: `a9d44fc - fix: ensure header is always visible using sticky position`

---

### 2. Images Not Displaying - Emojis Being Used as URLs

**Problem**: Services and products showed no images, console errors showed URLs like `/t/%F0%9F%92%85` (URL-encoded emojis).

**Root Cause**:

- Files: `apps/web/components/services/ServiceCard.tsx`, `apps/web/components/products/ProductCard.tsx`
- Emojis stored in `metadata.image` were being passed directly as `src` attributes to `<img>` elements
- Example: `💅` was being used as `<img src="💅" />` which the browser URL-encoded

**Investigation**:

- Checked database: Images stored as Unsplash CDN URLs in `image_url` column
- Found seed data in `apps/web/lib/db/seed-data.ts` had emojis in metadata

**Solution**:

- Added URL validation function `isValidImageUrl()` to both components
- Function checks if string starts with `http://`, `https://`, or `/`
- Only renders `<img>` if valid URL exists, otherwise shows emoji in `<div>`
- Commits:
  - `ab990d2 - fix: validate image URLs to prevent emojis being used as img src`
  - `8c4473a - fix: render service images as img elements for modal and card views`
  - `d5883b6 - fix: render images as img elements instead of text for proper URL display`

---

### 3. Hero Carousel Images - 400 Bad Request

**Problem**: Hero carousel images returned 400 errors from Next.js Image component.

**Root Cause**:

- File: `apps/web/components/tenant/wondernails/hero/slides.json`
- Referenced `img5.webp` and `img6.webp` but actual files were `img5.jpg` and `img6.jpg`
- File extension mismatch

**Solution**:

- Updated `slides.json` to use correct extensions (`.jpg` instead of `.webp`)
- Commit: `7a6808d - fix: correct hero image file extensions in slides.json`

---

### 4. Vercel Monorepo Configuration Issues

**Problem**: Multiple deployment failures with different error messages.

#### Issue 4.1: Module Not Found - @sass-store/core

**Error**: `Module not found: Can't resolve '@sass-store/core'` during Vercel build

**Attempted Solution** (Failed):

- Set `rootDirectory: apps/web` in Vercel settings
- This broke workspace resolution

**Why It Failed**:

- Setting `rootDirectory` prevented npm from seeing the workspace configuration
- Workspace packages like `@sass-store/core` couldn't be resolved

**Correct Solution**:

- Keep `rootDirectory` empty
- Use `buildCommand: cd apps/web && npm run build`
- Install happens at monorepo root, build happens in apps/web
- This allows npm workspaces to function correctly

#### Issue 4.2: Static Files Not Included in Deployment

**Problem**: All images returned 404 when accessing directly (e.g., `/tenants/wondernails/hero/img1.webp`)

**Root Cause**:

- Vercel builds from monorepo root
- Next.js in `apps/web/` looks for `public/` relative to its location
- Build process didn't copy `apps/web/public/` to the deployment output

**Attempted Solutions**:

1. **Tried**: Setting `output: 'standalone'` in `next.config.js`
   - **Result**: Files still not copied, caused additional issues

2. **Tried**: Changing `outputDirectory` to `apps/web` instead of `apps/web/.next`
   - **Result**: Build failed - `routes-manifest.json` not found

3. **Final Solution**: Added `prebuild` script to `apps/web/package.json`
   ```json
   "prebuild": "echo 'Copying public assets...' && mkdir -p ../../public && cp -r public/* ../../public/ || true"
   ```

   - Script runs before `npm run build`
   - Copies `apps/web/public/*` to monorepo root `public/`
   - Vercel includes these in the deployment

**Commits**:

- `2b302ce - fix: simplify vercel.json for proper monorepo setup`
- `6812490 - fix: remove standalone output mode for Vercel to properly serve static files`
- `16ce5ae - fix: add prebuild script to copy public assets to root for Vercel deployment`

---

### 5. NextAuth Session Errors (Expected)

**Problem**: Console shows `/api/auth/session 404 (Not Found)`

**Status**: This is expected behavior

- NextAuth is installed as a dependency
- No authentication routes are currently configured
- Error can be ignored or NextAuth can be configured in the future

---

## Final Working Configuration

### Vercel Dashboard Settings - Web Project (sass-store-web)

**Build & Development Settings**:

- **Framework Preset**: Next.js
- **Root Directory**: (empty/default)
- **Build Command**: `cd apps/web && npm run build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `npm install`

**Environment Variables**: _(Configure as needed)_

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` - API endpoint URL
- Any other required variables

### Vercel Dashboard Settings - API Project (sass-store-api)

**Build & Development Settings**:

- **Framework Preset**: Other
- **Root Directory**: `apps/api`
- **Build Command**: `npm run build`
- **Output Directory**: (default)
- **Install Command**: `cd ../.. && npm install`

### Repository Configuration

**File**: `vercel.json` (root)

```json
{
  "version": 2
}
```

**File**: `apps/web/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"]
}
```

**File**: `apps/web/package.json` (relevant scripts)

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "prebuild": "echo 'Copying public assets for Vercel...' && mkdir -p ../../public && cp -r public/* ../../public/ || true",
    "build": "next build",
    "start": "next start -p 3001"
  }
}
```

**File**: `apps/web/next.config.js` (key sections)

```js
const path = require("path");

const nextConfig = {
  // Don't use 'standalone' for Vercel
  output: process.env.CF_PAGES ? "export" : undefined,

  // Help Next.js trace dependencies in monorepo
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // ... rest of config
};
```

---

## Deployment Steps (Future Reference)

### For Code Changes (Automatic)

1. Commit changes to master branch
2. Push to GitHub: `git push origin master`
3. Vercel automatically deploys both projects
4. Wait 2-3 minutes for deployment to complete
5. Verify at production URLs

### For Configuration Changes (Manual)

1. Go to Vercel Dashboard
2. Select project (sass-store-web or sass-store-api)
3. Settings → General → Build & Development Settings
4. Update configuration
5. Click "Redeploy" on latest deployment
6. Select "Use existing Build Cache" (unless dependencies changed)

### Adding Environment Variables

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add variable with name, value, and environment (Production/Preview/Development)
3. Redeploy to apply changes

---

## Common Pitfalls to Avoid

### ❌ DON'T

1. **Don't set `rootDirectory: apps/web`** - Breaks npm workspace resolution
2. **Don't use `output: 'standalone'`** - Causes static file issues in monorepos
3. **Don't change `outputDirectory` to `apps/web`** - Next.js builds to `.next` subdirectory
4. **Don't skip the `prebuild` script** - Static files won't be copied
5. **Don't hardcode file extensions** - Verify actual file extensions match references

### ✅ DO

1. **Keep root directory empty** - Let Vercel build from monorepo root
2. **Use `cd apps/web && npm run build`** - Navigate to app before building
3. **Keep `outputDirectory: apps/web/.next`** - Point to Next.js output
4. **Use prebuild scripts** - Copy static assets before build
5. **Test image URLs directly** - Visit `/tenants/path/to/image.jpg` to verify 200 response

---

## Testing Checklist

After each deployment, verify:

- [ ] Homepage loads: `https://sass-store-web.vercel.app/`
- [ ] Tenant page loads: `https://sass-store-web.vercel.app/t/wondernails`
- [ ] Header/navigation is visible
- [ ] Hero carousel images display (no 400 errors)
- [ ] Service card images display correctly
- [ ] Product card images display correctly
- [ ] Direct image URL works: `https://sass-store-web.vercel.app/tenants/wondernails/hero/img1.webp`
- [ ] API responds: Check API endpoint health
- [ ] No critical console errors (NextAuth 404 is expected)

---

## Commits in This Deployment

1. `a9d44fc` - fix: ensure header is always visible using sticky position
2. `ab990d2` - fix: validate image URLs to prevent emojis being used as img src
3. `8c4473a` - fix: render service images as img elements for modal and card views
4. `d5883b6` - fix: render images as img elements instead of text for proper URL display
5. `7a6808d` - fix: correct hero image file extensions in slides.json
6. `2b302ce` - fix: simplify vercel.json for proper monorepo setup
7. `6812490` - fix: remove standalone output mode for Vercel to properly serve static files
8. `16ce5ae` - fix: add prebuild script to copy public assets to root for Vercel deployment

---

## Known Issues (Not Blocking)

1. **NextAuth Session 404**: Expected - no auth configured yet
2. **Service Worker 404**: `/sw.js` not found - PWA not configured
3. **Favicon 404**: No favicon configured yet
4. **Deprecation Warnings**:
   - Husky pre-commit/pre-push hooks format deprecated (v10 coming)
   - Some npm packages deprecated (non-critical)

---

## Resources

- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Next.js Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)

---

## Contact & Support

**Production URLs**:

- Web: https://sass-store-web.vercel.app
- API: https://sass-store-api.vercel.app

**GitHub Repository**: https://github.com/jagzao/sass-store
