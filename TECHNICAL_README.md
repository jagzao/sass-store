# Sass Store - Technical Documentation

This document contains the technical details for developers working on the Sass Store platform. For a general overview and launch campaign information, please see `README.md`.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- `psql` CLI (or any PostgreSQL client)

### Development Setup

```bash
# Clone repository
git clone https://github.com/sass-store/sass-store.git
cd sass-store

# Install dependencies
npm install

# Start development environment (database)
docker-compose up -d

# Run database migrations
npm run db:push

# Seed with tenant data (replace with your actual connection string)
psql $DATABASE_URL -f seed-initial-data.sql

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
│   ├── config/              # Shared configuration (env, feature flags)
│   ├── core/                # Core business logic and domain types
│   ├── cache/               # Caching utilities (Redis)
│   └── validation/          # Zod schemas for validation
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

## 🔐 Security

### Tenant Isolation

- **Database**: Row-Level Security (RLS) policies
- **API**: Tenant context validation on every request
- **Media**: Tenant-scoped storage paths
- **Rate Limiting**: Per-tenant quotas and enforcement

### Authentication & Authorization

- **JWT**: Stateless authentication with tenant claims
- **API Keys**: Service-to-service authentication with validateApiKey function
- **RBAC**: Role-based access control (Customer, Staff, Admin, Owner)

#### API Key Authentication

Example usage:
```typescript
import { validateApiKey } from "@sass-store/config";

// In your API route
export async function POST(request: NextRequest) {
  const authResult = await validateApiKey(request);
  
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }
  
  // Process request for authenticated tenant
  const { tenant } = authResult;
  // ... your logic here
}
```

## 🚀 Deployment

Deployment is automated via GitHub Actions.

### Staging

```bash
git push origin develop
# Automatically deploys the 'develop' branch to the staging environment.
```

### Production

```bash
git push origin main
# Automatically deploys the 'main' branch to production after all checks pass.
```

## 🧩 API Reference

### Authentication

API endpoints require authentication using API keys. Include the following headers in your requests:

- `X-Tenant`: The tenant slug (e.g., `wondernails`)
- `X-API-Key`: The tenant-specific API key

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
Body: { file, metadata }
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
