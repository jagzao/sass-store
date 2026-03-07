import {
  STAFF_ROLES,
  CLIENT_ROLES,
  isStaffRole,
  isClientRole,
} from '../../../apps/web/lib/auth/role-guards';

describe('Role Guard Utilities - Simple Test', () => {
  it('should have correct staff role definitions', () => {
    expect(STAFF_ROLES).toEqual(['admin', 'gerente', 'personal']);
  });

  it('should have correct client role definitions', () => {
    expect(CLIENT_ROLES).toEqual(['cliente']);
  });

  it('should return true for valid staff roles', () => {
    expect(isStaffRole('admin')).toBe(true);
    expect(isStaffRole('gerente')).toBe(true);
    expect(isStaffRole('personal')).toBe(true);
  });

  it('should return false for client roles', () => {
    expect(isStaffRole('cliente')).toBe(false);
  });

  it('should return true for valid client roles', () => {
    expect(isClientRole('cliente')).toBe(true);
  });

  it('should return false for staff roles', () => {
    expect(isClientRole('admin')).toBe(false);
    expect(isClientRole('gerente')).toBe(false);
    expect(isClientRole('personal')).toBe(false);
  });
});