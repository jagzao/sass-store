import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetouchMonitorService } from '../../apps/web/lib/home/retouch-monitor-service';
import { db } from '../../apps/web/lib/db';
import { customers, customerVisits, bookings } from '../../apps/web/lib/db/schema';

// Mock the database
vi.mock('../../apps/web/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('RetouchMonitorService', () => {
  const tenantId = 'test-tenant-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingRetouches', () => {
    it('returns an empty array when no customers match criteria', async () => {
      // Mock db.select().from().innerJoin().where().orderBy() chain
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };
      (db.select as any).mockReturnValue(mockQueryBuilder);

      const result = await RetouchMonitorService.getPendingRetouches(tenantId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns eligible customers based on 15-20 day window', async () => {
      const today = new Date();
      const eligibleDate = new Date(today);
      eligibleDate.setDate(today.getDate() - 16); // 16 days ago (eligible)
      
      const notEligibleDate1 = new Date(today);
      notEligibleDate1.setDate(today.getDate() - 10); // 10 days ago (too recent)
      
      const notEligibleDate2 = new Date(today);
      notEligibleDate2.setDate(today.getDate() - 25); // 25 days ago (too old, > 20)

      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([
          { customerId: 'c1', customerName: 'Eligible', customerPhone: '555-1111', visitDate: eligibleDate },
          { customerId: 'c2', customerName: 'Too Recent', customerPhone: '555-2222', visitDate: notEligibleDate1 },
          { customerId: 'c3', customerName: 'Too Old', customerPhone: '555-3333', visitDate: notEligibleDate2 },
        ]),
      };
      (db.select as any).mockReturnValueOnce(mockQueryBuilder);

      // Mock the second query (future bookings) to return empty
      const mockBookingsQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
      (db.select as any).mockReturnValueOnce(mockBookingsQueryBuilder);

      const result = await RetouchMonitorService.getPendingRetouches(tenantId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('c1');
        expect(result.data[0].daysSinceLastVisit).toBe(16);
      }
    });

    it('filters out customers who already have future appointments scheduled', async () => {
      const today = new Date();
      const eligibleDate = new Date(today);
      eligibleDate.setDate(today.getDate() - 18); // 18 days ago (eligible)

      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([
          { customerId: 'c1', customerName: 'Has Future Booking', customerPhone: '555-1111', visitDate: eligibleDate },
          { customerId: 'c2', customerName: 'No Future Booking', customerPhone: '555-2222', visitDate: eligibleDate },
        ]),
      };
      (db.select as any).mockReturnValueOnce(mockQueryBuilder);

      // Mock the second query to return a future booking for 'Has Future Booking'
      const mockBookingsQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { customerName: 'Has Future Booking', customerPhone: '555-1111' }
        ]),
      };
      (db.select as any).mockReturnValueOnce(mockBookingsQueryBuilder);

      const result = await RetouchMonitorService.getPendingRetouches(tenantId);
      
      expect(result.success).toBe(true);
      if (result.success) {
         // Should filter out `c1` who has a future booking matching name/phone.
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('c2');
      }
    });
    
    it('returns Err DomainError when database throws an exception', async () => {
      // Mock db.select() chain to throw an error
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockRejectedValue(new Error('Connection timeout')),
      };
      (db.select as any).mockReturnValue(mockQueryBuilder);

      const result = await RetouchMonitorService.getPendingRetouches(tenantId);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error.type).toBe('DatabaseError');
        expect((result as any).error.message).toContain('Error al calcular retouches pendientes');
      }
    });
  });
});
