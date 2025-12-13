# Additional Security Measures for SASS Store

## Overview

While we've addressed the critical CVE-2025-55184 and CVE-2025-55183 vulnerabilities, there are several additional security measures that should be implemented to further strengthen the security posture of the SASS Store application.

## 1. Security Headers Implementation

### Current Status

Security headers are a critical layer of defense for web applications. Currently, we need to verify and implement the following security headers:

### Recommended Security Headers

#### 1. Content Security Policy (CSP)

```typescript
// In next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};
```

#### 2. HTTP Strict Transport Security (HSTS)

```typescript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload',
}
```

#### 3. X-Content-Type-Options

```typescript
{
  key: 'X-Content-Type-Options',
  value: 'nosniff',
}
```

#### 4. X-Frame-Options

```typescript
{
  key: 'X-Frame-Options',
  value: 'DENY',
}
```

#### 5. X-XSS-Protection

```typescript
{
  key: 'X-XSS-Protection',
  value: '1; mode=block',
}
```

#### 6. Referrer-Policy

```typescript
{
  key: 'Referrer-Policy',
  value: 'strict-origin-when-cross-origin',
}
```

#### 7. Permissions-Policy

```typescript
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=(), payment=()',
}
```

## 2. Input Validation and Sanitization

### Current Status

We need to implement comprehensive input validation and sanitization for all user inputs.

### Implementation Plan

#### 1. Zod Schema Validation

```typescript
// Example of comprehensive validation schema
import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
      "Invalid phone number",
    ),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

#### 2. SQL Injection Prevention

```typescript
// Ensure all database queries use parameterized statements
// Example with Drizzle
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}
```

#### 3. XSS Prevention

```typescript
// Use React's built-in XSS protection
// Sanitize user-generated content before rendering
import DOMPurify from "dompurify";

export function sanitizeUserContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ["b", "i", "u", "em", "strong", "a"],
    ALLOWED_ATTR: ["href", "title"],
  });
}
```

## 3. Authentication and Authorization Enhancements

### Current Status

We need to strengthen authentication and authorization mechanisms.

### Implementation Plan

#### 1. Multi-Factor Authentication (MFA)

```typescript
// Implement MFA using libraries like speakeasy or otpauth
import speakeasy from 'speakeasy';

export function generateMFA Secret(userEmail: string) {
  return speakeasy.generateSecret({
    name: `SASS Store (${userEmail})`,
    issuer: 'SASS Store',
  });
}

export function verifyMFA Token(token: string, secret: string) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2,
  });
}
```

#### 2. Session Management

```typescript
// Implement secure session management
import { SignJWT, jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSessionToken(userId: string, tenantId: string) {
  return await new SignJWT({ userId, tenantId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}
```

#### 3. Role-Based Access Control (RBAC)

```typescript
// Define user roles and permissions
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user",
}

export enum Permission {
  READ_CUSTOMERS = "read:customers",
  WRITE_CUSTOMERS = "write:customers",
  DELETE_CUSTOMERS = "delete:customers",
  MANAGE_TENANT = "manage:tenant",
}

export const rolePermissions = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.MANAGER]: [Permission.READ_CUSTOMERS, Permission.WRITE_CUSTOMERS],
  [UserRole.USER]: [Permission.READ_CUSTOMERS],
};

export function hasPermission(
  userRole: UserRole,
  permission: Permission,
): boolean {
  return rolePermissions[userRole].includes(permission);
}
```

## 4. Data Protection and Encryption

### Current Status

We need to ensure sensitive data is properly protected both in transit and at rest.

### Implementation Plan

#### 1. Data Encryption at Rest

```typescript
// Encrypt sensitive data before storing in database
import crypto from "crypto";

const algorithm = "aes-256-gcm";
const keyLength = 32;
const ivLength = 16;
const tagLength = 16;

export function encrypt(
  text: string,
  secret: string,
): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(ivLength);
  const key = crypto.scryptSync(secret, "salt", keyLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decrypt(
  encrypted: string,
  iv: string,
  tag: string,
  secret: string,
): string {
  const key = crypto.scryptSync(secret, "salt", keyLength);
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

#### 2. Sensitive Data Masking

```typescript
// Mask sensitive data in logs and responses
export function maskEmail(email: string): string {
  const [username, domain] = email.split("@");
  const maskedUsername =
    username.length > 3
      ? `${username.substring(0, 2)}***${username.substring(username.length - 1)}`
      : `${username.substring(0, 1)}***`;

  return `${maskedUsername}@${domain}`;
}

export function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) return "****";
  return `${phone.substring(0, 2)}****${phone.substring(phone.length - 2)}`;
}
```

## 5. API Security Enhancements

### Current Status

We need to further secure API endpoints against various attack vectors.

### Implementation Plan

#### 1. API Versioning

```typescript
// Implement API versioning
// apps/api/app/api/v1/[tenant]/customers/route.ts
```

#### 2. Request Validation Middleware

```typescript
// Create middleware for request validation
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export function validateRequest(schema: any) {
  return async (request: NextRequest, context: any) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);

      // Add validated data to the request context
      context.validatedData = validatedData;

      return NextResponse.next();
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
```

#### 3. API Rate Limiting by User

```typescript
// Enhance rate limiting to be user-specific
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Create different rate limiters for different user types
const adminRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "1h"), // 100 requests per hour for admins
  analytics: true,
});

const userRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "1h"), // 20 requests per hour for regular users
  analytics: true,
});

export async function checkRateLimit(
  identifier: string,
  isAdmin: boolean = false,
) {
  const ratelimit = isAdmin ? adminRatelimit : userRatelimit;
  const { success, limit, remaining, reset } =
    await ratelimit.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset,
  };
}
```

## 6. Logging and Monitoring

### Current Status

We need to implement comprehensive logging and monitoring for security events.

### Implementation Plan

#### 1. Security Event Logging

```typescript
// Log security events
export interface SecurityEvent {
  type: "authentication" | "authorization" | "data_access" | "rate_limit";
  action: string;
  userId?: string;
  tenantId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  details?: any;
}

export async function logSecurityEvent(
  event: Omit<SecurityEvent, "timestamp">,
) {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  };

  // Log to database
  await db.insert(securityLogs).values(securityEvent);

  // Also send to monitoring service
  if (process.env.MONITORING_SERVICE_URL) {
    await fetch(process.env.MONITORING_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(securityEvent),
    });
  }
}
```

#### 2. Anomaly Detection

```typescript
// Implement basic anomaly detection
export async function detectAnomalousActivity(userId: string) {
  // Check for unusual login patterns
  const recentLogins = await db
    .select()
    .from(authLogs)
    .where(
      and(
        eq(authLogs.userId, userId),
        gte(authLogs.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)), // Last 24 hours
      ),
    );

  // Check for logins from multiple IP addresses
  const uniqueIPs = new Set(recentLogins.map((login) => login.ip));

  // Check for failed login attempts
  const failedLogins = recentLogins.filter((login) => !login.success);

  // If more than 5 unique IPs or more than 10 failed attempts, flag as anomalous
  if (uniqueIPs.size > 5 || failedLogins.length > 10) {
    await logSecurityEvent({
      type: "authentication",
      action: "anomalous_activity_detected",
      userId,
      ip: "unknown", // We don't have the current IP here
      userAgent: "unknown",
      success: false,
      details: {
        uniqueIPs: uniqueIPs.size,
        failedLogins: failedLogins.length,
      },
    });

    return true;
  }

  return false;
}
```

## 7. Additional Security Measures

### 1. CSRF Protection

```typescript
// Implement CSRF protection
import { randomBytes } from "crypto";

export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

export function validateCSRFToken(
  token: string,
  sessionToken: string,
): boolean {
  // In a real implementation, you would store the token in the session
  // and compare it with the submitted token
  return token === sessionToken;
}
```

### 2. File Upload Security

```typescript
// Secure file upload handling
import { writeFile } from "fs/promises";
import { join } from "path";

export async function secureFileUpload(
  file: File,
  userId: string,
): Promise<string> {
  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("File too large");
  }

  // Generate secure filename
  const fileExtension = file.name.split(".").pop();
  const secureFileName = `${userId}_${Date.now()}.${fileExtension}`;

  // Save to secure directory
  const uploadDir = join(process.cwd(), "uploads", userId);
  const filePath = join(uploadDir, secureFileName);

  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return secureFileName;
}
```

### 3. Dependency Security Scanning

```typescript
// Add to package.json scripts
{
  "scripts": {
    "security:audit": "npm audit --audit-level=moderate",
    "security:fix": "npm audit fix",
    "security:check": "npm audit --json > audit-report.json && node scripts/check-audit.js",
    "security:autofix": "npm audit fix --force"
  }
}
```

## Implementation Priority

1. **High Priority (Immediate)**
   - Security Headers Implementation
   - Input Validation and Sanitization
   - Session Management Enhancements

2. **Medium Priority (Next Sprint)**
   - Multi-Factor Authentication
   - Role-Based Access Control
   - Data Protection and Encryption

3. **Low Priority (Future Enhancement)**
   - API Security Enhancements
   - Logging and Monitoring
   - Additional Security Measures

## Conclusion

These additional security measures will significantly enhance the security posture of the SASS Store application. Implementing these measures will help protect against common web application vulnerabilities and ensure the application remains secure as it evolves.
