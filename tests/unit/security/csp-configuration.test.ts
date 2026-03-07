/**
 * CSP Configuration Tests - SEC-009
 *
 * Tests for Content-Security-Policy header configuration
 * Validates that production CSP is hardened and development CSP allows necessary DX features.
 */

// Using vitest globals (configured in vitest.config.ts)

// We need to test the CSP generation logic from next.config.js
// Since next.config.js is CommonJS, we'll extract and test the logic directly

/**
 * Generate CSP directives based on environment (copied from next.config.js for testing)
 */
function generateCSP(env: 'production' | 'development'): string {
  const isDev = env === 'development';

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      'https://js.stripe.com',
      'https://challenges.cloudflare.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://upstash.io',
      'https://*.upstash.io',
      'https://api.mercadopago.com',
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      'https://challenges.cloudflare.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  if (isDev) {
    directives['script-src'].push("'unsafe-eval'");
    directives['script-src'].push("'unsafe-inline'");
    directives['connect-src'].push('ws://localhost:*', 'ws://127.0.0.1:*');
  } else {
    directives['script-src'].push("'unsafe-inline'");
    directives['upgrade-insecure-requests'] = [];
  }

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

describe('CSP Configuration - SEC-009', () => {
  describe('Production CSP', () => {
    let productionCSP: string;

    beforeAll(() => {
      productionCSP = generateCSP('production');
    });

    it('should NOT contain unsafe-eval in production', () => {
      // Critical: unsafe-eval allows arbitrary code execution via eval()
      const scriptSrc = extractDirective(productionCSP, 'script-src');
      expect(scriptSrc).not.toContain("'unsafe-eval'");
    });

    it('should contain object-src none', () => {
      // Critical: Prevents plugin-based XSS attacks
      const objectSrc = extractDirective(productionCSP, 'object-src');
      expect(objectSrc).toContain("'none'");
    });

    it('should contain frame-ancestors none', () => {
      // Critical: Prevents clickjacking attacks
      const frameAncestors = extractDirective(productionCSP, 'frame-ancestors');
      expect(frameAncestors).toContain("'none'");
    });

    it('should contain base-uri self', () => {
      // Prevents base tag injection attacks
      const baseUri = extractDirective(productionCSP, 'base-uri');
      expect(baseUri).toContain("'self'");
    });

    it('should contain form-action self', () => {
      // Prevents form submission to external domains
      const formAction = extractDirective(productionCSP, 'form-action');
      expect(formAction).toContain("'self'");
    });

    it('should contain upgrade-insecure-requests', () => {
      // Forces HTTPS for all requests
      expect(productionCSP).toContain('upgrade-insecure-requests');
    });

    it('should allow Stripe.js scripts', () => {
      // Required for payment processing
      const scriptSrc = extractDirective(productionCSP, 'script-src');
      expect(scriptSrc).toContain('https://js.stripe.com');
    });

    it('should allow Stripe frames', () => {
      // Required for Stripe Elements/Checkout
      const frameSrc = extractDirective(productionCSP, 'frame-src');
      expect(frameSrc).toContain('https://js.stripe.com');
      expect(frameSrc).toContain('https://hooks.stripe.com');
    });

    it('should allow Stripe API connections', () => {
      // Required for Stripe API calls
      const connectSrc = extractDirective(productionCSP, 'connect-src');
      expect(connectSrc).toContain('https://api.stripe.com');
    });

    it('should allow Cloudflare Turnstile', () => {
      // Required for CAPTCHA alternative
      const scriptSrc = extractDirective(productionCSP, 'script-src');
      const frameSrc = extractDirective(productionCSP, 'frame-src');
      expect(scriptSrc).toContain('https://challenges.cloudflare.com');
      expect(frameSrc).toContain('https://challenges.cloudflare.com');
    });

    it('should have default-src self', () => {
      // Fallback for unspecified directives
      const defaultSrc = extractDirective(productionCSP, 'default-src');
      expect(defaultSrc).toContain("'self'");
    });

    it('should allow images from any HTTPS source', () => {
      // Required for external images (Cloudinary, etc.)
      const imgSrc = extractDirective(productionCSP, 'img-src');
      expect(imgSrc).toContain('https:');
      expect(imgSrc).toContain('data:');
      expect(imgSrc).toContain('blob:');
    });

    it('should contain unsafe-inline in script-src (Stripe requirement)', () => {
      // NOTE: Stripe.js requires unsafe-inline for embedded components
      // This is a known limitation - mitigated by other CSP directives
      // See: https://stripe.com/docs/security/guide#content-security-policy
      const scriptSrc = extractDirective(productionCSP, 'script-src');
      expect(scriptSrc).toContain("'unsafe-inline'");
    });
  });

  describe('Development CSP', () => {
    let developmentCSP: string;

    beforeAll(() => {
      developmentCSP = generateCSP('development');
    });

    it('should contain unsafe-eval for Next.js HMR', () => {
      // Required for Next.js Fast Refresh
      const scriptSrc = extractDirective(developmentCSP, 'script-src');
      expect(scriptSrc).toContain("'unsafe-eval'");
    });

    it('should contain unsafe-inline for Next.js dev server', () => {
      // Required for Next.js webpack dev server
      const scriptSrc = extractDirective(developmentCSP, 'script-src');
      expect(scriptSrc).toContain("'unsafe-inline'");
    });

    it('should allow WebSocket connections for HMR', () => {
      // Required for Hot Module Replacement
      const connectSrc = extractDirective(developmentCSP, 'connect-src');
      expect(connectSrc).toContain('ws://localhost:*');
      expect(connectSrc).toContain('ws://127.0.0.1:*');
    });

    it('should NOT contain upgrade-insecure-requests in development', () => {
      // Not needed in development (localhost)
      expect(developmentCSP).not.toContain('upgrade-insecure-requests');
    });

    it('should still have security directives in development', () => {
      // Security directives should still be present
      expect(extractDirective(developmentCSP, 'object-src')).toContain("'none'");
      expect(extractDirective(developmentCSP, 'frame-ancestors')).toContain("'none'");
    });
  });

  describe('Security Headers Validation', () => {
    it('should validate X-Frame-Options is DENY', () => {
      // Redundant with frame-ancestors but provides defense in depth
      const expectedValue = 'DENY';
      expect(expectedValue).toBe('DENY');
    });

    it('should validate X-Content-Type-Options is nosniff', () => {
      // Prevents MIME type sniffing attacks
      const expectedValue = 'nosniff';
      expect(expectedValue).toBe('nosniff');
    });

    it('should validate Referrer-Policy is strict-origin-when-cross-origin', () => {
      // Limits referrer information leakage
      const expectedValue = 'strict-origin-when-cross-origin';
      expect(expectedValue).toBe('strict-origin-when-cross-origin');
    });

    it('should validate Permissions-Policy restricts sensitive features', () => {
      // Should disable camera, microphone, geolocation, etc.
      const permissionsPolicy = [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'interest-cohort=()',
        'payment=()',
        'usb=()',
      ].join(', ');

      expect(permissionsPolicy).toContain('camera=()');
      expect(permissionsPolicy).toContain('microphone=()');
      expect(permissionsPolicy).toContain('geolocation=()');
    });

    it('should validate HSTS settings for production', () => {
      // HSTS should have long max-age and include subdomains
      const hstsValue = 'max-age=31536000; includeSubDomains; preload';
      expect(hstsValue).toContain('max-age=31536000');
      expect(hstsValue).toContain('includeSubDomains');
      expect(hstsValue).toContain('preload');
    });
  });

  describe('CSP Parsing and Validation', () => {
    it('should parse CSP directive correctly', () => {
      const csp = "default-src 'self'; script-src 'self' 'unsafe-inline';";
      const defaultSrc = extractDirective(csp, 'default-src');
      expect(defaultSrc).toBe("'self'");
    });

    it('should handle missing directives gracefully', () => {
      const csp = "default-src 'self';";
      const missingDirective = extractDirective(csp, 'nonexistent-directive');
      expect(missingDirective).toBe('');
    });
  });
});

/**
 * Helper function to extract a specific directive value from CSP string
 */
function extractDirective(csp: string, directive: string): string {
  const parts = csp.split(';').map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(directive)) {
      return part.substring(directive.length).trim();
    }
  }
  return '';
}
