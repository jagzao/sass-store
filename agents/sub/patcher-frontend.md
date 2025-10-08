# 🎨 Frontend Patcher Subagent

**Role:** Frontend/UI code patching and repair
**Type:** Sub-agent (called by prime-autofix)
**Scope:** UI components, styling, client-side logic

## 🎯 Purpose

Fixes frontend-related issues in the SaaS Store monorepo:

- React component errors
- CSS/styling issues
- TypeScript type errors in frontend code
- Client-side routing problems
- State management issues
- UI/UX inconsistencies

## 📋 Input Requirements

**Bundle Manifest Fields Required:**

- `triage.category: "UI"`
- `triage.severity: "P0" | "P1" | "P2" | "P3"`
- `triage.files: string[]` - Frontend files to patch
- `triage.error_details: string` - Specific error messages
- `test_failures: TestFailure[]` - Failed frontend tests

**Expected File Types:**

- `.tsx`, `.ts` files in `apps/web/`
- `.css`, `.scss` files
- `package.json` dependencies
- Component test files

## 🔧 Patch Strategy

### 1. Component Fixes

```typescript
// Fix missing data-testid attributes
<button onClick={handleClick}>
  Book Now
</button>
↓
<button data-testid="book-now" onClick={handleClick}>
  Book Now
</button>
```

### 2. TypeScript Fixes

```typescript
// Fix type errors
const [state, setState] = useState();
↓
const [state, setState] = useState<BookingState | null>(null);
```

### 3. Import Path Fixes

```typescript
// Convert to alias imports
import { Button } from '../../../components/ui/Button';
↓
import { Button } from '@/components/ui/Button';
```

### 4. CSS/Styling Fixes

```css
/* Fix responsive issues */
.booking-button {
  width: 100%;
}
↓ .booking-button {
  width: 100%;
  max-width: 280px;
}
```

## ⚡ Execution Flow

1. **Analysis Phase**
   - Read triage report for UI-specific issues
   - Identify affected components and files
   - Check test failures for frontend patterns

2. **Patch Generation**
   - Apply minimal fixes to resolve errors
   - Maintain existing UI/UX patterns
   - Ensure accessibility standards
   - Preserve responsive behavior

3. **Validation**
   - Run frontend tests: `npm run test:frontend`
   - Check TypeScript compilation: `npm run typecheck`
   - Validate component rendering
   - Test cross-tenant compatibility

4. **Quality Gates**
   - ✅ All TypeScript errors resolved
   - ✅ Components render without errors
   - ✅ Tests pass for affected routes
   - ✅ No breaking changes to public APIs
   - ✅ Accessibility attributes maintained
   - ✅ Click budgets respected (≤2 clicks booking, ≤3 purchase)

## 🎨 Multitenant Considerations

**Tenant-Specific UI:**

- Respect tenant branding in `apps/web/lib/tenants/`
- Maintain consistent UX across all tenants
- Test fixes across: wondernails, vigistudio, villafuerte

**Component Variants:**

- Use conditional rendering for tenant features
- Maintain fallback behavior for zo-system
- Preserve catalog vs booking mode differences

## 🚨 NEED=HUMAN Triggers

Auto-escalate when:

- Changes require UX/design decisions
- Breaking changes to component APIs
- Cross-component dependency issues
- Performance regression detected
- Accessibility violations introduced

## 📊 Success Metrics

- Frontend test pass rate > 95%
- TypeScript compilation success
- Component render success rate
- Zero accessibility regressions
- Click budget compliance maintained

## 🔄 Rollback Strategy

If patches introduce regressions:

1. Revert specific changes via git
2. Run regression tests
3. Create NEED=HUMAN alert for manual review
4. Update bundle status to `requires_human_review`

## 📁 Common File Patterns

**Target Files:**

- `apps/web/components/**/*.tsx`
- `apps/web/app/**/*.tsx` (Next.js app directory)
- `apps/web/lib/**/*.ts` (utilities and hooks)
- `apps/web/styles/**/*.css`

**Preserve:**

- Existing component architecture
- Tenant-specific styling
- Performance optimizations
- SEO/meta tag structures
