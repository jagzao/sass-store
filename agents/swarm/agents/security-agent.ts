/**
 * Security Agent 2025 - Updated with Latest Security Best Practices
 * Based on OWASP Top 10:2025, Next.js Security Guidelines, and Modern SAST/DAST practices
 */

import { BaseAgent } from './base-agent';
import { swarmManager } from '../swarm-manager';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SecurityIssue {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  cwe?: string;
  cvss?: number;
  autoFixable?: boolean;
  owaspCategory?: string; // A01, A02, etc.
}

interface SecurityScanResult {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  issues: SecurityIssue[];
  report: string;
  passed: boolean;
}

export class SecurityAgent extends BaseAgent {

  /**
   * OWASP Top 10:2025 Categories (Preview based on 2021 + emerging threats)
   */
  private readonly owaspTop10_2025 = {
    A01: 'Broken Access Control',
    A02: 'Cryptographic Failures',
    A03: 'Injection',
    A04: 'Insecure Design',
    A05: 'Security Misconfiguration',
    A06: 'Vulnerable and Outdated Components',
    A07: 'Identification and Authentication Failures',
    A08: 'Software and Data Integrity Failures',
    A09: 'Security Logging and Monitoring Failures',
    A10: 'Server-Side Request Forgery (SSRF)',
    A11: 'AI/LLM Security Risks' // NEW for 2025
  };

  /**
   * Next.js 2025 Security Patterns
   * Based on CVE-2025-29927 and new middleware vulnerabilities
   */
  private readonly nextjsSecurityPatterns = [
    {
      pattern: /middleware\.(ts|js).*auth/gi,
      title: 'CRITICAL: Middleware used for authentication (CVE-2025-29927)',
      category: 'Authentication Bypass',
      severity: 'critical' as const,
      owaspCategory: 'A07',
      cwe: 'CWE-287',
      recommendation: 'URGENT: Migrate authentication from middleware to Data Access Layer (DAL). Middleware is no longer safe for auth after CVE-2025-29927.',
      autoFixable: false
    },
    {
      pattern: /\.use\(.*middleware.*\)/g,
      title: 'Review middleware authentication pattern',
      category: 'Authentication Pattern',
      severity: 'high' as const,
      owaspCategory: 'A07',
      cwe: 'CWE-284',
      recommendation: 'Ensure authentication is performed in Server Actions and API routes, not middleware.',
      autoFixable: false
    },
    {
      pattern: /cookies\(\)\.get\(['"].*['"]\)(?!.*httpOnly)/g,
      title: 'Cookie missing httpOnly flag',
      category: 'Insecure Cookie Configuration',
      severity: 'high' as const,
      owaspCategory: 'A05',
      cwe: 'CWE-1004',
      recommendation: 'Set httpOnly: true and sameSite: "strict" on all session cookies.',
      autoFixable: true
    },
    {
      pattern: /"use\s+server".*(?!.*verifySession)/gs,
      title: 'Server Action missing session verification',
      category: 'Missing Authorization',
      severity: 'critical' as const,
      owaspCategory: 'A01',
      cwe: 'CWE-862',
      recommendation: 'Always verify session at the start of Server Actions. Authentication ≠ Authorization.',
      autoFixable: false
    }
  ];

  /**
   * Advanced Code Security Patterns
   */
  private readonly codeSecurityPatterns = [
    {
      pattern: /eval\(/g,
      title: 'Code Injection: eval() detected',
      category: 'Code Injection',
      severity: 'critical' as const,
      owaspCategory: 'A03',
      cwe: 'CWE-95',
      recommendation: 'Remove eval(). Use JSON.parse() or Function constructor with strict validation.',
      autoFixable: false
    },
    {
      pattern: /dangerouslySetInnerHTML.*(?!DOMPurify)/g,
      title: 'XSS Risk: Unsanitized dangerouslySetInnerHTML',
      category: 'Cross-Site Scripting',
      severity: 'critical' as const,
      owaspCategory: 'A03',
      cwe: 'CWE-79',
      recommendation: 'Sanitize HTML with DOMPurify before using dangerouslySetInnerHTML.',
      autoFixable: false
    },
    {
      pattern: /NEXT_PUBLIC_.*(?:SECRET|KEY|TOKEN|PASSWORD)/gi,
      title: 'Secret exposed to client via NEXT_PUBLIC_',
      category: 'Information Disclosure',
      severity: 'critical' as const,
      owaspCategory: 'A02',
      cwe: 'CWE-200',
      recommendation: 'NEVER use NEXT_PUBLIC_ for secrets. Only use for truly public configuration.',
      autoFixable: false
    },
    {
      pattern: /(password|secret|api[_-]?key)\s*[:=]\s*['"][^'"]{1,20}['"]/gi,
      title: 'Hardcoded credential detected',
      category: 'Hardcoded Credentials',
      severity: 'critical' as const,
      owaspCategory: 'A07',
      cwe: 'CWE-798',
      recommendation: 'Use environment variables. Never commit secrets to version control.',
      autoFixable: false
    },
    {
      pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*(?:\+|`\$\{).*(?:FROM|INTO|SET|WHERE)/gi,
      title: 'SQL Injection: String concatenation in query',
      category: 'SQL Injection',
      severity: 'critical' as const,
      owaspCategory: 'A03',
      cwe: 'CWE-89',
      recommendation: 'Use parameterized queries or ORM (Prisma/Drizzle) to prevent SQL injection.',
      autoFixable: false
    },
    {
      pattern: /localStorage\.setItem.*(?:token|session|auth)/gi,
      title: 'Insecure token storage in localStorage',
      category: 'Insecure Storage',
      severity: 'high' as const,
      owaspCategory: 'A02',
      cwe: 'CWE-922',
      recommendation: 'Store tokens in httpOnly cookies or server-side sessions, not localStorage.',
      autoFixable: false
    },
    {
      pattern: /Math\.random\(\).*(?:token|id|key|secret)/gi,
      title: 'Weak randomness for security-critical value',
      category: 'Weak Cryptography',
      severity: 'high' as const,
      owaspCategory: 'A02',
      cwe: 'CWE-338',
      recommendation: 'Use crypto.randomBytes() or crypto.randomUUID() for security-sensitive values.',
      autoFixable: true
    },
    {
      pattern: /(?:md5|sha1|DES|RC4)\(/gi,
      title: 'Deprecated cryptographic algorithm',
      category: 'Cryptographic Failures',
      severity: 'high' as const,
      owaspCategory: 'A02',
      cwe: 'CWE-327',
      recommendation: 'Use SHA-256, SHA-3, Argon2, or bcrypt for hashing.',
      autoFixable: false
    },
    {
      pattern: /fetch\(['"]http:\/\//g,
      title: 'Insecure HTTP request',
      category: 'Insecure Communication',
      severity: 'medium' as const,
      owaspCategory: 'A02',
      cwe: 'CWE-319',
      recommendation: 'Always use HTTPS for external API calls.',
      autoFixable: true
    },
    {
      pattern: /console\.(log|error|warn)\(.*(?:password|token|secret|key)/gi,
      title: 'Sensitive data logged to console',
      category: 'Information Disclosure',
      severity: 'medium' as const,
      owaspCategory: 'A09',
      cwe: 'CWE-532',
      recommendation: 'Never log sensitive data. Use structured logging with redaction.',
      autoFixable: true
    }
  ];

  /**
   * AI/LLM Security Patterns (NEW for 2025)
   */
  private readonly aiSecurityPatterns = [
    {
      pattern: /(?:claude|openai|anthropic).*\.(?:messages|chat|completions)\.create\(.*\$\{.*\}/gs,
      title: 'Prompt Injection Risk: User input in AI prompt',
      category: 'AI/LLM Security',
      severity: 'high' as const,
      owaspCategory: 'A11',
      cwe: 'CWE-94',
      recommendation: 'Sanitize and validate user input before including in AI prompts. Use prompt templates.',
      autoFixable: false
    },
    {
      pattern: /(?:claude|openai).*(?:api[_-]?key|token)\s*[:=]/gi,
      title: 'AI API key potentially exposed',
      category: 'API Key Exposure',
      severity: 'critical' as const,
      owaspCategory: 'A02',
      cwe: 'CWE-798',
      recommendation: 'Store AI API keys in environment variables, never in code.',
      autoFixable: false
    }
  ];

  protected async execute(): Promise<void> {
    const session = swarmManager.loadSession(this.sessionId);
    if (!session) throw new Error('Session not found');

    this.log('🔒 Starting Security Scan 2025...');
    this.updateProgress(5, 'Initializing security scan with 2025 best practices...');

    const allIssues: SecurityIssue[] = [];

    // Phase 1: Static Code Analysis
    this.updateProgress(10, '📝 Phase 1: Static Code Analysis (SAST)');
    const modifiedFiles = await this.getModifiedFiles(session);
    for (const file of modifiedFiles) {
      const fileIssues = await this.scanFile(file);
      allIssues.push(...fileIssues);
    }

    // Phase 2: Dependency Vulnerabilities
    this.updateProgress(25, '📦 Phase 2: Scanning Dependencies (SCA)');
    const depIssues = await this.scanDependencies();
    allIssues.push(...depIssues);

    // Phase 3: Authentication & Authorization (NEW 2025 Focus)
    this.updateProgress(40, '🔐 Phase 3: Authentication & Authorization Audit');
    const authIssues = await this.auditAuthPatterns(modifiedFiles);
    allIssues.push(...authIssues);

    // Phase 4: Data Access Layer Security
    this.updateProgress(50, '🗄️ Phase 4: Data Access Layer (DAL) Security');
    const dalIssues = await this.auditDataAccessLayer(modifiedFiles);
    allIssues.push(...dalIssues);

    // Phase 5: API Security
    this.updateProgress(60, '🌐 Phase 5: API Security & CORS');
    const apiIssues = await this.auditAPIEndpoints(modifiedFiles);
    allIssues.push(...apiIssues);

    // Phase 6: Security Headers & CSP
    this.updateProgress(70, '🛡️ Phase 6: Security Headers & CSP');
    const headerIssues = await this.auditSecurityHeaders();
    allIssues.push(...headerIssues);

    // Phase 7: Multi-tenant RLS
    this.updateProgress(80, '🏢 Phase 7: Multi-tenant Row Level Security');
    const rlsIssues = await this.auditRLSPolicies();
    allIssues.push(...rlsIssues);

    // Phase 8: AI/LLM Security (NEW for 2025)
    this.updateProgress(85, '🤖 Phase 8: AI/LLM Security Risks');
    const aiIssues = await this.auditAISecurity(modifiedFiles);
    allIssues.push(...aiIssues);

    // Phase 9: Generate Comprehensive Report
    this.updateProgress(90, '📊 Generating Security Report...');
    const result = this.generateComprehensiveReport(allIssues);

    this.updateProgress(100, 'Security scan completed');

    this.log(`\n${result.report}`);

    // Complete task
    this.updateTask('COMPLETED', result);

    // Fail if critical issues found
    if (result.critical > 0) {
      throw new Error(`🚨 SECURITY FAILED: Found ${result.critical} critical security issues!`);
    }
  }

  private async getModifiedFiles(session: any): Promise<string[]> {
    const devTask = session.tasks.find((t: any) => t.agent === 'DEVELOPER');
    if (devTask?.output?.files) {
      return devTask.output.files;
    }

    try {
      const { stdout } = await execAsync('git diff --name-only HEAD');
      const files = stdout.split('\n').filter(f => f.length > 0 && f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));
      return files;
    } catch {
      // Fallback: scan common directories
      return this.scanDirectory('apps/web');
    }
  }

  private scanDirectory(dir: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...this.scanDirectory(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  private async scanFile(filePath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    if (!fs.existsSync(filePath)) return issues;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Scan Next.js-specific patterns
    for (const pattern of this.nextjsSecurityPatterns) {
      const matches = content.matchAll(new RegExp(pattern.pattern, 'gm'));
      for (const match of matches) {
        if (match[0] && !this.isCommented(match.index || 0, content)) {
          issues.push({
            file: filePath,
            line: this.getLineNumber(match.index || 0, lines),
            severity: pattern.severity,
            category: pattern.category,
            title: pattern.title,
            description: `Found: ${match[0].substring(0, 100)}`,
            recommendation: pattern.recommendation,
            cwe: pattern.cwe,
            owaspCategory: pattern.owaspCategory,
            autoFixable: pattern.autoFixable
          });
        }
      }
    }

    // Scan general code security patterns
    for (const pattern of this.codeSecurityPatterns) {
      const matches = content.matchAll(new RegExp(pattern.pattern, 'gm'));
      for (const match of matches) {
        if (match[0] && !this.isCommented(match.index || 0, content)) {
          issues.push({
            file: filePath,
            line: this.getLineNumber(match.index || 0, lines),
            severity: pattern.severity,
            category: pattern.category,
            title: pattern.title,
            description: `Pattern detected: ${match[0].substring(0, 80)}...`,
            recommendation: pattern.recommendation,
            cwe: pattern.cwe,
            owaspCategory: pattern.owaspCategory,
            autoFixable: pattern.autoFixable
          });
        }
      }
    }

    return issues;
  }

  private async auditAISecurity(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (const pattern of this.aiSecurityPatterns) {
        const matches = content.matchAll(new RegExp(pattern.pattern, 'gm'));
        for (const match of matches) {
          issues.push({
            file,
            line: this.getLineNumber(match.index || 0, lines),
            severity: pattern.severity,
            category: pattern.category,
            title: pattern.title,
            description: `AI security risk detected`,
            recommendation: pattern.recommendation,
            cwe: pattern.cwe,
            owaspCategory: pattern.owaspCategory
          });
        }
      }
    }

    return issues;
  }

  private async auditAuthPatterns(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf-8');

      // Check for Server Actions without auth
      if (content.includes('"use server"') && !content.includes('verifySession') && !content.includes('getSession')) {
        issues.push({
          file,
          line: 0,
          severity: 'critical',
          category: 'Missing Authentication',
          title: 'Server Action lacks session verification',
          description: 'Server Action exposed without authentication check',
          recommendation: 'Add verifySession() or getSession() at the start of the Server Action',
          owaspCategory: 'A01',
          cwe: 'CWE-862'
        });
      }

      // Check for API routes without auth
      if (file.includes('/api/') && file.includes('route.ts') && !content.includes('auth') && !content.includes('session')) {
        issues.push({
          file,
          line: 0,
          severity: 'high',
          category: 'Missing Authentication',
          title: 'API route missing authentication',
          description: 'API endpoint appears to lack authentication',
          recommendation: 'Add authentication check at the start of the API handler',
          owaspCategory: 'A07'
        });
      }
    }

    return issues;
  }

  private async auditDataAccessLayer(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf-8');

      // Check for tenant isolation in queries
      if ((content.includes('.findMany') || content.includes('.findUnique') || content.includes('.findFirst'))
          && !content.includes('tenantId') && !content.includes('tenant_id')) {
        issues.push({
          file,
          line: 0,
          severity: 'critical',
          category: 'Broken Access Control',
          title: 'Database query missing tenant isolation',
          description: 'Query lacks tenantId filter in multi-tenant system',
          recommendation: 'Always include tenantId in WHERE clause for data isolation',
          owaspCategory: 'A01',
          cwe: 'CWE-284'
        });
      }
    }

    return issues;
  }

  private async auditAPIEndpoints(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const file of files) {
      if (!file.includes('/api/') || !fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf-8');

      // Check for rate limiting
      if (!content.includes('rateLimit') && !content.includes('Ratelimit')) {
        issues.push({
          file,
          line: 0,
          severity: 'medium',
          category: 'Missing Rate Limiting',
          title: 'API endpoint lacks rate limiting',
          description: 'No rate limiting detected on API endpoint',
          recommendation: 'Implement rate limiting using @upstash/ratelimit or similar',
          owaspCategory: 'A05'
        });
      }

      // Check for input validation
      if (!content.includes('zod') && !content.includes('validate') && !content.includes('schema')) {
        issues.push({
          file,
          line: 0,
          severity: 'high',
          category: 'Missing Input Validation',
          title: 'API endpoint missing input validation',
          description: 'No input validation library detected',
          recommendation: 'Use Zod or similar for input validation',
          owaspCategory: 'A03'
        });
      }
    }

    return issues;
  }

  private async auditSecurityHeaders(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const configPaths = [
      'apps/web/next.config.js',
      'apps/web/next.config.ts',
      'next.config.js',
      'next.config.ts'
    ];

    for (const configPath of configPaths) {
      if (!fs.existsSync(configPath)) continue;
      const content = fs.readFileSync(configPath, 'utf-8');

      const requiredHeaders = [
        { name: 'Content-Security-Policy', severity: 'high' as const },
        { name: 'X-Frame-Options', severity: 'medium' as const },
        { name: 'X-Content-Type-Options', severity: 'medium' as const },
        { name: 'Referrer-Policy', severity: 'low' as const },
        { name: 'Permissions-Policy', severity: 'low' as const }
      ];

      for (const header of requiredHeaders) {
        if (!content.includes(header.name)) {
          issues.push({
            file: configPath,
            line: 0,
            severity: header.severity,
            category: 'Missing Security Headers',
            title: `${header.name} header not configured`,
            description: `Security header ${header.name} is missing`,
            recommendation: `Add ${header.name} header in next.config`,
            owaspCategory: 'A05'
          });
        }
      }

      // Check for overly permissive CORS
      if (content.includes("'*'") && content.includes('origin')) {
        issues.push({
          file: configPath,
          line: 0,
          severity: 'high',
          category: 'Insecure CORS',
          title: 'Overly permissive CORS configuration',
          description: 'CORS allows all origins (*)',
          recommendation: 'Restrict CORS to specific trusted domains',
          owaspCategory: 'A05',
          cwe: 'CWE-942'
        });
      }
    }

    return issues;
  }

  private async auditRLSPolicies(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const schemaFiles = [
      'apps/api/db/schema.ts',
      'packages/database/schema.ts',
      'drizzle.config.ts'
    ];

    for (const schemaFile of schemaFiles) {
      if (!fs.existsSync(schemaFile)) continue;
      const content = fs.readFileSync(schemaFile, 'utf-8');

      if (!content.includes('enableRLS') && !content.includes('ROW LEVEL SECURITY')) {
        issues.push({
          file: schemaFile,
          line: 0,
          severity: 'critical',
          category: 'Missing RLS',
          title: 'Row Level Security not enabled',
          description: 'Database lacks RLS policies for multi-tenant isolation',
          recommendation: 'Enable RLS policies on all tables to prevent data leakage',
          owaspCategory: 'A01',
          cwe: 'CWE-284'
        });
      }
    }

    return issues;
  }

  private async scanDependencies(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    try {
      const { stdout } = await execAsync('npm audit --json', { timeout: 60000 });
      const auditResult = JSON.parse(stdout);

      if (auditResult.vulnerabilities) {
        for (const [pkg, vuln] of Object.entries<any>(auditResult.vulnerabilities)) {
          const severity = this.mapNpmSeverity(vuln.severity);
          issues.push({
            file: 'package.json',
            line: 0,
            severity,
            category: 'Vulnerable Dependency',
            title: `${pkg}: ${vuln.title || 'Security vulnerability'}`,
            description: vuln.overview || vuln.via?.[0]?.title || 'Dependency vulnerability',
            recommendation: `Update ${pkg} to ${vuln.fixAvailable?.version || 'latest version'}`,
            cvss: vuln.via?.[0]?.cvss?.score,
            owaspCategory: 'A06'
          });
        }
      }
    } catch (error) {
      this.log(`⚠️  npm audit failed: ${error}`);
    }

    return issues;
  }

  private mapNpmSeverity(npmSeverity: string): 'critical' | 'high' | 'medium' | 'low' {
    const map: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      critical: 'critical',
      high: 'high',
      moderate: 'medium',
      low: 'low'
    };
    return map[npmSeverity] || 'low';
  }

  private isCommented(index: number, content: string): boolean {
    const beforeMatch = content.substring(Math.max(0, index - 100), index);
    const lines = beforeMatch.split('\n');
    const lastLine = lines[lines.length - 1] || '';
    return lastLine.trim().startsWith('//') || lastLine.trim().startsWith('*');
  }

  private getLineNumber(index: number, lines: string[]): number {
    let currentIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      currentIndex += lines[i].length + 1; // +1 for newline
      if (currentIndex > index) return i + 1;
    }
    return 0;
  }

  private generateComprehensiveReport(issues: SecurityIssue[]): SecurityScanResult {
    const critical = issues.filter(i => i.severity === 'critical');
    const high = issues.filter(i => i.severity === 'high');
    const medium = issues.filter(i => i.severity === 'medium');
    const low = issues.filter(i => i.severity === 'low');
    const info = issues.filter(i => i.severity === 'info');

    let report = `# 🔒 Security Scan Report 2025\n\n`;
    report += `**Scan Date:** ${new Date().toISOString()}\n`;
    report += `**Standards:** OWASP Top 10:2025, Next.js Security Best Practices\n\n`;

    report += `## 📊 Summary\n\n`;
    report += `**Total Issues:** ${issues.length}\n\n`;
    report += `| Severity | Count | Status |\n`;
    report += `|----------|-------|--------|\n`;
    report += `| 🔴 Critical | ${critical.length} | ${critical.length === 0 ? '✅ Pass' : '❌ FAIL'} |\n`;
    report += `| 🟠 High | ${high.length} | ${high.length === 0 ? '✅ Pass' : '⚠️ Review'} |\n`;
    report += `| 🟡 Medium | ${medium.length} | ${medium.length < 5 ? '✅ Pass' : '⚠️ Review'} |\n`;
    report += `| 🟢 Low | ${low.length} | ℹ️ Info |\n\n`;

    // OWASP Top 10 breakdown
    report += `## 🎯 OWASP Top 10:2025 Coverage\n\n`;
    const owaspCategories = Object.entries(this.owaspTop10_2025);
    for (const [code, name] of owaspCategories) {
      const categoryIssues = issues.filter(i => i.owaspCategory === code);
      const icon = categoryIssues.length === 0 ? '✅' : categoryIssues.some(i => i.severity === 'critical') ? '🔴' : '🟡';
      report += `- ${icon} **${code}: ${name}** - ${categoryIssues.length} issue(s)\n`;
    }
    report += `\n`;

    // Critical issues (detailed)
    if (critical.length > 0) {
      report += `## 🔴 CRITICAL ISSUES - IMMEDIATE ACTION REQUIRED\n\n`;
      critical.forEach((issue, index) => {
        report += `### ${index + 1}. ${issue.title}\n`;
        report += `- **File:** \`${issue.file}:${issue.line}\`\n`;
        report += `- **Category:** ${issue.category}\n`;
        if (issue.owaspCategory) report += `- **OWASP:** ${issue.owaspCategory}\n`;
        if (issue.cwe) report += `- **CWE:** ${issue.cwe}\n`;
        if (issue.cvss) report += `- **CVSS Score:** ${issue.cvss}\n`;
        report += `- **Description:** ${issue.description}\n`;
        report += `- **💡 Recommendation:** ${issue.recommendation}\n`;
        if (issue.autoFixable) report += `- **🔧 Auto-fixable:** Yes\n`;
        report += `\n`;
      });
    }

    // High priority issues (summary)
    if (high.length > 0) {
      report += `## 🟠 HIGH PRIORITY ISSUES\n\n`;
      high.slice(0, 10).forEach((issue, index) => {
        report += `${index + 1}. **${issue.title}** in \`${path.basename(issue.file)}\`\n`;
        report += `   - ${issue.recommendation}\n\n`;
      });
      if (high.length > 10) {
        report += `_... and ${high.length - 10} more high-priority issues._\n\n`;
      }
    }

    // Auto-fixable issues
    const autoFixable = issues.filter(i => i.autoFixable);
    if (autoFixable.length > 0) {
      report += `## 🔧 Auto-Fixable Issues\n\n`;
      report += `${autoFixable.length} issue(s) can be automatically fixed:\n\n`;
      autoFixable.slice(0, 5).forEach(issue => {
        report += `- ${issue.title} in \`${path.basename(issue.file)}\`\n`;
      });
      report += `\n**Run auto-fix:** \`npm run security:autofix\`\n\n`;
    }

    // Final verdict
    report += `## 🎯 Verdict\n\n`;
    if (critical.length > 0) {
      report += `❌ **SECURITY SCAN FAILED**\n\n`;
      report += `**Action Required:** Fix ${critical.length} critical issue(s) before deployment.\n`;
      report += `**Blocking Deployment:** YES\n`;
    } else if (high.length > 5) {
      report += `⚠️ **SECURITY SCAN PASSED WITH WARNINGS**\n\n`;
      report += `No critical issues, but ${high.length} high-priority issues should be addressed.\n`;
      report += `**Blocking Deployment:** NO (but review recommended)\n`;
    } else {
      report += `✅ **SECURITY SCAN PASSED**\n\n`;
      report += `No critical security issues detected.\n`;
      report += `**Safe for Deployment:** YES\n`;
    }

    return {
      totalIssues: issues.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
      info: info.length,
      issues,
      report,
      passed: critical.length === 0
    };
  }
}
