# Sass Store - Multitenant Beauty SaaS Platform

## Project Overview

Sass Store is a multitenant SaaS platform for beauty salons with 10/10 UX optimized for minimal clicks and maximum conversion. Built with Next.js App Router, PostgreSQL with RLS (Row Level Security), and cost-optimized for ≤$5/month operations.

Key features include:
- **Purchase Flow**: ≤3 clicks (PLP → Mini-cart → Checkout)
- **Booking Flow**: ≤2 clicks (Service → First Available Slot)
- **Reorder Flow**: ≤1 click (History → Cart)
- **Tenant Isolation**: Complete data isolation via PostgreSQL RLS
- **Cost Optimized**: Infrastructure designed for ≤$5/month operations

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router + React Server Components)
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Row Level Security (Neon)
- **Cache**: Upstash Redis
- **Media Storage**: Cloudflare R2
- **Deployment**: Cloudflare Pages + Cloud Run
- **Package Manager**: npm workspaces with Turborepo
- **AI Swarm System**: Automated development workflow with specialized agents

### Project Structure
```
sass-store/
├── apps/
│   ├── web/                 # Next.js frontend (App Router + RSC)
│   └── api/                 # Backend API (Next.js API routes)
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── database/            # Database schema & connection
│   ├── config/              # Shared configuration
│   ├── core/                # Core business logic
│   ├── cache/               # Cache utilities
│   └── validation/          # Zod validation schemas
├── docs/                    # Documentation (PRD, Architecture, Testing)
├── design/                  # Wireframes & design system
├── agents/outputs/          # AI-generated implementation plans
├── tests/                   # E2E and integration tests
└── scripts/                 # Deployment & monitoring scripts
```

### AI Swarm System
The project implements an automated development workflow with specialized agents:
- **PM Agent**: Generates user stories, requirements, PRD
- **Architect**: Plans feature architecture based on PRD
- **Developer**: Implements the actual code
- **QA Agent**: Creates tests, validates coverage
- **Code Quality Agent**: Enforces standards, auto-fixes issues
- **Security Agent**: OWASP Top 10 scans, RLS validation
- **Tester**: Final integration testing and approval

## Building and Running

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+

### Development Setup
```bash
# Install dependencies
npm install

# Start development environment
docker-compose up -d

# Run database migrations
npm run db:push

# Seed with tenant data
npm run db:seed

# Start development servers
npm run dev
```

### Available Scripts
- `npm run dev` - Start development servers
- `npm run build` - Build all applications
- `npm run test` - Run all tests
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run lint` - Lint code
- `npm run typecheck` - Check TypeScript types
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database with sample data
- `npm run swarm:start "feature description"` - Start AI swarm for feature development

### Services
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Tenant Examples**:
  - http://localhost:3000/t/wondernails (Nail salon)
  - http://localhost:3000/t/vigistudio (Hair salon)
  - http://localhost:3000/t/vainilla-vargas (Beauty products)

## Testing

### Test Types
- **Unit & Integration Tests**: `npm run test:unit`
- **E2E Tests**: `npm run test:e2e` (with Click Budget Verification)
- **Performance**: `npm run test:lighthouse`
- **Accessibility**: `npm run test:a11y` (WCAG 2.1 AA compliance)

### Test Frameworks
- **Playwright** for E2E testing
- **Jest** for unit/integration testing
- **Testing Library** for component testing

## Development Conventions

### Click Budget Requirements
- Purchase Flow: ≤3 clicks
- Booking Flow: ≤2 clicks  
- Reorder Flow: ≤1 click

### Coding Standards
- TypeScript for type safety
- Zod for validation schemas
- Drizzle ORM for database operations
- Next.js App Router patterns
- React Server Components where appropriate
- WCAG 2.1 AA accessibility compliance
- Bundle size under 250KB gzipped

### Tenant Isolation
- Row-Level Security (RLS) policies in PostgreSQL
- Tenant context validation on every request
- Tenant-scoped storage paths for media
- Per-tenant rate limiting quotas

### Security Practices
- JWT-based authentication with tenant claims
- API keys for service-to-service authentication
- Role-based access control (Customer, Staff, Admin, Owner)
- OWASP Top 10 compliance with security scanning

## Environment Configuration

### Key Environment Variables
```
DATABASE_URL=postgresql://user:pass@host:5432/sassstore
JWT_SECRET=your-secret-key
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
MEDIA_CDN_URL=https://media.sassstore.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook
MONTHLY_BUDGET=5.00
```

### Feature Flags
- `eco_mode`: Reduce image quality, aggressive caching
- `freeze_mode`: Read-only mode, essential operations only
- `kill_switch`: Maintenance mode, core services only
- `image_optimize`: Enable/disable image processing
- `image_variants`: Generate multiple image sizes

## Deployment

### Staging
Automatic deployment on push to `develop` branch

### Production
Automatic deployment on push to `main` branch with smoke tests

### Manual Deployment
```bash
# Deploy frontend to Cloudflare Pages
npm run deploy:web

# Deploy API to Cloud Run
npm run deploy:api

# Deploy cost monitoring worker
npm run deploy:worker
```

## Cost Optimization

### Infrastructure (Target: <$5/month)
- **Cloudflare Pages**: $0 (free tier)
- **Cloud Run**: $0-2 (scale-to-zero, 1 instance max)
- **Neon Database**: $0-1 (autosuspend, 5GB limit)
- **Cloudflare R2**: $0-1 (10GB storage, optimized operations)
- **Upstash Redis**: $0-1 (rate limiting, caching)

### Budget Guardrails
- **50% threshold**: Eco mode (reduced quality, aggressive caching)
- **80% threshold**: Warning alerts, feature restrictions
- **90% threshold**: Freeze mode (read-only operations)
- **100% threshold**: Kill switch (maintenance mode)

## Supported Tenants
| Tenant | Mode | Focus | URL |
|--------|------|-------|-----|
| **zo-system** | catalog | Default fallback | /t/zo-system |
| **wondernails** | booking | Nail art & manicures | /t/wondernails |
| **vigistudio** | booking | Hair salon & treatments | /t/vigistudio |
| **villafuerte** | booking | Luxury spa & wellness | /t/villafuerte |
| **vainilla-vargas** | catalog | Natural cosmetics | /t/vainilla-vargas |
| **delirios** | booking | Creative makeup & nail art | /t/delirios |
| **nom-nom** | catalog | DIY beauty products | /t/nom-nom |

## API Reference

### Products API
```bash
# List products for tenant
GET /api/v1/products
Headers: X-Tenant: wondernails

# Create product
POST /api/v1/products
Headers: X-Tenant: wondernails, X-API-Key: your-key
Body: { sku, name, price, category }
```

### Bookings API
```bash
# Create booking
POST /api/v1/bookings
Headers: X-Tenant: wondernails, X-API-Key: your-key
Body: { serviceId, staffId, startTime, customerInfo }
```

### Media API
```bash
# Upload media
POST /api/v1/media/upload
Headers: X-Tenant: wondernails, X-API-Key: your-key
Body: FormData { file, metadata }
```