# SaaS Store MCP Security & Development Policies

## Write Path Policies

### UI Changes

- **Allowed**: `apps/web/components/**`, `design/tokens.json`, `agents/outputs/**`
- **Restricted**: No direct modifications to `node_modules`, `dist`, `.next`
- **Validation**: All UI changes must pass through whitelist validation

### Database Operations

- **Allowed**: `db/migrations/**`, `db/seeds/**`
- **Restricted**: Direct table modifications in production
- **Template Required**: Use `--template=seed|feature` for all migrations

### Documentation Extraction

- **Allowed**: `agents/outputs/extracted-docs/**`
- **Formats**: HTML, PDF, MD only
- **Source Tracking**: All extractions must include source URL, date, and hash

## Database Security Policies

### Migration Safety

- **Prohibited**: `DROP TABLE`, `ALTER ... DROP COLUMN` unless `--allow-destructive`
- **Required**: Pre-flight testing on `PG_SHADOW_URL` before production
- **Validation**: Compare migration plans between shadow and production
- **RLS Enforcement**: All multi-tenant tables MUST have Row Level Security enabled

### Query Restrictions

- **Sandbox Mode**: Only approved playbooks from YAML or explicit sandbox mode
- **Tenant Isolation**: All queries MUST include tenant_id WHERE clause
- **Read-Only**: query command cannot execute write operations
- **Audit Trail**: All query executions logged with tenant context

## Secrets Management

### Environment Variables

- **Storage**: All secrets in `vault/.env` (gitignored)
- **Access**: Tenant-scoped secret access only
- **Logging**: NEVER print secrets in logs or console output
- **Rotation**: Regular key rotation for production environments

### API Keys by Provider

- **Stripe**: `vault/.env` with tenant prefix
- **MercadoPago**: `vault/.env` with tenant prefix
- **Google Calendar**: `vault/google-tokens/{tenant}/{profId}.json`
- **Database**: Connection strings in protected environment only

## Multi-Tenant Isolation Policies

### Tenant Scoping

- **Database**: Every query MUST filter by `tenant_id`
- **API Routes**: All endpoints MUST validate `x-tenant` header
- **File Storage**: All uploads scoped to `{tenant_id}/{resource_type}/`
- **Cache Keys**: Include tenant_id in all cache keys
- **Search Indexes**: Tenant-specific search scopes only

### Development Safety

- **Test Mode**: All payment operations default to test/sandbox
- **Dry Run**: All destructive operations default to `--dry-run`
- **Localhost**: Query parameters for tenant selection in development
- **Logging**: Redacted logs for sensitive operations

## MCP Tool Restrictions

### Write Operations

- **Confirmation Required**: All write operations require explicit `--write` flag
- **Preview Mode**: Show diffs before execution
- **Rollback**: Generate reversible operations where possible
- **Backup**: Auto-backup before destructive operations

### Rate Limiting

- **API Calls**: Respect provider rate limits (Google Calendar: 100/min)
- **Database**: Connection pooling with tenant-aware limits
- **Search**: Query frequency limits per tenant
- **Email**: Send rate limits per tenant

### Error Handling

- **Graceful Degradation**: Fallback to safe defaults on errors
- **User Notification**: Clear error messages without exposing internals
- **Audit Trail**: Log all errors with context for debugging
- **Recovery**: Automatic recovery mechanisms where possible

## Production Deployment Policies

### Pre-Deployment Validation

- **Migration Testing**: All DB changes tested on shadow database
- **Integration Tests**: Full test suite passing
- **Security Scan**: No exposed secrets or vulnerabilities
- **Performance**: Response time validation for tenant-heavy operations

### Live Environment Protection

- **Confirmation Required**: `--confirm-live` for production operations
- **Backup Strategy**: Automated backups before changes
- **Monitoring**: Real-time monitoring of tenant isolation
- **Rollback Plan**: Quick rollback procedures for each operation type

## Compliance & Auditing

### Data Protection

- **Tenant Isolation**: Zero cross-tenant data leakage
- **Encryption**: Data at rest and in transit
- **Access Logs**: Complete audit trail of data access
- **Retention**: Tenant-specific data retention policies

### Development Workflow

- **Code Review**: All database and security changes require review
- **Testing**: Multi-tenant test scenarios required
- **Documentation**: All policy changes must be documented
- **Training**: Team training on multi-tenant security practices

## Violation Response

### Automatic Actions

- **Policy Violation**: Immediate operation termination
- **Security Alert**: Automated alerts for security violations
- **Audit Log**: All violations logged with full context
- **Lockdown**: Temporary access restriction for repeated violations

### Manual Review Required

- **Data Breach**: Immediate manual investigation
- **Cross-Tenant Access**: Manual review of tenant isolation
- **Privilege Escalation**: Review of access patterns
- **Suspicious Activity**: Manual analysis of unusual operations

---

**Last Updated**: 2024-01-22
**Policy Version**: 1.0
**Review Cycle**: Monthly
**Owner**: Security Team
