import { securityLogger } from "./audit-logger";

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: any;
  errors: string[];
  riskLevel: "low" | "medium" | "high";
  warnings: string[];
}

/**
 * Advanced input validation and sanitization
 */
export class InputValidator {
  private static sqlInjectionPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\\x23)|(--)|;|(%3B)|(%27)|(%22)|(%3D)|(%2D)|(%23))/i,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /('|(\\x27)|(\\x2D\\x2D)|(#)|(\\x23)|(--)|;|(%3B)|(%27)|(%22)|(%3D)|(%2D)|(%23))/i,
  ];

  private static xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
  ];

  private static suspiciousPatterns = [
    /\b(eval|exec|system|shell_exec|passthru|proc_open|popen)\b/i,
    /\b(base64_decode|base64_encode|serialize|unserialize)\b/i,
    /\b(file_get_contents|file_put_contents|fopen|fwrite)\b/i,
    /data:\s*text\/html/gi,
  ];

  /**
   * Validate and sanitize text input
   */
  static validateText(
    input: string,
    options: {
      maxLength?: number;
      minLength?: number;
      allowHtml?: boolean;
      allowSpecialChars?: boolean;
      fieldName?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    if (!input && options.minLength && options.minLength > 0) {
      errors.push(`${options.fieldName || "Field"} is required`);
      return { isValid: false, errors, riskLevel, warnings };
    }

    // Length validation
    if (options.maxLength && input.length > options.maxLength) {
      errors.push(
        `${options.fieldName || "Field"} exceeds maximum length of ${options.maxLength} characters`,
      );
    }

    if (options.minLength && input.length < options.minLength) {
      errors.push(
        `${options.fieldName || "Field"} must be at least ${options.minLength} characters long`,
      );
    }

    // SQL injection detection
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        errors.push("Potential SQL injection detected");
        riskLevel = "high";

        // Log security event
        securityLogger.logSuspiciousActivity(
          null,
          null,
          "sql_injection_attempt",
          ["sql_injection", "malicious_input"],
          options.ipAddress || "unknown",
          options.userAgent || "unknown",
          {
            fieldName: options.fieldName,
            inputLength: input.length,
            pattern: pattern.source,
          },
        );
        break;
      }
    }

    // XSS detection
    for (const pattern of this.xssPatterns) {
      if (pattern.test(input)) {
        warnings.push("Potential XSS attempt detected");
        riskLevel = riskLevel === "high" ? "high" : "medium";
      }
    }

    // Suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(input)) {
        warnings.push("Suspicious pattern detected");
        riskLevel = "high";
      }
    }

    // Special characters validation
    if (!options.allowSpecialChars) {
      const specialChars = /[<>"'&]/;
      if (specialChars.test(input)) {
        warnings.push("Special characters detected");
        if (riskLevel === "low") riskLevel = "medium";
      }
    }

    // Sanitization
    let sanitizedValue = input;

    if (!options.allowHtml) {
      // Basic HTML sanitization (remove HTML tags)
      sanitizedValue = input.replace(/<[^>]*>/g, "");
    }

    // Trim whitespace
    sanitizedValue = sanitizedValue.trim();

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors,
      riskLevel,
      warnings,
    };
  }

  /**
   * Validate email address
   */
  static validateEmail(
    email: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }

    // Check for suspicious patterns in email
    if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) {
      warnings.push("Suspicious email format");
      riskLevel = "medium";
    }

    // Check for common disposable email domains
    const disposableDomains = [
      "10minutemail.com",
      "temp-mail.org",
      "guerrillamail.com",
    ];
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      warnings.push("Disposable email domain detected");
      riskLevel = "medium";
    }

    // Length checks
    if (email.length > 254) {
      errors.push("Email address is too long");
    }

    const localPart = email.split("@")[0];
    if (localPart && localPart.length > 64) {
      errors.push("Local part of email is too long");
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: email.toLowerCase().trim(),
      errors,
      riskLevel,
      warnings,
    };
  }

  /**
   * Validate numeric input
   */
  static validateNumber(
    input: any,
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
      fieldName?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    const num = Number(input);

    if (isNaN(num)) {
      errors.push(`${options.fieldName || "Field"} must be a valid number`);
      return { isValid: false, errors, riskLevel, warnings };
    }

    if (options.integer && !Number.isInteger(num)) {
      errors.push(`${options.fieldName || "Field"} must be an integer`);
    }

    if (options.min !== undefined && num < options.min) {
      errors.push(
        `${options.fieldName || "Field"} must be at least ${options.min}`,
      );
    }

    if (options.max !== undefined && num > options.max) {
      errors.push(
        `${options.fieldName || "Field"} must be at most ${options.max}`,
      );
    }

    // Check for extremely large numbers (potential attack)
    if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
      warnings.push("Extremely large number detected");
      riskLevel = "medium";
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: options.integer ? Math.floor(num) : num,
      errors,
      riskLevel,
      warnings,
    };
  }

  /**
   * Validate URL
   */
  static validateURL(
    url: string,
    options: {
      allowedProtocols?: string[];
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    try {
      const urlObj = new URL(url);

      // Check protocol
      const allowedProtocols = options.allowedProtocols || ["http:", "https:"];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        errors.push(`Protocol ${urlObj.protocol} is not allowed`);
      }

      // Check for localhost/internal IPs (potential SSRF)
      if (
        urlObj.hostname === "localhost" ||
        urlObj.hostname === "127.0.0.1" ||
        urlObj.hostname.startsWith("192.168.") ||
        urlObj.hostname.startsWith("10.") ||
        urlObj.hostname.startsWith("172.")
      ) {
        warnings.push("Internal/localhost URL detected");
        riskLevel = "high";
      }

      // Check for suspicious ports
      const suspiciousPorts = [22, 23, 25, 53, 110, 143, 993, 995];
      if (urlObj.port && suspiciousPorts.includes(parseInt(urlObj.port))) {
        warnings.push("Suspicious port detected");
        riskLevel = "high";
      }
    } catch (error) {
      errors.push("Invalid URL format");
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: url,
      errors,
      riskLevel,
      warnings,
    };
  }

  /**
   * Sanitize HTML content (basic implementation)
   */
  static sanitizeHTML(html: string): string {
    // Remove dangerous tags and attributes
    let sanitized = html
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
      .replace(/<object[^>]*>.*?<\/object>/gi, "")
      .replace(/<embed[^>]*>.*?<\/embed>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/on\w+\s*=/gi, "");

    // Only allow safe tags
    const allowedTags = [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
    ];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

    sanitized = sanitized.replace(tagRegex, (match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        // Remove dangerous attributes from allowed tags
        return match.replace(
          /\s+(href|target|rel)\s*=\s*["'][^"']*["']/gi,
          (attrMatch, attrName) => {
            // Only allow safe href values
            if (
              attrName === "href" &&
              !attrMatch.includes("javascript:") &&
              !attrMatch.includes("vbscript:")
            ) {
              return attrMatch;
            }
            return "";
          },
        );
      }
      return "";
    });

    return sanitized;
  }

  /**
   * Check if input contains malicious patterns
   */
  static containsMaliciousPatterns(input: string): {
    hasMaliciousContent: boolean;
    patterns: string[];
    riskLevel: "low" | "medium" | "high";
  } {
    const patterns: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    // Check SQL injection
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        patterns.push("SQL Injection");
        riskLevel = "high";
      }
    }

    // Check XSS
    for (const pattern of this.xssPatterns) {
      if (pattern.test(input)) {
        patterns.push("XSS");
        if (riskLevel !== "high") riskLevel = "medium";
      }
    }

    // Check other suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(input)) {
        patterns.push("Suspicious Code");
        riskLevel = "high";
      }
    }

    return {
      hasMaliciousContent: patterns.length > 0,
      patterns,
      riskLevel,
    };
  }
}
