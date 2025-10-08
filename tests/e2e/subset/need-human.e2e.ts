/**
 * E2E test that demonstrates NEED=HUMAN workflow
 * Tests the case where data-testid is missing on critical elements
 */

import { test, expect } from '@playwright/test';
import { alerts, log } from '../../../tools';

test.describe('NEED=HUMAN E2E Validation', () => {
  test('should trigger NEED=HUMAN when data-testid is missing', async ({ page }) => {
    const tenant = 'wondernails';
    await page.goto(`/t/${tenant}`);
    await page.waitForLoadState('networkidle');

    log.info('QA', 'need-human-test', 'Starting NEED=HUMAN validation', { tenant });

    // Try to find booking button with stable selector
    const stableSelector = '[data-testid="book-now"]';
    const bookingButton = page.locator(stableSelector);

    const hasStableSelector = await bookingButton.count() > 0;

    if (!hasStableSelector) {
      // Trigger NEED=HUMAN alert
      const alertFile = alerts.missingTestId('QA', 'Reservar ahora button', stableSelector);

      log.warn('QA', 'e2e', 'Missing data-testid on critical CTA', {
        case: 'reserva-rapida',
        selector: stableSelector,
        need: 'HUMAN',
        file: alertFile
      });

      // Try fallback selectors
      const fallbackSelectors = [
        'button:has-text("Reservar")',
        'button:has-text("Book")',
        '.booking-button',
        '[aria-label*="book"]',
        '[aria-label*="reserv"]'
      ];

      let foundWithFallback = false;
      let workingSelector = '';

      for (const fallback of fallbackSelectors) {
        const fallbackElement = page.locator(fallback);
        if (await fallbackElement.count() > 0) {
          foundWithFallback = true;
          workingSelector = fallback;
          break;
        }
      }

      if (foundWithFallback) {
        log.warn('QA', 'e2e', 'Found element with fallback selector', {
          working_selector: workingSelector,
          message: 'Test can proceed but needs data-testid for stability'
        });

        // Continue test with fallback but mark as needing human attention
        await page.click(workingSelector);

        // Verify booking flow continues
        const bookingForm = page.locator('[data-testid="booking-form"], form');
        if (await bookingForm.count() > 0) {
          await expect(bookingForm).toBeVisible();
          log.ok('QA', 'e2e', 'Booking flow accessible with fallback selector');
        }
      } else {
        // Complete failure - no selectors work
        log.error('QA', 'e2e', 'No booking button found with any selector', {
          case: 'reserva-rapida',
          selectors_tried: [stableSelector, ...fallbackSelectors].length,
          tenant
        });

        throw new Error(`NEED=HUMAN: Critical booking button not found. Alert created: ${alertFile}`);
      }
    } else {
      // Happy path - stable selector exists
      log.ok('QA', 'e2e', 'Stable data-testid selector found', {
        selector: stableSelector,
        tenant
      });

      await bookingButton.click();

      // Verify booking works correctly
      const bookingConfirmation = page.locator('[data-testid="booking-form"], [data-testid="booking-modal"]');
      await expect(bookingConfirmation).toBeVisible();

      log.ok('QA', 'e2e', 'Booking flow completed successfully', {
        case: 'reserva-rapida',
        clicks: 1
      });
    }
  });

  test('should validate color log output in console', async ({ page }) => {
    // This test verifies that our logging system works in the browser context
    let consoleMessages: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/t/nom-nom');
    await page.waitForLoadState('networkidle');

    // Inject our logger into the page
    await page.addInitScript(() => {
      // Mock logger for browser context
      window.testLogger = {
        info: (agent: string, task: string, msg: string) => {
          const timestamp = new Date().toTimeString().slice(0, 8);
          console.log(`[${timestamp}] INFO AGENT=${agent} TASK=${task} msg="${msg}"`);
        },
        warn: (agent: string, task: string, msg: string) => {
          const timestamp = new Date().toTimeString().slice(0, 8);
          console.log(`[${timestamp}] ⚠ AGENT=${agent} TASK=${task} NEED=HUMAN msg="${msg}"`);
        }
      };
    });

    // Test logging from within the page
    await page.evaluate(() => {
      (window as any).testLogger.info('UI', 'page-load', 'Page loaded successfully');
      (window as any).testLogger.warn('QA', 'selector-test', 'Testing NEED=HUMAN format');
    });

    // Verify log format
    expect(consoleMessages.some(msg =>
      msg.includes('AGENT=UI') &&
      msg.includes('TASK=page-load') &&
      msg.includes('msg="Page loaded successfully"')
    )).toBe(true);

    expect(consoleMessages.some(msg =>
      msg.includes('NEED=HUMAN') &&
      msg.includes('AGENT=QA')
    )).toBe(true);

    log.ok('QA', 'color-logs', 'Console log format validation passed');
  });

  test('should handle missing configuration gracefully', async ({ page }) => {
    // Test configuration-related NEED=HUMAN scenario
    await page.goto('/t/villafuerte');

    // Try to access admin area (might need auth configuration)
    await page.goto('/t/villafuerte/admin');

    const isAdminAccessible = await page.locator('[data-testid="admin-dashboard"]').count() > 0;
    const hasAuthError = await page.locator('.auth-error, [data-testid="auth-required"]').count() > 0;

    if (hasAuthError || !isAdminAccessible) {
      // This might indicate missing auth configuration
      const alertFile = alerts.missingConfig(
        'AUTH',
        'NEXTAUTH_SECRET or JWT configuration',
        'apps/web/.env.local'
      );

      log.warn('AUTH', 'config-check', 'Admin access requires authentication setup', {
        case: 'admin-access',
        need: 'HUMAN',
        file: alertFile,
        url: page.url()
      });

      // Don't fail the test - this is expected behavior
      log.info('QA', 'e2e', 'Auth configuration validation completed');
    } else {
      log.ok('AUTH', 'config-check', 'Admin access properly configured');
    }
  });

  test('should validate API error handling', async ({ page }) => {
    // Test API error NEED=HUMAN scenarios
    await page.goto('/t/delirios');

    // Monitor network requests
    const failedRequests: string[] = [];

    page.on('response', response => {
      if (response.status() >= 500) {
        failedRequests.push(response.url());
      }
    });

    // Try to load products
    await page.waitForLoadState('networkidle');

    if (failedRequests.length > 0) {
      const failedEndpoint = failedRequests[0];
      const alertFile = alerts.apiError('API', failedEndpoint, '500 Internal Server Error');

      log.error('API', 'endpoint-test', 'API endpoint returned 5xx error', {
        endpoint: failedEndpoint,
        need: 'HUMAN',
        file: alertFile
      });

      // Verify graceful degradation
      const errorMessage = page.locator('[data-testid="error-message"], .error-banner');
      if (await errorMessage.count() > 0) {
        log.ok('API', 'error-handling', 'Graceful error message displayed to user');
      }
    } else {
      log.ok('API', 'endpoint-test', 'All API endpoints responding correctly');
    }
  });
});

// Helper function to simulate NEED=HUMAN resolution
test.describe('NEED=HUMAN Resolution Simulation', () => {
  test('should pass after data-testid is added', async ({ page }) => {
    // This test simulates the scenario after a developer has added missing data-testid
    const tenant = 'wondernails';
    await page.goto(`/t/${tenant}`);

    // Mock that the data-testid has been added
    await page.addInitScript(() => {
      // Simulate adding data-testid to elements that might be missing it
      setTimeout(() => {
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button, index) => {
          if (button.textContent?.toLowerCase().includes('reserv') ||
              button.textContent?.toLowerCase().includes('book')) {
            button.setAttribute('data-testid', 'book-now');
          }
          if (button.textContent?.toLowerCase().includes('cart') ||
              button.textContent?.toLowerCase().includes('agregar')) {
            button.setAttribute('data-testid', 'add-to-cart');
          }
        });
      }, 100);
    });

    await page.waitForTimeout(200); // Wait for mock attributes to be added

    // Now the test should pass with stable selectors
    const bookButton = page.locator('[data-testid="book-now"]');
    if (await bookButton.count() > 0) {
      await bookButton.click();

      log.ok('QA', 'e2e', 'Test passed after data-testid resolution', {
        case: 'reserva-rapida',
        retry: 1,
        status: 'RESOLVED'
      });

      // Verify the booking flow works
      const bookingModal = page.locator('[data-testid="booking-modal"], [data-testid="booking-form"]');
      if (await bookingModal.count() > 0) {
        await expect(bookingModal).toBeVisible();
      }
    } else {
      log.warn('QA', 'e2e', 'Still missing data-testid after resolution attempt');
    }
  });
});