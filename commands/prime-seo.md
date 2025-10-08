# 🔍 Prime SEO Optimization Command

**Role:** SEO optimization orchestrator
**Type:** Prime command (standalone or called by workflow)
**Scope:** Search engine optimization across all tenants

## 🎯 Purpose

Orchestrates comprehensive SEO analysis and optimization for the SaaS Store multitenant system:

- Meta tags and structured data
- Core Web Vitals optimization
- Canonical URLs and sitemap generation
- Mobile-first indexing compliance
- Tenant-specific SEO strategies

## 📋 Usage

```bash
npm run seo:analyze [tenant] [--priority=P1] [--fix]
npm run seo:audit:all [--format=json]
npm run seo:lighthouse [--tenant=wondernails]
```

## 🔄 Workflow Steps

### 1. SEO Analysis Phase

- **Scanner:** Crawl all tenant routes for SEO issues
- **Analyzer:** Check meta tags, headings, content structure
- **Validator:** Verify structured data and schema markup
- **Reporter:** Generate SEO audit report

### 2. Issue Classification

```typescript
interface SEOIssue {
  type: "meta" | "content" | "technical" | "performance";
  severity: "P0" | "P1" | "P2" | "P3";
  tenant: string;
  route: string;
  element?: string;
  current?: string;
  recommended: string;
}
```

### 3. Auto-Fix Strategy

**P0/P1 Issues (Auto-fix):**

- Missing meta descriptions
- Duplicate title tags
- Missing canonical URLs
- Basic structured data

**P2/P3 Issues (Report only):**

- Content optimization suggestions
- Image alt text improvements
- Internal linking opportunities

## 🎨 Tenant-Specific SEO

### Business Type Optimization

```typescript
const seoStrategies = {
  wondernails: {
    type: "beauty_salon",
    keywords: ["nail salon", "manicure", "pedicure"],
    schema: "BeautySalon",
    localBusiness: true,
  },
  vigistudio: {
    type: "photography",
    keywords: ["photographer", "studio", "portraits"],
    schema: "PhotographyBusiness",
    localBusiness: true,
  },
  delirios: {
    type: "restaurant",
    keywords: ["restaurant", "delivery", "mexican food"],
    schema: "Restaurant",
    localBusiness: true,
  },
};
```

### Route-Specific Optimization

- **Catalog pages:** Product schema, price markup
- **Booking pages:** Service schema, availability
- **About pages:** LocalBusiness schema
- **Contact pages:** ContactPoint schema

## 🔧 Technical SEO Fixes

### 1. Meta Tag Optimization

```typescript
// Auto-fix missing meta descriptions
export const metadata = {
  title: "Wondernails - Professional Nail Salon",
  description:
    "Book your nail appointment today. Professional manicures, pedicures, and nail art in a relaxing environment.",
  keywords: "nail salon, manicure, pedicure, nail art",
  openGraph: {
    title: "Wondernails - Professional Nail Salon",
    description: "Book your nail appointment today.",
    images: "/api/og/wondernails",
  },
};
```

### 2. Structured Data Implementation

```json
{
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "name": "Wondernails",
  "description": "Professional nail salon services",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "...",
    "addressLocality": "...",
    "addressRegion": "...",
    "postalCode": "..."
  },
  "telephone": "...",
  "url": "https://sass-store.com/t/wondernails",
  "openingHours": "Mo,Tu,We,Th,Fr 09:00-18:00",
  "priceRange": "$$"
}
```

### 3. Core Web Vitals Optimization

- **LCP:** Optimize hero images and critical CSS
- **INP:** Minimize JavaScript blocking time
- **CLS:** Prevent layout shifts in dynamic content

## 📊 Performance Gates

**Required Metrics:**

- LCP < 2.5s ✅
- INP < 200ms ✅
- CLS < 0.1 ✅
- Lighthouse SEO score > 90 ✅

**SEO Health Checks:**

- All pages have unique titles ✅
- Meta descriptions under 160 characters ✅
- Canonical URLs properly set ✅
- Structured data validates ✅
- Mobile-friendly test passes ✅

## 🚨 NEED=HUMAN Triggers

Auto-escalate when:

- Content strategy decisions needed
- Brand voice and messaging conflicts
- Local business data missing/incorrect
- Competitor analysis required
- Major algorithm changes detected

## 📈 Success Metrics

- Organic search traffic increase
- Keyword ranking improvements
- Core Web Vitals compliance
- Rich snippet appearance rate
- Local search visibility (for applicable tenants)

## 🔄 Monitoring & Reporting

**Daily Checks:**

- Core Web Vitals monitoring
- Structured data validation
- Canonical URL verification

**Weekly Reports:**

- SEO health summary per tenant
- Ranking changes notification
- Technical issue alerts

**Monthly Analysis:**

- Comprehensive SEO audit
- Competitor comparison
- Strategy recommendation updates

## 📁 Output Artifacts

**Reports Generated:**

- `agents/outputs/seo/audit-{date}.json`
- `agents/outputs/seo/lighthouse-{tenant}-{date}.json`
- `agents/outputs/seo/fixes-applied-{date}.md`

**Fix Documentation:**

- Before/after meta tag comparisons
- Structured data validation results
- Performance improvement metrics
- Implementation recommendations
