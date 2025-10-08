# ⚡ Prime Performance Optimization Command

**Role:** Performance optimization orchestrator
**Type:** Prime command (standalone or called by workflow)
**Scope:** Core Web Vitals and performance optimization across all tenants

## 🎯 Purpose

Orchestrates comprehensive performance analysis and optimization for the SaaS Store multitenant system:

- Core Web Vitals optimization (LCP, INP, CLS)
- Bundle size analysis and optimization
- Image and asset optimization
- Database query performance
- Caching strategy implementation

## 📋 Usage

```bash
npm run perf:analyze [tenant] [--metric=LCP] [--fix]
npm run perf:lighthouse:all [--format=json]
npm run perf:bundle [--analyze]
npm run perf:db [--tenant=wondernails]
```

## 🔄 Workflow Steps

### 1. Performance Analysis Phase

- **Lighthouse:** Core Web Vitals measurement
- **Bundle Analyzer:** JavaScript bundle size analysis
- **Image Audit:** Asset optimization opportunities
- **Database Profiler:** Query performance analysis
- **Network Monitor:** API response time analysis

### 2. Issue Classification

```typescript
interface PerfIssue {
  metric: "LCP" | "INP" | "CLS" | "FCP" | "TTI" | "Bundle" | "DB";
  severity: "P0" | "P1" | "P2" | "P3";
  tenant: string;
  route: string;
  current_value: number;
  target_value: number;
  impact: "high" | "medium" | "low";
  fix_complexity: "simple" | "moderate" | "complex";
}
```

### 3. Auto-Fix Strategy

**P0/P1 Issues (Auto-fix):**

- Image optimization and format conversion
- CSS/JS minification
- Unused code elimination
- Simple caching headers

**P2/P3 Issues (Report only):**

- Complex code splitting recommendations
- Advanced caching strategies
- Database index suggestions
- CDN configuration changes

## ⚡ Core Web Vitals Optimization

### Largest Contentful Paint (LCP) < 2.5s

```typescript
// Auto-optimize hero images
const optimizations = {
  format: "webp", // Convert to WebP
  sizes: "(max-width: 768px) 100vw, 50vw",
  priority: true, // Add priority loading
  placeholder: "blur", // Add blur placeholder
};
```

### Interaction to Next Paint (INP) < 200ms

```typescript
// Optimize JavaScript execution
const jsOptimizations = {
  code_splitting: true, // Dynamic imports
  tree_shaking: true, // Remove unused code
  defer_non_critical: true, // Defer non-critical JS
  use_web_workers: true, // Offload heavy computations
};
```

### Cumulative Layout Shift (CLS) < 0.1

```css
/* Prevent layout shifts */
.image-container {
  aspect-ratio: 16/9; /* Reserve space */
  width: 100%;
}

.skeleton-loader {
  min-height: 200px; /* Reserve content space */
}
```

## 🎨 Tenant-Specific Performance

### Business Type Optimizations

```typescript
const perfStrategies = {
  wondernails: {
    priority_images: ["hero", "gallery"],
    critical_css: ["booking-form", "header"],
    preload_routes: ["/booking", "/services"],
  },
  delirios: {
    priority_images: ["menu-items", "hero"],
    critical_css: ["menu", "order-button"],
    preload_routes: ["/menu", "/order"],
  },
};
```

### Route-Specific Optimization

- **Home pages:** Hero image optimization, above-fold CSS
- **Catalog pages:** Image lazy loading, infinite scroll optimization
- **Booking pages:** Form performance, validation optimization
- **Checkout pages:** Payment processing optimization

## 🔧 Performance Fixes

### 1. Image Optimization

```tsx
// Auto-optimize images
<img src="/hero.jpg" />
↓
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1920}
  height={1080}
  priority
  placeholder="blur"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 2. Code Splitting

```typescript
// Implement dynamic imports
import BookingForm from '../components/BookingForm';
↓
const BookingForm = dynamic(() => import('../components/BookingForm'), {
  loading: () => <BookingFormSkeleton />
});
```

### 3. Bundle Optimization

```javascript
// Webpack bundle analysis fixes
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
};
```

### 4. Database Query Optimization

```typescript
// Optimize database queries
const products = await db.products.findMany();
↓
const products = await db.products.findMany({
  select: { id: true, name: true, price: true }, // Only needed fields
  where: { tenant_id, published: true },
  take: 20, // Pagination
  orderBy: { created_at: 'desc' }
});
```

## 📊 Performance Gates

**Core Web Vitals Requirements:**

- LCP < 2.5s ✅
- INP < 200ms ✅
- CLS < 0.1 ✅
- FCP < 1.8s ✅
- TTI < 3.8s ✅

**Additional Metrics:**

- Lighthouse Performance score > 90 ✅
- Bundle size < 250KB (gzipped) ✅
- API response time < 200ms ✅
- Image optimization > 80% ✅

## 🔍 Performance Monitoring

### Real User Monitoring (RUM)

```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric) {
  analytics.track("web-vital", {
    name: metric.name,
    value: metric.value,
    tenant: currentTenant,
    route: window.location.pathname,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Synthetic Testing

- **Lighthouse CI:** Automated performance testing
- **WebPageTest:** Multi-location performance testing
- **Core Web Vitals API:** Google's real-world data

## 🚨 NEED=HUMAN Triggers

Auto-escalate when:

- Infrastructure changes required (CDN, hosting)
- Complex architectural decisions needed
- Third-party service optimization required
- Budget constraints for performance tools
- Performance vs feature trade-offs needed

## 📈 Success Metrics

- Core Web Vitals "Good" rating: 100% of pages
- Lighthouse Performance score average > 90
- Page load time improvement > 30%
- Bounce rate reduction due to speed
- Conversion rate increase from performance

## 🔄 Performance Budget

**JavaScript Budget:**

- Main bundle: < 150KB (gzipped)
- Vendor bundle: < 100KB (gzipped)
- Route chunks: < 50KB each (gzipped)

**Image Budget:**

- Hero images: < 100KB (WebP)
- Gallery images: < 50KB each (WebP)
- Icons/thumbnails: < 10KB each

**Request Budget:**

- Initial page load: < 20 requests
- Critical path: < 10 requests
- Third-party scripts: < 5 requests

## 📁 Output Artifacts

**Reports Generated:**

- `agents/outputs/perf/lighthouse-{tenant}-{date}.json`
- `agents/outputs/perf/bundle-analysis-{date}.json`
- `agents/outputs/perf/core-web-vitals-{date}.json`
- `agents/outputs/perf/fixes-applied-{date}.md`

**Optimization Documentation:**

- Before/after performance metrics
- Bundle size reduction summary
- Image optimization results
- Database query improvements
- Caching strategy implementation
