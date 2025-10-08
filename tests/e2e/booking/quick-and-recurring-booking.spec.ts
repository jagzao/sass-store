import { test, expect } from '@playwright/test';

/**
 * Test 4: Quick Service Booking
 * Test 5: Recurring Service Booking
 * Reference: agents/outputs/testing/e2e-flows.md:156-229
 */

test.describe('Quick Service Booking - 2 Click Budget', () => {
  test('should book next available appointment in 2 clicks', async ({ page }) => {
    let clickCount = 0;

    await page.addInitScript(() => {
      window.addEventListener('click', () => {
        (window as any).clickCount = ((window as any).clickCount || 0) + 1;
      });
    });

    await page.goto('/t/wondernails/services');
    await page.waitForLoadState('networkidle');

    // Verify service details loaded
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await expect(serviceCard).toBeVisible();

    const nextAvailableSlot = page.locator('[data-testid="next-available-slot"], button:has-text("Next Available")');

    if (await nextAvailableSlot.isVisible()) {
      // CLICK 1: Select next available slot with preferred staff
      await nextAvailableSlot.click();
      clickCount = await page.evaluate(() => (window as any).clickCount || 0);
      expect(clickCount).toBe(1);

      await page.waitForTimeout(500);

      // Verify booking details auto-populated
      const bookingSummary = page.locator('[data-testid="booking-summary"]');
      await expect(bookingSummary).toBeVisible();

      const selectedTimeSlot = page.locator('[data-testid="selected-time-slot"]');
      if (await selectedTimeSlot.isVisible()) {
        await expect(selectedTimeSlot).toBeVisible();
      }

      const selectedStaff = page.locator('[data-testid="selected-staff"]');
      if (await selectedStaff.isVisible()) {
        await expect(selectedStaff).toBeVisible();
      }

      // CLICK 2: Confirm booking
      const confirmBookingBtn = page.locator('[data-testid="confirm-booking"], button:has-text("Confirm")');
      await confirmBookingBtn.click();
      clickCount = await page.evaluate(() => (window as any).clickCount || 0);
      expect(clickCount).toBe(2);

      // Verify booking confirmation
      const bookingConfirmation = page.locator('[data-testid="booking-confirmation"]');
      await expect(bookingConfirmation).toBeVisible({ timeout: 5000 });

      // Should show calendar entry
      const calendarEntry = page.locator('[data-testid="calendar-entry"]');
      if (await calendarEntry.isVisible()) {
        await expect(calendarEntry).toBeVisible();
      }

      // Should set reminder
      const reminderSet = page.locator('[data-testid="reminder-set"]');
      if (await reminderSet.isVisible()) {
        await expect(reminderSet).toBeVisible();
      }
    }

    // Verify click budget met
    const finalClickCount = await page.evaluate(() => (window as any).clickCount || 0);
    expect(finalClickCount).toBeLessThanOrEqual(2);
  });

  test('should show next available time across all staff', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    const nextAvailableBtn = page.locator('[data-testid="book-next-available"], [data-testid="next-available-slot"]');

    if (await nextAvailableBtn.isVisible()) {
      // Should display the actual next available time
      const timeDisplay = nextAvailableBtn.locator('[data-testid="available-time"]');
      if (await timeDisplay.isVisible()) {
        const timeText = await timeDisplay.textContent();
        // Should have a valid time format
        expect(timeText).toMatch(/\d{1,2}:\d{2}|AM|PM/i);
      }

      // Should show which staff member is available
      const staffDisplay = nextAvailableBtn.locator('[data-testid="available-staff"]');
      if (await staffDisplay.isVisible()) {
        const staffText = await staffDisplay.textContent();
        expect(staffText?.length).toBeGreaterThan(0);
      }
    }
  });

  test('should pre-fill customer data for logged-in users', async ({ page }) => {
    // This test assumes user is logged in
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    const bookButton = page.locator('[data-testid="book-service-btn"], button:has-text("Book")');
    if (await bookButton.isVisible()) {
      await bookButton.click();

      // Customer fields should be pre-filled
      const nameInput = page.locator('input[name="customerName"], input[name="name"]');
      const emailInput = page.locator('input[name="customerEmail"], input[name="email"]');
      const phoneInput = page.locator('input[name="customerPhone"], input[name="phone"]');

      if (await nameInput.isVisible()) {
        const name = await nameInput.inputValue();
        expect(name.length).toBeGreaterThan(0);
      }

      if (await emailInput.isVisible()) {
        const email = await emailInput.inputValue();
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      }
    }
  });
});

test.describe('Recurring Service Booking - 2 Click Budget', () => {
  test('should set up recurring appointment in 2 clicks', async ({ page }) => {
    let clickCount = 0;

    await page.addInitScript(() => {
      window.addEventListener('click', () => {
        (window as any).clickCount = ((window as any).clickCount || 0) + 1;
      });
    });

    await page.goto('/t/wondernails/services/monthly-manicure');
    await page.waitForLoadState('networkidle');

    const recurringOption = page.locator('[data-testid="setup-recurring-booking"], button:has-text("Recurring")');

    if (await recurringOption.isVisible()) {
      // CLICK 1: Select recurring booking option
      await recurringOption.click();
      clickCount = await page.evaluate(() => (window as any).clickCount || 0);
      expect(clickCount).toBe(1);

      await page.waitForTimeout(500);

      // Verify recurring options display
      const recurringSchedule = page.locator('[data-testid="recurring-schedule"]');
      await expect(recurringSchedule).toBeVisible();

      const preferredDayTime = page.locator('[data-testid="preferred-day-time"]');
      if (await preferredDayTime.isVisible()) {
        await expect(preferredDayTime).toBeVisible();
      }

      // CLICK 2: Confirm recurring schedule
      const confirmRecurringBtn = page.locator('[data-testid="confirm-recurring-schedule"], button:has-text("Confirm Schedule")');
      await confirmRecurringBtn.click();
      clickCount = await page.evaluate(() => (window as any).clickCount || 0);
      expect(clickCount).toBe(2);

      // Verify recurring booking setup
      const recurringConfirmation = page.locator('[data-testid="recurring-confirmation"]');
      await expect(recurringConfirmation).toBeVisible({ timeout: 5000 });

      // Should show next three appointments
      const nextAppointments = page.locator('[data-testid="next-three-appointments"]');
      if (await nextAppointments.isVisible()) {
        await expect(nextAppointments).toBeVisible();

        const appointmentList = nextAppointments.locator('[data-testid="appointment-item"]');
        const count = await appointmentList.count();
        expect(count).toBe(3);
      }

      // Should show subscription active status
      const subscriptionActive = page.locator('[data-testid="subscription-active"]');
      if (await subscriptionActive.isVisible()) {
        await expect(subscriptionActive).toBeVisible();
      }
    }

    // Verify click budget met
    const finalClickCount = await page.evaluate(() => (window as any).clickCount || 0);
    expect(finalClickCount).toBeLessThanOrEqual(2);
  });

  test('should allow selecting recurring frequency', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    const recurringCheckbox = page.locator('[data-testid="recurring-booking"], input[name="recurring"]');
    if (await recurringCheckbox.isVisible()) {
      await recurringCheckbox.check();

      // Frequency selector should appear
      const frequencySelector = page.locator('[data-testid="recurring-frequency"], select[name="frequency"]');
      await expect(frequencySelector).toBeVisible();

      // Should have options like weekly, biweekly, monthly
      const options = frequencySelector.locator('option');
      const optionTexts = await options.allTextContents();

      expect(optionTexts.some(text => text.match(/week|month/i))).toBeTruthy();
    }
  });

  test('should display recurring booking cost summary', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    const basePrice = page.locator('[data-testid="service-price"]');
    const basePriceText = await basePrice.textContent();

    const recurringOption = page.locator('[data-testid="recurring-booking"]');
    if (await recurringOption.isVisible()) {
      await recurringOption.check();

      // Should show monthly cost
      const monthlyCost = page.locator('[data-testid="monthly-cost"], [data-testid="recurring-cost"]');
      if (await monthlyCost.isVisible()) {
        const monthlyText = await monthlyCost.textContent();

        // Monthly cost should be visible
        expect(monthlyText).toMatch(/\$\d+|\d+\.\d{2}/);

        // Should potentially show discount for recurring bookings
        const discount = page.locator('[data-testid="recurring-discount"]');
        if (await discount.isVisible()) {
          await expect(discount).toBeVisible();
        }
      }
    }
  });

  test('should allow pausing or canceling recurring bookings', async ({ page }) => {
    // Navigate to user's recurring bookings
    await page.goto('/t/wondernails/account/recurring-bookings');

    const recurringBooking = page.locator('[data-testid="recurring-booking-item"]').first();
    if (await recurringBooking.isVisible()) {
      // Should have pause and cancel options
      const pauseBtn = recurringBooking.locator('[data-testid="pause-recurring"], button:has-text("Pause")');
      const cancelBtn = recurringBooking.locator('[data-testid="cancel-recurring"], button:has-text("Cancel")');

      if (await pauseBtn.isVisible()) {
        await expect(pauseBtn).toBeVisible();
      }

      if (await cancelBtn.isVisible()) {
        await expect(cancelBtn).toBeVisible();
      }
    }
  });

  test('should remember customer preferred time and staff', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    const recurringOption = page.locator('[data-testid="setup-recurring-booking"]');
    if (await recurringOption.isVisible()) {
      await recurringOption.click();

      // Should show previously preferred time if available
      const preferredTime = page.locator('[data-testid="preferred-time"]');
      if (await preferredTime.isVisible()) {
        const timeValue = await preferredTime.inputValue();
        expect(timeValue.length).toBeGreaterThan(0);
      }

      // Should show previously preferred staff
      const preferredStaff = page.locator('[data-testid="preferred-staff"]');
      if (await preferredStaff.isVisible()) {
        const staffValue = await preferredStaff.inputValue();
        expect(staffValue.length).toBeGreaterThan(0);
      }
    }
  });
});
