/**
 * Role-Based Access Control (RBAC) System
 * Modern implementation for multitenant SaaS
 */

import { eq, and } from "drizzle-orm";
import { db } from "./connection";
import { userRoles, users, tenants } from "./schema";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum Role {
  SUPER_ADMIN = "super_admin", // Global access
  TENANT_ADMIN = "Admin", // Admin of specific tenant
  MANAGER = "Gerente", // Limited management
  STAFF = "Personal", // Basic operations
  CUSTOMER = "Cliente", // Read-only
}

export enum DatabaseRole {
  ADMIN = "Admin",
  GERENTE = "Gerente",
  PERSONAL = "Personal",
  CLIENTE = "Cliente",
}

export enum Permission {
  // Products
  PRODUCTS_CREATE = "products:create",
  PRODUCTS_READ = "products:read",
  PRODUCTS_UPDATE = "products:update",
  PRODUCTS_DELETE = "products:delete",

  // Services
  SERVICES_CREATE = "services:create",
  SERVICES_READ = "services:read",
  SERVICES_UPDATE = "services:update",
  SERVICES_DELETE = "services:delete",

  // Orders
  ORDERS_CREATE = "orders:create",
  ORDERS_READ = "orders:read",
  ORDERS_UPDATE = "orders:update",

  // Users & Roles
  USERS_MANAGE_ROLES = "users:manage_roles",
  USERS_READ = "users:read",

  // Staff
  STAFF_MANAGE = "staff:manage",
  STAFF_READ = "staff:read",

  // Bookings
  BOOKINGS_MANAGE = "bookings:manage",
  BOOKINGS_READ = "bookings:read",

  // Analytics
  ANALYTICS_VIEW = "analytics:view",

  // Tenant Management
  TENANT_UPDATE = "tenant:update",
  TENANT_CONFIGURE = "tenant:configure",
}

export interface UserContext {
  userId: string;
  tenantId?: string;
  role?: Role;
}

// ============================================================================
// ROLE HIERARCHY & PERMISSIONS
// ============================================================================

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.TENANT_ADMIN]: 80,
  [Role.MANAGER]: 60,
  [Role.STAFF]: 40,
  [Role.CUSTOMER]: 20,
};

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),

  [Role.TENANT_ADMIN]: [
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_UPDATE,
    Permission.PRODUCTS_DELETE,
    Permission.SERVICES_CREATE,
    Permission.SERVICES_READ,
    Permission.SERVICES_UPDATE,
    Permission.SERVICES_DELETE,
    Permission.ORDERS_READ,
    Permission.ORDERS_UPDATE,
    Permission.USERS_MANAGE_ROLES,
    Permission.USERS_READ,
    Permission.STAFF_MANAGE,
    Permission.STAFF_READ,
    Permission.BOOKINGS_MANAGE,
    Permission.BOOKINGS_READ,
    Permission.ANALYTICS_VIEW,
    Permission.TENANT_UPDATE,
    Permission.TENANT_CONFIGURE,
  ],

  [Role.MANAGER]: [
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_UPDATE,
    Permission.SERVICES_CREATE,
    Permission.SERVICES_READ,
    Permission.SERVICES_UPDATE,
    Permission.ORDERS_READ,
    Permission.ORDERS_UPDATE,
    Permission.STAFF_READ,
    Permission.BOOKINGS_MANAGE,
    Permission.BOOKINGS_READ,
    Permission.ANALYTICS_VIEW,
  ],

  [Role.STAFF]: [
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_UPDATE,
    Permission.SERVICES_READ,
    Permission.SERVICES_UPDATE,
    Permission.ORDERS_READ,
    Permission.ORDERS_UPDATE,
    Permission.BOOKINGS_MANAGE,
    Permission.BOOKINGS_READ,
  ],

  [Role.CUSTOMER]: [
    Permission.PRODUCTS_READ,
    Permission.SERVICES_READ,
    Permission.ORDERS_READ,
    Permission.BOOKINGS_READ,
  ],
};

// ============================================================================
// CORE RBAC FUNCTIONS
// ============================================================================

/**
 * Get user role for a specific tenant
 */
export async function getUserRole(
  userId: string,
  tenantId?: string
): Promise<Role | null> {
  try {
    // Super admin check (global role) - Note: SUPER_ADMIN not in DB enum
    // For now, check if user has Admin role in a special tenant or use a flag
    // TODO: Implement proper super admin handling
    const [superAdmin] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.role, DatabaseRole.ADMIN)
        )
      )
      .limit(1);

    if (superAdmin) {
      return Role.TENANT_ADMIN; // Map to tenant admin for now
    }

    // Tenant-specific role
    if (tenantId) {
      const [tenantRole] = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(
          and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId))
        )
        .limit(1);

      return (tenantRole?.role as Role) || null;
    }

    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  userId: string,
  permission: Permission,
  tenantId?: string
): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId, tenantId);

    if (!userRole) {
      return false;
    }

    // Super admin has all permissions
    if (userRole === Role.SUPER_ADMIN) {
      return true;
    }

    // Check if role has the permission
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.includes(permission);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Check if user can assign a specific role
 */
export async function canAssignRole(
  assignerId: string,
  targetRole: Role,
  tenantId?: string
): Promise<boolean> {
  try {
    const assignerRole = await getUserRole(assignerId, tenantId);

    if (!assignerRole) {
      return false;
    }

    // Super admin can assign any role
    if (assignerRole === Role.SUPER_ADMIN) {
      return true;
    }

    // Tenant admin can assign roles within their tenant
    if (assignerRole === Role.TENANT_ADMIN && tenantId) {
      // Can assign any role except super admin
      return targetRole !== Role.SUPER_ADMIN;
    }

    // Managers can assign staff and customer roles
    if (assignerRole === Role.MANAGER && tenantId) {
      return [Role.STAFF, Role.CUSTOMER].includes(targetRole);
    }

    return false;
  } catch (error) {
    console.error("Error checking role assignment permission:", error);
    return false;
  }
}

/**
 * Assign role to user
 */
export async function assignUserRole(params: {
  userId: string;
  tenantId: string;
  role: Role;
  assignedBy: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { userId, tenantId, role, assignedBy } = params;

    // Check if assigner has permission
    const canAssign = await canAssignRole(assignedBy, role, tenantId);
    if (!canAssign) {
      return {
        success: false,
        message: "Insufficient permissions to assign this role",
      };
    }

    // Verify user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Verify tenant exists
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return {
        success: false,
        message: "Tenant not found",
      };
    }

    // Assign role
    await db.transaction(async (tx) => {
      const now = new Date();

      await tx
        .insert(userRoles)
        .values({
          userId,
          tenantId,
          role: role as unknown as DatabaseRole, // Cast to database enum
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [userRoles.userId, userRoles.tenantId],
          set: {
            role: role as unknown as DatabaseRole, // Cast to database enum
            updatedAt: now,
          },
        });

      // Log the assignment
      await tx.insert(auditLogs).values({
        tenantId,
        actorId: assignedBy,
        action: "role:assigned",
        targetTable: "user_roles",
        targetId: userId,
        data: {
          assignedRole: role,
          tenantId,
        },
      });
    });

    return {
      success: true,
      message: "Role assigned successfully",
    };
  } catch (error) {
    console.error("Error assigning role:", error);
    return {
      success: false,
      message: "Failed to assign role",
    };
  }
}

/**
 * Get all permissions for a user in a tenant
 */
export async function getUserPermissions(
  userId: string,
  tenantId?: string
): Promise<Permission[]> {
  try {
    const userRole = await getUserRole(userId, tenantId);

    if (!userRole) {
      return [];
    }

    return ROLE_PERMISSIONS[userRole] || [];
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

/**
 * Check role hierarchy (higher number = more permissions)
 */
export function compareRoles(role1: Role, role2: Role): number {
  return ROLE_HIERARCHY[role1] - ROLE_HIERARCHY[role2];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    [Role.SUPER_ADMIN]: "Super Administrador",
    [Role.TENANT_ADMIN]: "Administrador",
    [Role.MANAGER]: "Gerente",
    [Role.STAFF]: "Personal",
    [Role.CUSTOMER]: "Cliente",
  };

  return displayNames[role] || role;
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: Permission) {
  return async function permissionMiddleware(req: any, context: UserContext) {
    const { userId, tenantId } = context;

    const hasPerm = await hasPermission(userId, permission, tenantId);

    if (!hasPerm) {
      throw new PermissionDeniedError(`Missing permission: ${permission}`);
    }

    return { userId, tenantId };
  };
}

/**
 * Middleware to require minimum role level
 */
export function requireRole(minimumRole: Role) {
  return async function roleMiddleware(req: any, context: UserContext) {
    const { userId, tenantId } = context;

    const userRole = await getUserRole(userId, tenantId);

    if (!userRole || compareRoles(userRole, minimumRole) < 0) {
      throw new PermissionDeniedError(
        `Insufficient role level. Required: ${minimumRole}, Got: ${userRole}`
      );
    }

    return { userId, tenantId, role: userRole };
  };
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export class RoleAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoleAssignmentError";
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate role transition
 */
export function isValidRoleTransition(fromRole: Role, toRole: Role): boolean {
  // Prevent demotion of super admin
  if (fromRole === Role.SUPER_ADMIN && toRole !== Role.SUPER_ADMIN) {
    return false;
  }

  // Allow any transition for super admin
  if (fromRole === Role.SUPER_ADMIN) {
    return true;
  }

  // Prevent escalation to super admin
  if (toRole === Role.SUPER_ADMIN) {
    return false;
  }

  return true;
}

/**
 * Get available roles for assignment by current user
 */
export async function getAssignableRoles(
  assignerId: string,
  tenantId?: string
): Promise<Role[]> {
  try {
    const assignerRole = await getUserRole(assignerId, tenantId);

    if (!assignerRole) {
      return [];
    }

    switch (assignerRole) {
      case Role.SUPER_ADMIN:
        return Object.values(Role);

      case Role.TENANT_ADMIN:
        return [Role.TENANT_ADMIN, Role.MANAGER, Role.STAFF, Role.CUSTOMER];

      case Role.MANAGER:
        return [Role.STAFF, Role.CUSTOMER];

      default:
        return [];
    }
  } catch (error) {
    console.error("Error getting assignable roles:", error);
    return [];
  }
}

// Import auditLogs for logging
import { auditLogs } from "./schema";
