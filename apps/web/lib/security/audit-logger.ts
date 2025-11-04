import { db } from "@sass-store/database";
import { auditLogs } from "@sass-store/database/schema";
import { sql } from "drizzle-orm";

export interface SecurityEvent {
  type:
    | "auth_attempt"
    | "auth_success"
    | "auth_failure"
    | "tenant_access"
    | "permission_denied"
    | "suspicious_activity"
    | "data_access"
    | "config_change";
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details?: Record<string, any>;
  riskScore?: number;
}

/**
 * Enhanced security audit logger
 * Logs security events with risk scoring and anomaly detection
 */
export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  /**
   * Log a security event
   */
  async logEvent(event: SecurityEvent): Promise<void> {
    try {
      const riskScore = this.calculateRiskScore(event);

      await db.insert(auditLogs).values({
        tenantId: event.tenantId || null,
        actorId: event.userId || "system",
        action: `security.${event.type}`,
        targetTable: event.resource || "system",
        targetId: event.action || "unknown",
        data: {
          severity: event.severity,
          riskScore,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          details: event.details,
          timestamp: new Date().toISOString(),
        },
      });

      // Alert on high-risk events
      if (riskScore >= 7) {
        await this.alertHighRiskEvent(event, riskScore);
      }
    } catch (error) {
      console.error("Failed to log security event:", error);
      // Don't throw - security logging should not break the application
    }
  }

  /**
   * Calculate risk score for an event (0-10 scale)
   */
  private calculateRiskScore(event: SecurityEvent): number {
    let score = 0;

    // Base score by event type
    const typeScores = {
      auth_failure: 3,
      permission_denied: 4,
      tenant_access: 2,
      suspicious_activity: 6,
      data_access: 2,
      config_change: 5,
      auth_attempt: 1,
      auth_success: 0,
    };

    score += typeScores[event.type] || 1;

    // Severity multiplier
    const severityMultiplier = {
      low: 0.5,
      medium: 1,
      high: 1.5,
      critical: 2,
    };

    score *= severityMultiplier[event.severity];

    // Additional factors
    if (event.details?.consecutiveFailures) {
      score += Math.min(event.details.consecutiveFailures * 0.5, 3);
    }

    if (event.details?.unusualLocation) {
      score += 2;
    }

    if (event.details?.unusualTime) {
      score += 1;
    }

    if (event.details?.suspiciousPattern) {
      score += 2;
    }

    return Math.min(Math.round(score * 10) / 10, 10);
  }

  /**
   * Alert on high-risk security events
   */
  private async alertHighRiskEvent(
    event: SecurityEvent,
    riskScore: number
  ): Promise<void> {
    console.warn(
      `🚨 HIGH RISK SECURITY EVENT: ${event.type} (Risk: ${riskScore})`,
      {
        userId: event.userId,
        tenantId: event.tenantId,
        ipAddress: event.ipAddress,
        details: event.details,
      }
    );

    // Send alert to Slack if webhook is configured
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await this.sendSlackAlert(event, riskScore);
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
    }

    // Send email alert if configured
    if (process.env.ALERT_EMAIL) {
      try {
        await this.sendEmailAlert(event, riskScore);
      } catch (error) {
        console.error('Failed to send email alert:', error);
      }
    }
  }

  /**
   * Send a Slack alert for high-risk events
   */
  private async sendSlackAlert(event: SecurityEvent, riskScore: number): Promise<void> {
    const message = {
      text: `🚨 HIGH RISK SECURITY EVENT`,
      attachments: [
        {
          color: riskScore >= 9 ? "danger" : riskScore >= 7 ? "warning" : "#36a64f",
          fields: [
            {
              title: "Event Type",
              value: event.type,
              short: true
            },
            {
              title: "Risk Score",
              value: riskScore.toString(),
              short: true
            },
            {
              title: "Severity",
              value: event.severity,
              short: true
            },
            {
              title: "Tenant ID",
              value: event.tenantId || "N/A",
              short: true
            },
            {
              title: "User ID",
              value: event.userId || "N/A",
              short: true
            },
            {
              title: "IP Address",
              value: event.ipAddress || "N/A",
              short: true
            },
            {
              title: "Details",
              value: JSON.stringify(event.details || {}, null, 2),
              short: false
            }
          ],
          footer: "Security Alert System",
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }

  /**
   * Send an email alert for high-risk events
   */
  private async sendEmailAlert(event: SecurityEvent, riskScore: number): Promise<void> {
    // This is a placeholder - in a real implementation, you would use a proper email service
    console.info('Sending email alert to:', process.env.ALERT_EMAIL);
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    type: "attempt" | "success" | "failure",
    userId: string | null,
    tenantSlug: string | null,
    ipAddress: string,
    userAgent: string,
    details?: Record<string, any>
  ): Promise<void> {
    const severity = type === "failure" ? "medium" : "low";

    await this.logEvent({
      type: `auth_${type}` as SecurityEvent["type"],
      severity,
      userId: userId || undefined,
      ipAddress,
      userAgent,
      resource: "authentication",
      action: tenantSlug || "unknown",
      details,
    });
  }

  /**
   * Log tenant access events
   */
  async logTenantAccess(
    userId: string,
    tenantId: string,
    granted: boolean,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      type: "tenant_access",
      severity: granted ? "low" : "medium",
      userId,
      tenantId,
      ipAddress,
      userAgent,
      resource: "tenant",
      action: granted ? "granted" : "denied",
    });
  }

  /**
   * Log permission denied events
   */
  async logPermissionDenied(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      type: "permission_denied",
      severity: "high",
      userId,
      tenantId,
      ipAddress,
      userAgent,
      resource,
      action,
    });
  }

  /**
   * Log configuration changes
   */
  async logConfigChange(
    userId: string,
    tenantId: string,
    category: string,
    key: string,
    oldValue: any,
    newValue: any,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      type: "config_change",
      severity: "medium",
      userId,
      tenantId,
      ipAddress,
      userAgent,
      resource: "configuration",
      action: `${category}.${key}`,
      details: { oldValue, newValue },
    });
  }

  /**
   * Detect and log suspicious activity
   */
  async logSuspiciousActivity(
    userId: string | null,
    tenantId: string | null,
    activity: string,
    riskFactors: string[],
    ipAddress: string,
    userAgent: string,
    details?: Record<string, any>
  ): Promise<void> {
    const riskScore = riskFactors.length * 2; // Each risk factor adds 2 points

    await this.logEvent({
      type: "suspicious_activity",
      severity: riskScore >= 6 ? "high" : "medium",
      userId: userId || undefined,
      tenantId: tenantId || undefined,
      ipAddress,
      userAgent,
      resource: "system",
      action: activity,
      riskScore,
      details: {
        riskFactors,
        ...details,
      },
    });
  }
}

// Export singleton instance
export const securityLogger = SecurityAuditLogger.getInstance();
