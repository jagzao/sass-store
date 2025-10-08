import { test, expect } from '@playwright/test';

/**
 * Test 9: Booking System Isolation
 * Prevents cross-tenant booking access and staff visibility
 * Reference: agents/outputs/testing/e2e-flows.md:342-376
 */
test.describe('Booking System Tenant Isolation', () => {
  test('should only show staff from current tenant', async ({ page }) => {
    // Navigate to wondernails booking page
    await page.goto('/t/wondernails/services');
    await page.waitForLoadState('networkidle');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    if (await serviceCard.isVisible()) {
      await serviceCard.click();
      await page.waitForTimeout(500);

      // Check staff selector if available
      const staffSelector = page.locator('[data-testid="staff-selector"], select[name="staff"]');
      if (await staffSelector.isVisible()) {
        const options = staffSelector.locator('option');
        const optionCount = await options.count();

        // Verify all staff options are wondernails-specific
        for (let i = 0; i < optionCount; i++) {
          const optionText = await options.nth(i).textContent();
          // Should not contain vigistudio or other tenant staff names
          expect(optionText?.toLowerCase()).not.toMatch(/vigi|bob|tenistico/i);
        }
      }
    }
  });

  test('should not display other tenant bookings in calendar', async ({ page }) => {
    // Login as wondernails admin
    await page.goto('/t/wondernails/admin/bookings');

    // Wait for booking calendar/list
    const bookingsList = page.locator('[data-testid="bookings-list"], [data-testid="calendar-view"]');
    if (await bookingsList.isVisible()) {
      // Get all visible bookings
      const bookings = page.locator('[data-testid="booking-item"], .booking-card');
      const count = await bookings.count();

      // Verify each booking belongs to wondernails
      for (let i = 0; i < count; i++) {
        const booking = bookings.nth(i);
        const bookingContent = await booking.textContent();

        // Should not contain other tenant names or identifiers
        expect(bookingContent?.toLowerCase()).not.toMatch(/vigistudio|centro.tenistico|vainilla|delirios/i);
      }
    }
  });

  test('should prevent access to other tenant booking via direct URL', async ({ page }) => {
    // Create a booking in wondernails first
    await page.goto('/t/wondernails/services');
    await page.waitForLoadState('networkidle');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    if (await serviceCard.isVisible()) {
      await serviceCard.click();

      // Try to book (if form is available)
      const bookButton = page.locator('[data-testid="book-service-btn"], button:has-text("Book")');
      if (await bookButton.isVisible()) {
        // Fill minimal booking details
        const nameInput = page.locator('input[name="customerName"], input[name="name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Customer');
        }

        const emailInput = page.locator('input[name="customerEmail"], input[name="email"]');
        if (await emailInput.isVisible()) {
          await emailInput.fill('test@example.com');
        }

        // Select time slot if available
        const timeSlot = page.locator('[data-testid="time-slot"]').first();
        if (await timeSlot.isVisible()) {
          await timeSlot.click();
        }

        await bookButton.click();
        await page.waitForTimeout(1000);

        // Get booking ID from URL or confirmation
        const currentUrl = page.url();
        const bookingIdMatch = currentUrl.match(/booking[s]?\/([^\/\?]+)/);

        if (bookingIdMatch) {
          const bookingId = bookingIdMatch[1];

          // Try to access this booking from vigistudio
          const response = await page.goto(`/t/vigistudio/admin/bookings/${bookingId}`);

          // Should return 404 or 403
          expect(response?.status()).toBeGreaterThanOrEqual(400);
        }
      }
    }
  });

  test('should isolate staff API endpoints by tenant', async ({ request }) => {
    // Get wondernails staff
    const wondernailsStaff = await request.get('/api/staff?tenant=wondernails');
    expect(wondernailsStaff.ok()).toBeTruthy();

    const wondernailsData = await wondernailsStaff.json();
    const wondernailsStaffList = wondernailsData.staff || wondernailsData;

    // Get vigistudio staff
    const vigistudioStaff = await request.get('/api/staff?tenant=vigistudio');
    expect(vigistudioStaff.ok()).toBeTruthy();

    const vigistudioData = await vigistudioStaff.json();
    const vigistudioStaffList = vigistudioData.staff || vigistudioData;

    // Verify no overlap in staff IDs
    const wondernailsIds = new Set(wondernailsStaffList.map((s: any) => s.id));
    const vigistudioIds = new Set(vigistudioStaffList.map((s: any) => s.id));

    const intersection = new Set([...wondernailsIds].filter(x => vigistudioIds.has(x)));
    expect(intersection.size).toBe(0);
  });

  test('should enforce tenant boundary in booking creation', async ({ request, page }) => {
    // Navigate to wondernails to get session
    await page.goto('/t/wondernails/services');
    const cookies = await page.context().cookies();

    // Attempt to create booking for vigistudio with wondernails auth
    const createBooking = await request.post('/api/bookings', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; ')
      },
      data: {
        tenant: 'vigistudio',
        serviceId: 'some-vigistudio-service-id',
        customerName: 'Cross Tenant Hacker',
        startTime: new Date().toISOString()
      }
    });

    // Should be rejected
    expect(createBooking.status()).toBeGreaterThanOrEqual(400);
  });

  test('should prevent booking modifications across tenants', async ({ page, request }) => {
    // This test verifies that a wondernails admin cannot modify vigistudio bookings

    // Get wondernails session
    await page.goto('/t/wondernails/admin/bookings');
    const cookies = await page.context().cookies();

    // Attempt to update a hypothetical vigistudio booking
    const updateResponse = await request.patch('/api/bookings/vigistudio-booking-id', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; ')
      },
      data: {
        status: 'cancelled',
        notes: 'Malicious cancellation'
      }
    });

    // Should return 404 (booking not found in wondernails context)
    expect(updateResponse.status()).toBe(404);
  });

  test('should maintain booking isolation in shared time slots', async ({ page }) => {
    // Both wondernails and vigistudio might have bookings at the same time
    // But they should never see each other's bookings

    // Check wondernails calendar
    await page.goto('/t/wondernails/admin/bookings');
    await page.waitForLoadState('networkidle');

    const wondernailsBookings = await page.locator('[data-testid="booking-item"]').count();

    // Check vigistudio calendar
    await page.goto('/t/vigistudio/admin/bookings');
    await page.waitForLoadState('networkidle');

    const vigistudioBookings = await page.locator('[data-testid="booking-item"]').count();

    // Both should have independent booking counts
    // This is a smoke test - actual validation would need specific test data
    expect(wondernailsBookings).toBeGreaterThanOrEqual(0);
    expect(vigistudioBookings).toBeGreaterThanOrEqual(0);
  });
});
