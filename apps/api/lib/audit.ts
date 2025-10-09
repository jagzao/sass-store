import { db } from "@sass-store/database";
import { auditLogs } from "@sass-store/database";

export interface AuditLogData {
  tenantId: string;
  actorId?: string;
  action: string;
  targetTable?: string;
  targetId?: string;
  data?: Record<string, any>;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      tenantId: data.tenantId,
      actorId: data.actorId,
      action: data.action,
      targetTable: data.targetTable,
      targetId: data.targetId,
      data: data.data || {},
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error to avoid breaking the main operation
  }
}
