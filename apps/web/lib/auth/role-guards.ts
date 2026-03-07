/**
 * Role Guard Utilities
 * 
 * Centralized role checking utilities for HomeTenant routing.
 * Staff roles (admin, gerente, personal) get the HomeTenant dashboard.
 * Client roles (cliente) and unauthenticated users get the public home.
 */

/**
 * Staff roles that should see the HomeTenant dashboard
 */
export const STAFF_ROLES = ["admin", "gerente", "personal"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * Client roles that should see the public home
 */
export const CLIENT_ROLES = ["cliente"] as const;
export type ClientRole = (typeof CLIENT_ROLES)[number];

/**
 * All valid user roles
 */
export type UserRole = StaffRole | ClientRole | string;

/**
 * Check if a role is a staff role (admin, gerente, personal)
 * Staff roles get access to the HomeTenant dashboard
 */
export function isStaffRole(role: UserRole | null | undefined): role is StaffRole {
  if (!role) return false;
  return STAFF_ROLES.includes(role.toLowerCase() as StaffRole);
}

/**
 * Check if a role is a client role (cliente)
 * Client roles see the public home
 */
export function isClientRole(role: UserRole | null | undefined): role is ClientRole {
  if (!role) return false;
  return CLIENT_ROLES.includes(role.toLowerCase() as ClientRole);
}

/**
 * Check if user should see HomeTenant dashboard
 * Returns true for staff roles (admin, gerente, personal)
 * Returns false for clients, unauthenticated users, or unknown roles
 */
export function shouldShowHomeTenant(role: UserRole | null | undefined): boolean {
  return isStaffRole(role);
}

/**
 * Check if user should see public home
 * Returns true for clients, unauthenticated users, or unknown roles
 * Returns false for staff roles
 */
export function shouldShowPublicHome(role: UserRole | null | undefined): boolean {
  return !isStaffRole(role);
}

/**
 * Normalize role string for comparison
 * Handles case variations and whitespace
 */
export function normalizeRole(role: string | null | undefined): string | null {
  if (!role || role.trim() === '') return null;
  return role.trim().toLowerCase();
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<string, string> = {
    admin: "Administrador",
    gerente: "Gerente",
    personal: "Personal",
    cliente: "Cliente",
  };
  return roleNames[role.toLowerCase()] || role;
}
