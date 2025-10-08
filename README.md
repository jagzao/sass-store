# Sass Store - Multitenant Beauty SaaS Platform

[![CI/CD](https://github.com/sass-store/sass-store/actions/workflows/ci.yml/badge.svg)](https://github.com/sass-store/sass-store/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A multitenant SaaS platform for beauty salons with 10/10 UX optimized for minimal clicks and maximum conversion. Built with Next.js App Router, PostgreSQL with RLS, and cost-optimized for ≤$5/month operations.

## 🎯 Key Features

### UX 10/10 - Minimal Click Design

- **Purchase Flow**: ≤3 clicks (PLP → Mini-cart → Checkout)
- **Booking Flow**: ≤2 clicks (Service → First Available Slot)
- **Reorder Flow**: ≤1 click (History → Cart)
- **Quick Actions Dock**: Role-aware floating toolbar
- **Command Palette**: Global search with Cmd+K

### Multitenant Architecture

- **Tenant Resolution**: Header → Subdomain → Path → Default fallback
- **Row-Level Security**: Complete data isolation via PostgreSQL RLS
- **Fallback System**: Unknown hosts → zo-system tenant
- **Per-tenant Branding**: Colors, logos, contact info

### Cost Optimization (≤$5/month)

- **Infrastructure**: Cloudflare Pages + Cloud Run + Neon + Upstash
- **Auto-scaling**: Scale-to-zero with budget guardrails
- **Cost Monitoring**: Daily Cloudflare Worker with threshold alerts
- **Budget Modes**: Eco (50%) → Freeze (90%) → Kill Switch (100%)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+

### Development Setup

```bash
# Clone repository
git clone https://github.com/sass-store/sass-store.git
cd sass-store

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

Visit:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Tenant Examples**:
  - http://localhost:3000/t/wondernails (Nail salon)
  - http://localhost:3000/t/vigistudio (Hair salon)
  - http://localhost:3000/t/vainilla-vargas (Beauty products)

## 📁 Project Structure

```
sass-store/
├── apps/
│   ├── web/                 # Next.js frontend (App Router + RSC)
│   └── api/                 # Backend API (Next.js API routes)
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── database/            # Database schema & connection
│   └── config/              # Shared configuration
├── docs/                    # Documentation (PRD, Architecture, Testing)
├── design/                  # Wireframes & design system
├── agents/outputs/          # AI-generated implementation plans
├── tests/                   # E2E and integration tests
└── scripts/                 # Deployment & monitoring scripts
```

## 🧪 Testing

### Unit & Integration Tests

```bash
npm run test:unit
npm run test:integration
```

### E2E Tests with Click Budget Verification

```bash
npm run test:e2e
```

### Performance & Accessibility

```bash
# Lighthouse CI
npm run test:lighthouse

# Accessibility compliance (WCAG 2.1 AA)
npm run test:a11y
```

## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB
    %% Client Layer
    Client[Client Browser]

    %% CDN & Edge
    CF[Cloudflare CDN/Pages]

    %% Frontend Layer
    Web[Next.js App Router<br/>Port 3000/3001]

    %% API Layer
    API[Backend API<br/>Next.js Routes]

    %% AI Swarm System
    Swarm[AI Swarm System]
    Architect[Architect Agent]
    Developer[Developer Agent]
    QA[QA Agent]
    Quality[Code Quality Agent]
    Security[Security Agent]
    Tester[Tester Agent]

    %% Data Layer
    DB[(PostgreSQL + RLS<br/>Neon)]
    Redis[(Redis Cache<br/>Upstash)]
    R2[Media Storage<br/>Cloudflare R2]

    %% Monitoring & Cost
    Monitor[Cost Monitor Worker]
    Alerts[Slack/Email Alerts]

    %% Client Flow
    Client -->|HTTPS| CF
    CF -->|Static Assets| Client
    CF -->|Dynamic Requests| Web

    %% Web to API
    Web -->|GraphQL/REST| API
    Web -->|Tenant Resolution| API

    %% API to Data
    API -->|Queries with RLS| DB
    API -->|Rate Limiting| Redis
    API -->|Media Upload| R2

    %% Swarm Flow
    Swarm --> Architect
    Architect --> Developer
    Developer --> QA
    QA --> Quality
    Quality --> Security
    Security --> Tester

    %% Swarm Interactions
    Developer -.->|Code Changes| Web
    Developer -.->|API Updates| API
    QA -.->|Test Execution| Web
    Quality -.->|Linting & Fixes| Web
    Security -.->|Vulnerability Scan| API

    %% Monitoring
    Monitor -->|Check Costs| CF
    Monitor -->|Check Costs| DB
    Monitor -->|Check Costs| R2
    Monitor -->|Alert at 50%/80%/90%| Alerts

    %% Styling
    classDef frontend fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    classDef backend fill:#68a063,stroke:#333,stroke-width:2px,color:#fff
    classDef data fill:#336791,stroke:#333,stroke-width:2px,color:#fff
    classDef ai fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    classDef monitoring fill:#ffd93d,stroke:#333,stroke-width:2px,color:#000

    class Web,CF frontend
    class API backend
    class DB,Redis,R2 data
    class Swarm,Architect,Developer,QA,Quality,Security,Tester ai
    class Monitor,Alerts monitoring
```

### Architecture Layers

#### 1. **Frontend Layer** (Next.js App Router)

- **RSC**: Server Components for data-heavy pages
- **Client Components**: Interactive features (cart, command palette)
- **Streaming**: Suspense boundaries with progressive loading
- **Tenant Context**: SSR-compatible tenant resolution

#### 2. **Backend Layer** (Clean Architecture + CQRS)

- **Commands & Queries**: MediatR pattern with handlers
- **Domain Errors**: Result<T> pattern (no control-flow exceptions)
- **Rate Limiting**: Per-tenant Redis-based enforcement
- **Audit Trail**: All tenant operations logged

#### 3. **Data Layer** (PostgreSQL + RLS)

```sql
-- Example RLS policy
CREATE POLICY tenant_isolation ON products
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 4. **Media Pipeline** (Cloudflare R2)

- **Pre-processing**: EXIF removal, format conversion, variant generation
- **Formats**: AVIF → WebP → JPEG fallback chain
- **Variants**: thumb (150x150), card (400x300), hd (1200x900)
- **Deduplication**: Content hash-based across tenants

#### 5. **AI Swarm System**

Automated development workflow with specialized agents:

```mermaid
sequenceDiagram
    participant User
    participant Swarm
    participant PM
    participant Architect
    participant Developer
    participant QA
    participant Quality
    participant Security
    participant Tester

    User->>Swarm: Start Feature: "User Authentication"
    Swarm->>PM: Feature Request
    PM->>PM: Generate User Stories & PRD
    PM->>Architect: Requirements & PRD
    Architect->>Architect: Analyze & Plan Architecture
    Architect->>Developer: Architecture Plan
    Developer->>Developer: Implement Feature
    Developer->>QA: Code + Files
    QA->>QA: Create/Update Tests
    QA->>Quality: Test Results
    Quality->>Quality: Validate Code Standards
    Quality->>Security: Quality Report
    Security->>Security: Security Scan (OWASP Top 10)
    Security->>Tester: Security Report
    Tester->>Tester: Final Validation
    Tester->>Swarm: Complete ✅
    Swarm->>User: Feature Ready + PRD
```

**Agent Responsibilities:**

- **PM Agent**: Generates user stories, requirements, PRD, estimates effort
- **Architect**: Plans feature architecture based on PRD
- **Developer**: Implements the actual code
- **QA Agent**: Creates tests, runs test suites, validates coverage
- **Code Quality Agent**: Enforces standards, auto-fixes issues, validates complexity
- **Security Agent**: OWASP Top 10 scans, RLS validation, dependency audits
- **Tester**: Final integration testing and approval

**Usage:**

```bash
npm run swarm:start "Feature name or description"
# Example: npm run swarm:start "Shopping cart with persistent state"
```

The PM Agent analyzes the feature request and generates:

- User stories with acceptance criteria
- Functional, non-functional, and technical requirements
- Business validation and risk assessment
- Effort estimate (story points and hours)
- Complete PRD saved in `docs/prd/`

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/sassstore

# Authentication
JWT_SECRET=your-secret-key

# Redis (Rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Media CDN
MEDIA_CDN_URL=https://media.sassstore.com

# Cost monitoring
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook
MONTHLY_BUDGET=5.00
```

### Feature Flags

```typescript
{
  eco_mode: boolean,           // Reduce image quality, aggressive caching
  freeze_mode: boolean,        // Read-only mode, essential operations only
  kill_switch: boolean,        // Maintenance mode, core services only
  image_optimize: boolean,     // Enable/disable image processing
  image_variants: boolean,     // Generate multiple image sizes
}
```

## 📊 Monitoring & Costs

### Cost Breakdown (Target: <$5/month)

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

## 🔐 Security

### Tenant Isolation

- **Database**: Row-Level Security (RLS) policies
- **API**: Tenant context validation on every request
- **Media**: Tenant-scoped storage paths
- **Rate Limiting**: Per-tenant quotas and enforcement

### Authentication & Authorization

- **JWT**: Stateless authentication with tenant claims
- **API Keys**: Service-to-service authentication
- **RBAC**: Role-based access control (Customer, Staff, Admin, Owner)

## 📱 Supported Tenants

| Tenant              | Mode    | Focus                      | URL                |
| ------------------- | ------- | -------------------------- | ------------------ |
| **zo-system**       | catalog | Default fallback           | /t/zo-system       |
| **wondernails**     | booking | Nail art & manicures       | /t/wondernails     |
| **vigistudio**      | booking | Hair salon & treatments    | /t/vigistudio      |
| **villafuerte**     | booking | Luxury spa & wellness      | /t/villafuerte     |
| **vainilla-vargas** | catalog | Natural cosmetics          | /t/vainilla-vargas |
| **delirios**        | booking | Creative makeup & nail art | /t/delirios        |
| **nom-nom**         | catalog | DIY beauty products        | /t/nom-nom         |

## 🚀 Deployment

### Staging

```bash
git push origin develop
# Auto-deploys to staging environment
```

### Production

```bash
git push origin main
# Auto-deploys to production with smoke tests
```

### Manual Deployment

```bash
# Deploy frontend to Cloudflare Pages
npm run deploy:web

# Deploy API to Cloud Run
npm run deploy:api

# Deploy cost monitoring worker
npm run deploy:worker
```

## 🧩 API Reference

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the click budget requirements (Purchase ≤3, Booking ≤2, Reorder ≤1)
- Maintain WCAG 2.1 AA accessibility compliance
- Keep bundle size under 250KB gzipped
- Ensure all tests pass, including RLS security tests
- Document any new tenant configuration requirements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [/docs](./docs)
- **API Docs**: [OpenAPI Specification](./docs/api.yml)
- **Design System**: [/design](./design)
- **Architecture**: [/docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Testing Strategy**: [/docs/TESTING.md](./docs/TESTING.md)

---

Built with ❤️ for the beauty industry. Optimized for conversion, designed for scale, priced for accessibility.
