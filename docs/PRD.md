# Product Requirements Document - Sass Store Multitenant Platform

## Overview

Multitenant SaaS platform for beauty salons, nail studios, and service businesses with 10/10 UX optimized for minimal clicks and maximum conversion.

## Personas & User Journeys

### Customer (End Consumer)

**Primary Goals**: Quick booking, easy purchasing, minimal friction

- **Journey**: Discovery → Selection → Purchase/Booking → Fulfillment
- **Pain Points**: Too many clicks, slow loading, confusing navigation
- **Success Metrics**: Conversion rate, task completion time, satisfaction

### Staff (Service Providers)

**Primary Goals**: Manage appointments, update availability, process orders

- **Journey**: Login → Check schedule → Update slots → Process payments
- **Pain Points**: Complex interfaces, mobile unfriendly, slow updates
- **Success Metrics**: Task efficiency, error rates, adoption

### Admin (Salon Manager)

**Primary Goals**: Manage catalog, oversee operations, analyze performance

- **Journey**: Dashboard → Content management → Analytics → Optimization
- **Pain Points**: Data scattered, reporting delays, bulk operations
- **Success Metrics**: Time to insights, operational efficiency

### Owner (Multi-location)

**Primary Goals**: Multi-tenant oversight, cost control, scaling

- **Journey**: Portfolio view → Performance analysis → Strategic decisions
- **Pain Points**: Inconsistent data, cost overruns, manual processes
- **Success Metrics**: ROI, scalability, cost efficiency

## Click Budget Constraints

### Purchase Flow (≤3 clicks)

1. **Product Selection** (1 click from PLP "Add" button)
2. **Cart Review** (mini-cart overlay, 1 click to proceed)
3. **Checkout Completion** (1 click with saved payment)

### Booking Flow (≤2 clicks)

1. **Service Selection + "First Available Slot"** (1 click from service card)
2. **Confirmation** (1 click to book with saved customer data)

### Reorder Flow (≤1 click)

1. **One-Click Reorder** (from order history or favorites)

## UX 10/10 Requirements

### Quick Actions Dock (Role-Aware)

- **Customer**: Book Now, Reorder, Favorites, Help
- **Staff**: Check In, Update Schedule, New Booking, Process Payment
- **Admin**: Add Product, View Analytics, Manage Staff, Export Data
- **Owner**: Cost Dashboard, Tenant Overview, Performance Reports

### Command Palette (Cmd+K)

- Global search across products, services, bookings, customers
- Quick actions: "book with Maria", "add lipstick", "export sales"
- Fuzzy matching with keyboard navigation
- Recent actions and shortcuts

### Product List Page (PLP)

- **1-Click Add**: Direct add-to-cart from grid view
- **Mini-cart**: Sticky overlay with quick checkout
- **Instant filters**: No page reload, URL-synced
- **Visual feedback**: Loading states, success animations

### Booking System

- **First Available Slot**: Prominent button showing next opening
- **Smart suggestions**: Based on history and preferences
- **Conflict prevention**: Real-time availability checks
- **Mobile-first**: Touch-optimized time selection

### Performance Targets

- **LCP**: <2.5s (P75)
- **INP**: <200ms (P75)
- **First Input Delay**: <100ms
- **Cumulative Layout Shift**: <0.1

## Multitenant Fallback Strategy

### Tenant Resolution Priority

1. **X-Tenant Header** (API calls)
2. **Subdomain** (salon.sassstore.com)
3. **Path Parameter** (/t/salon-name)
4. **Cookie** (development only)
5. **Default Fallback** (zo-system)

### Fallback Tenant (zo-system)

- **Purpose**: Default landing for unmapped hosts
- **Content**: Generic salon template, demo products
- **Branding**: Neutral colors, placeholder content
- **SEO**: Canonical tags, noindex for staging/dev
- **Banner**: "Demo Mode" (dev/staging only)

### Contact & Maps Integration

- **Per-tenant contact info**: Phone, email, hours
- **Google Maps integration**: Embedded maps with directions
- **Location-based features**: Distance calculations, local SEO
- **Multi-location support**: For franchise owners

## Cost Guardrails

### Threshold Actions

- **50%**: Enable eco_mode (reduce image quality, cache aggressively)
- **80%**: Warning notifications, defer non-critical operations
- **90%**: freeze_mode (read-only, essential operations only)
- **100%**: kill_switch (maintenance mode, core services only)

### Cost Monitoring

- **Daily budget checks**: Automated cost sentinel
- **Per-tenant quotas**: Storage, bandwidth, API calls
- **Resource limits**: Max instances, auto-scaling bounds
- **Alert channels**: Email, Slack, dashboard notifications

## Acceptance Criteria

### Measurable Metrics

- **Click Budgets**: Verified in e2e tests
  - Purchase: ≤3 clicks (measured from PLP to confirmation)
  - Booking: ≤2 clicks (measured from service to confirmation)
  - Reorder: ≤1 click (from history to cart)

- **Performance**: Core Web Vitals compliance
  - LCP <2.5s (P75 across all pages)
  - INP <200ms (P75 for all interactions)
  - CLS <0.1 (visual stability)

- **Conversion Metrics**
  - Add-to-cart rate >15% (from PLP views)
  - Booking completion rate >80% (from service selection)
  - Reorder rate >25% (from repeat customers)

- **Accessibility**: WCAG 2.1 AA compliance
  - Lighthouse accessibility score ≥95
  - Keyboard navigation support
  - Screen reader compatibility
  - Color contrast ratios

### Functional Requirements

- **Tenant isolation**: RLS enforcement, no data leakage
- **Fallback reliability**: 99.9% uptime for zo-system
- **Mobile responsiveness**: All flows work on mobile
- **Offline resilience**: Graceful degradation
- **Error handling**: User-friendly messages, no stack traces

### Technical Requirements

- **API response times**: <500ms (P95)
- **Database queries**: <100ms (P95)
- **Image optimization**: AVIF/WebP with fallbacks
- **SEO compliance**: Meta tags, structured data, sitemaps
- **Security**: Rate limiting, input validation, audit trails
