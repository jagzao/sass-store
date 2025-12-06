# Quick Deployment Checklist

## Before Deploying

- [ ] All tests pass locally: `npm test`
- [ ] Build succeeds locally: `cd apps/web && npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Commit all changes: `git add . && git commit -m "message"`
- [ ] Push to GitHub: `git push origin master`

## Vercel Configuration (One-time Setup)

### Web Project

- [ ] Root Directory: **empty**
- [ ] Build Command: `cd apps/web && npm run build`
- [ ] Output Directory: `apps/web/.next`
- [ ] Install Command: `npm install`
- [ ] Environment variables configured

### API Project

- [ ] Root Directory: `apps/api`
- [ ] Build Command: `npm run build`
- [ ] Install Command: `cd ../.. && npm install`
- [ ] Environment variables configured

## After Deployment

- [ ] Web loads: https://sass-store-web.vercel.app
- [ ] API health check passes
- [ ] Images load (check hero carousel)
- [ ] Navigation visible
- [ ] No critical console errors
- [ ] Test a complete user flow

## Common Issues Quick Fix

**Images not loading?**

1. Check `apps/web/package.json` has prebuild script
2. Verify Output Directory is `apps/web/.next`
3. Test direct image URL: `/tenants/wondernails/hero/img1.webp`

**Build fails - Module not found?**

1. Verify Root Directory is **empty** (not `apps/web`)
2. Check Install Command is `npm install` (at root)
3. Ensure workspace packages are in root `package.json`

**Routes not working?**

1. Check `next.config.js` - NO `output: 'standalone'`
2. Verify rewrites/redirects in config
3. Check middleware isn't blocking routes
