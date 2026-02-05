# Zo-System Corrections Plan

## Overview

This plan outlines the corrections needed for the zo-system tenant in the sass-store application, focusing on UI fixes, visual enhancements, and navigation improvements.

---

## Task 1: Fix Password Input Text Color

**Issue:** The password input text color doesn't match the email input color on the login page.

**Location:** [`apps/web/components/ui/forms/PasswordInput.tsx`](apps/web/components/ui/forms/PasswordInput.tsx)

**Analysis:**

- The [`FormInput`](apps/web/components/ui/forms/FormInput.tsx:11) component has `text-gray-900` class applied to the input (inherited from browser default)
- The [`PasswordInput`](apps/web/components/ui/forms/PasswordInput.tsx:12) component has the same base classes but may have conflicting styles
- Both inputs use `bg-white` for background when not disabled

**Solution:**
Add explicit text color class to the password input to ensure consistency with the email input.

**Changes Required:**

- Update [`PasswordInput.tsx`](apps/web/components/ui/forms/PasswordInput.tsx:27) line 27 to include `text-gray-900` in the base input class

---

## Task 2: Implement Spotlight Effect for Zo-System Home

**Issue:** Add mouse-tracking spotlight effect that illuminates the background, similar to the zo_portfolio implementation.

**Source:** [`c:/Dev/Zo/zo_portfolio/apps/portfolio/src/components/CircuitReveal.tsx`](c:/Dev/Zo/zo_portfolio/apps/portfolio/src/components/CircuitReveal.tsx)

**Analysis:**
The spotlight effect consists of:

1. A background image (`circuits-bg-square.webp`) that is revealed only at mouse position
2. CSS mask using `radial-gradient` to create the spotlight effect
3. Mouse tracking via CSS custom properties (`--mouse-x`, `--mouse-y`)
4. `mixBlendMode: 'screen'` for proper blending
5. `opacity: 0.5` for subtle effect

**Implementation Steps:**

### 2.1 Copy Background Image

- Copy `circuits-bg-square.webp` from `c:/Dev/Zo/zo_portfolio/apps/portfolio/public/assets/`
- To `apps/web/public/assets/` (create directory if needed)

### 2.2 Create MouseSpotlight Component

- Create new file: `apps/web/components/tenant/zo-system/MouseSpotlight.tsx`
- Implement similar to [`CircuitReveal`](c:/Dev/Zo/zo_portfolio/apps/portfolio/src/components/CircuitReveal.tsx:3)
- Use `pointer-events-none`, `fixed`, `inset-0` for positioning
- Apply `z-[1]` to be above background but below content
- Use `maskImage` with radial gradient for spotlight effect
- Add `hidden md:block` to only show on desktop

### 2.3 Add Mouse Tracking

- Update [`ZoLandingPage.tsx`](apps/web/components/tenant/zo-system/ZoLandingPage.tsx:14) to add mouse tracking effect
- Add `useEffect` hook to track mouse movement
- Set CSS custom properties `--mouse-x` and `--mouse-y` on document element
- Include the `MouseSpotlight` component in the render

**Visual Effect:**

```css
maskImage: radial-gradient(circle 250px at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)
mixBlendMode: screen
opacity: 0.5
```

---

## Task 3: Update Portfolio Button to Open New Tab

**Issue:** The Portfolio button should open `https://zo-portfolio.pages.dev/` in a new tab.

**Location:** [`apps/web/components/tenant/zo-system/ZoNavbar.tsx`](apps/web/components/tenant/zo-system/ZoNavbar.tsx:9)

**Current Implementation:**

- Line 24: `{ name: "Portafolio", href: "/t/zo-system/projects" }`
- This opens an internal page

**Solution:**
Update the navLinks array to use an external URL with `target="_blank"` and `rel="noopener noreferrer"`.

**Changes Required:**

- Change href from `/t/zo-system/projects` to `https://zo-portfolio.pages.dev/`
- Add `target="_blank"` attribute to the Link component
- Add `rel="noopener noreferrer"` for security
- Update both desktop (line 83-94) and mobile (line 168-177) navigation links

---

## Task 4: Redesign Admin Page to Match Home Style

**Issue:** The admin page (`/t/zo-system/admin`) should have the same visual style as the home page.

**Current State:**

- Admin page uses standard light theme with gray background
- Home page uses dark theme (`bg-[#0D0D0D]`) with orange accent (`#FF8000`)

**Location:** [`apps/web/app/t/[tenant]/admin/page.tsx`](apps/web/app/t/[tenant]/admin/page.tsx:12)

**Analysis:**
The admin page currently:

- Uses `bg-gray-50` for background (line 38)
- Has `isLuxury` check for wondernails but not for zo-system
- Uses standard white cards with shadows
- No dark mode support for zo-system

**Solution:**
Add zo-system specific styling to match the home page aesthetic.

**Changes Required:**

### 4.1 Add zo-system Detection

- Add `isZoSystem` check: `const isZoSystem = resolvedParams.tenant === 'zo-system'`

### 4.2 Update Background

- Change background from `bg-gray-50` to `bg-[#0D0D0D]` for zo-system
- Update text color to `text-white` for zo-system

### 4.3 Update Card Styles

- Replace `bg-white shadow-md` with `bg-[#1a1a1a]/60 border border-[#FF8000]/20 backdrop-blur-md` for zo-system
- Update text colors within cards to white/gray-400

### 4.4 Update Button Styles

- Replace `bg-indigo-600` with `bg-[#FF8000]` for primary buttons
- Update hover states to use `bg-[#FF6600]`
- Add glow effect: `shadow-[0_0_15px_rgba(255,128,0,0.4)]`

### 4.5 Update Typography

- Use `text-[#FF8000]` for headings instead of `text-gray-900`
- Use `text-gray-400` for secondary text instead of `text-gray-600`
- Consider using `font-[family-name:var(--font-rajdhani)]` for tech feel

**Visual Style Reference:**

- Background: `#0D0D0D` (dark)
- Accent: `#FF8000` (orange)
- Cards: `#1a1a1a` with `#FF8000/20` border
- Text: White primary, `#FF8000` for highlights

---

## Task 5: Verify Logo Redirect

**Issue:** Ensure the logo in the navbar correctly redirects to the home page.

**Location:** [`apps/web/components/tenant/zo-system/ZoNavbar.tsx`](apps/web/components/tenant/zo-system/ZoNavbar.tsx:44)

**Current Implementation:**

- Line 45: `<Link href="/t/zo-system" className="group relative flex items-center gap-3">`
- This already points to the correct home page

**Verification:**

- The logo link is correctly set to `/t/zo-system`
- No changes needed

**Status:** ✅ Already correct

---

## Implementation Order

1. **Fix Password Input Text Color** (Quick fix, low risk)
2. **Copy Background Image** (Asset preparation)
3. **Create MouseSpotlight Component** (New component)
4. **Add Mouse Tracking to ZoLandingPage** (Integration)
5. **Update Portfolio Button** (Navigation fix)
6. **Redesign Admin Page** (Visual overhaul)
7. **Verify All Changes** (Testing)

---

## Testing Checklist

- [ ] Password input text matches email input color
- [ ] Spotlight effect appears on zo-system home page (desktop only)
- [ ] Spotlight follows mouse movement smoothly
- [ ] Portfolio button opens new tab with correct URL
- [ ] Admin page has dark theme matching home page
- [ ] All buttons in admin page have correct styling
- [ ] Logo redirects to home page
- [ ] Mobile navigation still works correctly
- [ ] No console errors on any page

---

## Technical Notes

### Mouse Tracking Performance

- Use `requestAnimationFrame` for smooth mouse tracking if needed
- Consider debouncing if performance issues arise
- The effect is disabled on mobile (`hidden md:block`)

### CSS Mask Browser Support

- CSS masks are well-supported in modern browsers
- Fallback: can use `opacity` gradient if mask support is needed for older browsers

### Admin Page Styling

- The `isZoSystem` check should be added alongside existing `isLuxury` check
- Consider creating a shared theme object for zo-system to avoid repetition

---

## Dependencies

- No new npm packages required
- Uses existing CSS utilities (Tailwind)
- Uses existing React hooks (useEffect)
- Uses existing Framer Motion (already in project)

---

## Risk Assessment

| Task                       | Risk Level | Notes                                   |
| -------------------------- | ---------- | --------------------------------------- |
| Password Input Color       | Low        | Simple CSS change                       |
| Copy Image                 | Low        | File operation only                     |
| MouseSpotlight Component   | Low        | New component, isolated                 |
| Mouse Tracking Integration | Low        | Client-side effect                      |
| Portfolio Button           | Low        | Simple link update                      |
| Admin Page Redesign        | Medium     | Multiple style changes, test thoroughly |
| Logo Redirect              | None       | Already correct                         |

---

## Estimated Complexity

- **Total Tasks:** 6 (excluding verification)
- **Complexity:** Medium
- **Estimated Files to Modify:** 5-6
- **New Files:** 2 (MouseSpotlight component + image asset)
