# 🚀 Infrastructure Patcher Subagent

**Role:** Infrastructure and deployment patching
**Type:** Sub-agent (called by prime-autofix)
**Scope:** Docker, CI/CD, build processes, deployment configs

## 🎯 Purpose

Fixes infrastructure-related issues in the SaaS Store monorepo:

- Docker build failures
- CI/CD pipeline errors
- Build and deployment issues
- Environment configuration problems
- Performance and monitoring setup

## 📋 Input Requirements

**Bundle Manifest Fields Required:**

- `triage.category: "Infra"`
- `triage.severity: "P0" | "P1" | "P2" | "P3"`
- `triage.files: string[]` - Infrastructure files to patch
- `triage.error_details: string` - Build/deployment errors
- `test_failures: TestFailure[]` - Failed build/deployment tests

**Expected File Types:**

- `Dockerfile`, `docker-compose.yml`
- `.github/workflows/*.yml`
- `package.json`, `turbo.json`
- Environment configuration files
- Deployment scripts

## 🔧 Patch Strategy

### 1. Docker Fixes

```dockerfile
# Fix missing dependencies
FROM node:18-alpine
COPY package.json .
RUN npm install
↓
FROM node:18-alpine
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --only=production
```

### 2. CI/CD Pipeline Fixes

```yaml
# Fix GitHub Actions workflow
- name: Install dependencies
  run: npm install
- name: Build
  run: npm run build
↓
- name: Install dependencies
  run: npm ci
- name: Build
  run: npm run build --if-present
- name: Test
  run: npm test
```

### 3. Build Configuration Fixes

```json
// Fix Turbo.json pipeline
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
↓
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    }
  }
}
```

### 4. Environment Configuration

```bash
# Fix missing environment variables
DATABASE_URL=postgresql://...
↓
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://domain.com
```

## ⚡ Execution Flow

1. **Analysis Phase**
   - Read triage report for infrastructure issues
   - Identify build/deployment failures
   - Check CI/CD pipeline errors

2. **Patch Generation**
   - Apply minimal fixes to build configurations
   - Update dependencies if needed
   - Fix environment variable issues
   - Resolve Docker build problems

3. **Validation**
   - Run build tests: `npm run build`
   - Test Docker builds: `docker-compose build`
   - Validate CI/CD pipeline
   - Check deployment readiness

4. **Quality Gates**
   - ✅ All builds complete successfully
   - ✅ Docker images build and run
   - ✅ CI/CD pipeline passes
   - ✅ Environment variables configured
   - ✅ Performance metrics within bounds
   - ✅ Security scans pass

## 🏗️ Build System Considerations

**Monorepo Build:**

- Respect Turbo.json dependencies
- Maintain build caching
- Optimize build times
- Handle workspace dependencies

**Multi-Environment:**

- Development configuration
- Staging deployment
- Production readiness
- Environment-specific overrides

## 🐳 Docker & Deployment

**Container Health:**

```dockerfile
# Add health checks
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

**Multi-Stage Builds:**

- Optimize image size
- Separate build and runtime
- Cache layer optimization
- Security scanning

## 🚨 NEED=HUMAN Triggers

Auto-escalate when:

- Major dependency updates required
- Infrastructure architecture changes needed
- Security vulnerabilities in base images
- Performance regression > 50%
- Breaking changes in deployment target

## 📊 Success Metrics

- Build success rate > 99%
- Docker image build time < 5 minutes
- CI/CD pipeline duration < 10 minutes
- Zero security vulnerabilities (high/critical)
- Container startup time < 30 seconds

## 🔄 Rollback Strategy

If patches introduce regressions:

1. Revert infrastructure changes
2. Restore previous Docker images
3. Rollback CI/CD configuration
4. Test build pipeline integrity
5. Validate deployment readiness

## 📁 Common File Patterns

**Target Files:**

- `Dockerfile`, `docker-compose.yml`
- `.github/workflows/**/*.yml`
- `turbo.json`, `package.json`
- `.env.example`, environment configs
- `scripts/**/*.sh` (deployment scripts)

**Critical Configurations:**

- Build and test pipelines
- Container orchestration
- Environment management
- Performance monitoring
- Security scanning

**Preserve:**

- Existing deployment patterns
- Performance optimizations
- Security configurations
- Monitoring and logging setup
