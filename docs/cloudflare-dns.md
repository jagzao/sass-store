# Custom Domain Configuration

## DNS Setup for SaaS Store

### Main Domain Setup

For the main domain `sassstore.com`:

1. **Root Domain (A Record)**
   - Type: A
   - Name: @
   - Value: 192.0.2.1 (Cloudflare's placeholder IP)
   - TTL: Auto

2. **WWW Subdomain (CNAME)**
   - Type: CNAME
   - Name: www
   - Value: @
   - TTL: Auto

### Tenant Subdomains

For tenant-specific subdomains (e.g., `wondernails.sassstore.com`):

1. **Wildcard CNAME Record**
   - Type: CNAME
   - Name: \*
   - Value: sass-store-production.pages.dev
   - TTL: Auto

### Custom Tenant Domains

For tenants with their own domains:

1. **CNAME Record (for tenant domain)**
   - Type: CNAME
   - Name: @
   - Value: sass-store-production.pages.dev
   - TTL: Auto

2. **WWW CNAME Record (for tenant domain)**
   - Type: CNAME
   - Name: www
   - Value: sass-store-production.pages.dev
   - TTL: Auto

## SSL/TLS Configuration

1. **SSL/TLS Encryption Mode**: Full (strict)
2. **Always Use HTTPS**: On
3. **HTTP Strict Transport Security (HSTS)**: Enabled
4. **Minimum TLS Version**: 1.2
5. **TLS 1.3**: Enabled

## Page Rules

1. **Force HTTPS**
   - If the URL matches: `*sassstore.com/*`
   - Then the settings are: Always Use HTTPS

2. **WWW Redirect**
   - If the URL matches: `www.sassstore.com/*`
   - Then the settings are: Forwarding URL (Status Code: 301, URL: https://sassstore.com/$1)

## Cloudflare Pages Custom Domains

### Production Domain

- Domain: `sassstore.com`
- Custom domain in Cloudflare Pages project: `sass-store-production`

### Tenant Custom Domains

Each tenant can have their own custom domain configured in Cloudflare Pages:

- Example: `wondernails.com` → points to `sass-store-production.pages.dev`
- Custom domain validation required for each tenant domain

## Environment Variables for Domain Resolution

```env
# Production
NEXT_PUBLIC_DOMAIN=sassstore.com
NEXT_PUBLIC_TENANT_DOMAIN_PATTERN=*.sassstore.com

# Development
NEXT_PUBLIC_DOMAIN=localhost:3001
NEXT_PUBLIC_TENANT_DOMAIN_PATTERN=*.localhost:3001
```

## Domain Verification Steps

1. **Add Custom Domain in Cloudflare Pages**
   - Go to Cloudflare Pages > sass-store-production
   - Add custom domain: `sassstore.com`
   - Add custom domain: `www.sassstore.com`

2. **DNS Propagation Check**

   ```bash
   nslookup sassstore.com
   nslookup www.sassstore.com
   nslookup wondernails.sassstore.com
   ```

3. **SSL Certificate Verification**
   ```bash
   curl -I https://sassstore.com
   curl -I https://www.sassstore.com
   curl -I https://wondernails.sassstore.com
   ```

## Tenant-Specific Domain Configuration

For tenants wanting their own custom domains:

1. **Tenant provides their domain** (e.g., `wondernails.com`)
2. **Add CNAME record** pointing to `sass-store-production.pages.dev`
3. **Add custom domain** in Cloudflare Pages project
4. **Update tenant configuration** in database:
   ```sql
   UPDATE tenants
   SET custom_domain = 'wondernails.com'
   WHERE slug = 'wondernails';
   ```

## Testing Custom Domains

1. **Local Testing with hosts file** (for development):

   ```
   127.0.0.1 sassstore.local
   127.0.0.1 wondernails.sassstore.local
   127.0.0.1 vigistudio.sassstore.local
   ```

2. **Production Testing**:
   ```bash
   curl -H "Host: sassstore.com" https://sass-store-production.pages.dev
   curl -H "Host: wondernails.sassstore.com" https://sass-store-production.pages.dev
   ```
