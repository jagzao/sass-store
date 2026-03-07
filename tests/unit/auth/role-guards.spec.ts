import {
  STAFF_ROLES,
  CLIENT_ROLES,
  StaffRole,
  ClientRole,
  UserRole,
  isStaffRole,
  isClientRole,
  shouldShowHomeTenant,
  shouldShowPublicHome,
  normalizeRole,
  getRoleDisplayName,
} from '../../../apps/web/lib/auth/role-guards';

describe('Role Guard Utilities', () => {
  describe('Role Type Definitions', () => {
    it('should have correct staff role definitions', () => {
      expect(STAFF_ROLES).toEqual(['admin', 'gerente', 'personal']);
    });

    it('should have correct client role definitions', () => {
      expect(CLIENT_ROLES).toEqual(['cliente']);
    });

    it('should accept valid staff roles', () => {
      const validStaffRoles: StaffRole[] = ['admin', 'gerente', 'personal'];
      validStaffRoles.forEach(role => {
        expect(STAFF_ROLES).toContain(role);
      });
    });

    it('should accept valid client roles', () => {
      const validClientRoles: ClientRole[] = ['cliente'];
      validClientRoles.forEach(role => {
        expect(CLIENT_ROLES).toContain(role);
      });
    });
  });

  describe('isStaffRole', () => {
    it('should return true for valid staff roles', () => {
      const staffRoles = ['admin', 'gerente', 'personal'];
      staffRoles.forEach(role => {
        expect(isStaffRole(role)).toBe(true);
      });
    });

    it('should return false for client roles', () => {
      expect(isStaffRole('cliente')).toBe(false);
    });

    it('should return false for unknown roles', () => {
      expect(isStaffRole('unknown')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isStaffRole(null)).toBe(false);
      expect(isStaffRole(undefined)).toBe(false);
    });

    it('should handle case insensitive matching', () => {
      expect(isStaffRole('ADMIN')).toBe(true);
      expect(isStaffRole('Admin')).toBe(true);
      expect(isStaffRole('GERENTE')).toBe(true);
      expect(isStaffRole('Gerente')).toBe(true);
      expect(isStaffRole('PERSONAL')).toBe(true);
      expect(isStaffRole('Personal')).toBe(true);
    });
  });

  describe('isClientRole', () => {
    it('should return true for valid client roles', () => {
      expect(isClientRole('cliente')).toBe(true);
    });

    it('should return false for staff roles', () => {
      const staffRoles = ['admin', 'gerente', 'personal'];
      staffRoles.forEach(role => {
        expect(isClientRole(role)).toBe(false);
      });
    });

    it('should return false for unknown roles', () => {
      expect(isClientRole('unknown')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isClientRole(null)).toBe(false);
      expect(isClientRole(undefined)).toBe(false);
    });

    it('should handle case insensitive matching', () => {
      expect(isClientRole('CLIENTE')).toBe(true);
      expect(isClientRole('Cliente')).toBe(true);
    });
  });

  describe('shouldShowHomeTenant', () => {
    it('should return true for staff roles', () => {
      const staffRoles = ['admin', 'gerente', 'personal'];
      staffRoles.forEach(role => {
        expect(shouldShowHomeTenant(role)).toBe(true);
      });
    });

    it('should return false for client roles', () => {
      expect(shouldShowHomeTenant('cliente')).toBe(false);
    });

    it('should return false for unknown roles', () => {
      expect(shouldShowHomeTenant('unknown')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(shouldShowHomeTenant(null)).toBe(false);
      expect(shouldShowHomeTenant(undefined)).toBe(false);
    });
  });

  describe('shouldShowPublicHome', () => {
    it('should return false for staff roles', () => {
      const staffRoles = ['admin', 'gerente', 'personal'];
      staffRoles.forEach(role => {
        expect(shouldShowPublicHome(role)).toBe(false);
      });
    });

    it('should return true for client roles', () => {
      expect(shouldShowPublicHome('cliente')).toBe(true);
    });

    it('should return true for unknown roles', () => {
      expect(shouldShowPublicHome('unknown')).toBe(true);
    });

    it('should return true for null/undefined', () => {
      expect(shouldShowPublicHome(null)).toBe(true);
      expect(shouldShowPublicHome(undefined)).toBe(true);
    });
  });

  describe('normalizeRole', () => {
    it('should convert to lowercase', () => {
      expect(normalizeRole('ADMIN')).toBe('admin');
      expect(normalizeRole('Cliente')).toBe('cliente');
      expect(normalizeRole('GeRenTe')).toBe('gerente');
    });

    it('should trim whitespace', () => {
      expect(normalizeRole(' admin ')).toBe('admin');
      expect(normalizeRole('  cliente  ')).toBe('cliente');
    });

    it('should return null for empty string', () => {
      expect(normalizeRole('')).toBe(null);
      expect(normalizeRole('   ')).toBe(null);
    });

    it('should return null for null/undefined', () => {
      expect(normalizeRole(null)).toBe(null);
      expect(normalizeRole(undefined)).toBe(null);
    });

    it('should handle mixed case and whitespace', () => {
      expect(normalizeRole('  ADMIN  ')).toBe('admin');
      expect(normalizeRole('  Cliente  ')).toBe('cliente');
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return correct display names for known roles', () => {
      expect(getRoleDisplayName('admin')).toBe('Administrador');
      expect(getRoleDisplayName('gerente')).toBe('Gerente');
      expect(getRoleDisplayName('personal')).toBe('Personal');
      expect(getRoleDisplayName('cliente')).toBe('Cliente');
    });

    it('should handle case insensitive input', () => {
      expect(getRoleDisplayName('ADMIN')).toBe('Administrador');
      expect(getRoleDisplayName('CLIENTE')).toBe('Cliente');
      expect(getRoleDisplayName('Gerente')).toBe('Gerente');
    });

    it('should return original role for unknown roles', () => {
      expect(getRoleDisplayName('unknown')).toBe('unknown');
      expect(getRoleDisplayName('guest')).toBe('guest');
    });

    it('should handle empty string', () => {
      expect(getRoleDisplayName('')).toBe('');
    });
  });

  describe('Role-Based Routing Logic', () => {
    it('should have complementary routing functions', () => {
      const testRoles = ['admin', 'gerente', 'personal', 'cliente', 'unknown', null, undefined];
      
      testRoles.forEach(role => {
        const showHomeTenant = shouldShowHomeTenant(role);
        const showPublicHome = shouldShowPublicHome(role);
        
        // For any role, exactly one of these should be true
        expect(showHomeTenant !== showPublicHome).toBe(true);
      });
    });

    it('should correctly route staff roles to HomeTenant', () => {
      const staffRoles: StaffRole[] = ['admin', 'gerente', 'personal'];
      
      staffRoles.forEach(role => {
        expect(shouldShowHomeTenant(role)).toBe(true);
        expect(shouldShowPublicHome(role)).toBe(false);
      });
    });

    it('should correctly route client roles to public home', () => {
      expect(shouldShowHomeTenant('cliente')).toBe(false);
      expect(shouldShowPublicHome('cliente')).toBe(true);
    });

    it('should correctly route unknown/unauthenticated to public home', () => {
      const unknownRoles = [null, undefined, 'unknown', 'guest'];
      
      unknownRoles.forEach(role => {
        expect(shouldShowHomeTenant(role)).toBe(false);
        expect(shouldShowPublicHome(role)).toBe(true);
      });
    });
  });
});