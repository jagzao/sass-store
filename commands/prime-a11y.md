# ♿ Prime Accessibility Command

**Role:** Accessibility compliance orchestrator
**Type:** Prime command (standalone or called by workflow)
**Scope:** WCAG 2.1 AA compliance across all tenants

## 🎯 Purpose

Orchestrates comprehensive accessibility analysis and remediation for the SaaS Store multitenant system:

- WCAG 2.1 Level AA compliance
- Screen reader compatibility
- Keyboard navigation support
- Color contrast validation
- Form accessibility standards

## 📋 Usage

```bash
npm run a11y:audit [tenant] [--level=AA] [--fix]
npm run a11y:axe:all [--format=json]
npm run a11y:lighthouse [--tenant=wondernails]
npm run a11y:keyboard [--route=/t/wondernails/booking]
```

## 🔄 Workflow Steps

### 1. Accessibility Analysis Phase

- **Scanner:** Automated axe-core testing across routes
- **Validator:** WCAG 2.1 compliance checking
- **Tester:** Keyboard navigation verification
- **Reporter:** Generate accessibility audit report

### 2. Issue Classification

```typescript
interface A11yIssue {
  type: "contrast" | "focus" | "label" | "structure" | "keyboard";
  level: "A" | "AA" | "AAA";
  severity: "P0" | "P1" | "P2" | "P3";
  tenant: string;
  route: string;
  element: string;
  wcagGuideline: string;
  current: string;
  recommended: string;
}
```

### 3. Auto-Fix Strategy

**P0/P1 Issues (Auto-fix):**

- Missing alt text on images
- Insufficient color contrast
- Missing form labels
- Heading structure issues

**P2/P3 Issues (Report only):**

- Complex navigation improvements
- Advanced ARIA implementations
- Enhanced screen reader support

## ♿ WCAG 2.1 Compliance Checks

### Level A Requirements

- **Alt Text:** All images have descriptive alt attributes
- **Keyboard Access:** All interactive elements keyboard accessible
- **Form Labels:** All form controls have associated labels
- **Headings:** Proper heading hierarchy (h1 → h2 → h3)

### Level AA Requirements

- **Color Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators:** Visible focus indicators on all interactive elements
- **Resize Text:** Content readable at 200% zoom
- **Color Independence:** Information not conveyed by color alone

## 🎨 Tenant-Specific Accessibility

### Color Palette Validation

```typescript
const contrastChecks = {
  wondernails: {
    primary: "#ff6b9d", // Brand pink
    background: "#ffffff",
    text: "#333333",
    required_contrast: 4.5,
  },
  vigistudio: {
    primary: "#2d3748", // Dark gray
    background: "#f7fafc",
    text: "#1a202c",
    required_contrast: 4.5,
  },
};
```

### Component Accessibility Patterns

```typescript
// Auto-fix missing accessibility attributes
<button onClick={handleBooking}>
  Book Now
</button>
↓
<button
  onClick={handleBooking}
  aria-label="Book appointment now"
  data-testid="book-now">
  Book Now
</button>
```

## 🔧 Common Accessibility Fixes

### 1. Image Alt Text

```tsx
// Fix missing alt text
<img src="/hero.jpg" />
↓
<img
  src="/hero.jpg"
  alt="Professional nail technician working on customer's nails in modern salon"
/>
```

### 2. Form Accessibility

```tsx
// Fix missing form labels
<input type="email" placeholder="Email" />
↓
<div>
  <label htmlFor="email" className="sr-only">Email Address</label>
  <input
    id="email"
    type="email"
    placeholder="Email"
    aria-describedby="email-help"
    required
  />
  <div id="email-help" className="sr-only">
    Enter your email address to receive booking confirmations
  </div>
</div>
```

### 3. Focus Management

```tsx
// Add proper focus indicators
.button:focus {
  outline: none;
}
↓
.button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### 4. Color Contrast Fixes

```css
/* Fix insufficient contrast */
.primary-text {
  color: #ff9999; /* 2.1:1 contrast - FAIL */
}
↓ .primary-text {
  color: #cc0000; /* 4.5:1 contrast - PASS */
}
```

## 🔍 Testing Strategy

### Automated Testing

- **axe-core:** Comprehensive accessibility rule checking
- **Lighthouse:** Accessibility score and recommendations
- **WAVE:** Web accessibility evaluation
- **Color Oracle:** Color blindness simulation

### Manual Testing

- **Keyboard Navigation:** Tab order and focus management
- **Screen Reader:** NVDA/JAWS compatibility testing
- **Zoom Testing:** 200% zoom readability
- **High Contrast:** Windows high contrast mode

## 📊 Accessibility Gates

**Required Compliance:**

- WCAG 2.1 Level AA ✅
- Lighthouse Accessibility score > 95 ✅
- Zero axe-core violations (critical/serious) ✅
- Keyboard navigation 100% functional ✅
- Color contrast ratio ≥ 4.5:1 ✅

**Per-Tenant Validation:**

- All booking flows keyboard accessible ✅
- All product catalogs screen reader compatible ✅
- All forms properly labeled ✅
- All images have descriptive alt text ✅

## 🚨 NEED=HUMAN Triggers

Auto-escalate when:

- Complex ARIA patterns required
- Designer review needed for contrast fixes
- Content writer review needed for alt text
- UX changes required for keyboard navigation
- Legal compliance questions arise

## 📈 Success Metrics

- WCAG 2.1 Level AA compliance rate: 100%
- Lighthouse Accessibility score average > 95
- Zero critical accessibility violations
- Keyboard navigation success rate: 100%
- Screen reader compatibility: 100%

## 🔄 Monitoring & Reporting

**Daily Checks:**

- Automated axe-core testing in CI/CD
- Color contrast validation
- Form accessibility verification

**Weekly Reports:**

- Accessibility compliance summary per tenant
- New violation alerts
- Fix implementation status

**Monthly Analysis:**

- Comprehensive accessibility audit
- User feedback from assistive technology users
- Compliance trend analysis

## 📁 Output Artifacts

**Reports Generated:**

- `agents/outputs/a11y/audit-{date}.json`
- `agents/outputs/a11y/axe-results-{tenant}-{date}.json`
- `agents/outputs/a11y/lighthouse-a11y-{tenant}-{date}.json`
- `agents/outputs/a11y/fixes-applied-{date}.md`

**Fix Documentation:**

- Before/after accessibility improvements
- WCAG guideline compliance mapping
- User testing results
- Implementation guidelines for developers
