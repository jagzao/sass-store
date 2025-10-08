import { Page } from '@playwright/test';

/**
 * Click Budget Measurement Utility
 * Implements the tracking system specified in the Master Plan
 */
export class ClickBudgetTracker {
  private clickCount = 0;
  private flowStartTime = Date.now();
  private interactions: Array<{
    element: string;
    timestamp: number;
    clickNumber: number;
    elementType: string;
    testId?: string;
  }> = [];

  private budgets = {
    purchase: 3,   // Compra desde Home/PLP: ≤ 3 clics
    booking: 2,    // Reserva desde Home/PLP: ≤ 2 clics
    reorder: 1,    // Reordenar: ≤ 1 clic
    admin: 2       // Admin acciones frecuentes: ≤ 2 clics
  };

  constructor(
    private page: Page,
    private flowType: keyof typeof ClickBudgetTracker.prototype.budgets
  ) {
    this.setupClickTracking();
  }

  private async setupClickTracking() {
    await this.page.addInitScript(() => {
      window.clickBudgetTracker = {
        clicks: 0,
        interactions: [],
        startTime: Date.now()
      };

      // Track all click events
      document.addEventListener('click', (event) => {
        window.clickBudgetTracker.clicks++;

        const target = event.target as HTMLElement;
        const interaction = {
          element: target.tagName.toLowerCase(),
          testId: target.getAttribute('data-testid') || undefined,
          timestamp: Date.now() - window.clickBudgetTracker.startTime,
          clickNumber: window.clickBudgetTracker.clicks,
          elementType: target.type || target.role || 'unknown'
        };

        window.clickBudgetTracker.interactions.push(interaction);

        console.log(`[CLICK-BUDGET] Click ${interaction.clickNumber}: ${interaction.element}${interaction.testId ? `[data-testid="${interaction.testId}"]` : ''} at ${interaction.timestamp}ms`);
      });
    });
  }

  async getClickCount(): Promise<number> {
    return await this.page.evaluate(() => window.clickBudgetTracker?.clicks || 0);
  }

  async getInteractions(): Promise<Array<any>> {
    return await this.page.evaluate(() => window.clickBudgetTracker?.interactions || []);
  }

  async verifyBudget(): Promise<{
    passed: boolean;
    clickCount: number;
    budget: number;
    efficiency: number;
    interactions: Array<any>;
  }> {
    const clickCount = await this.getClickCount();
    const interactions = await this.getInteractions();
    const budget = this.budgets[this.flowType];

    return {
      passed: clickCount <= budget,
      clickCount,
      budget,
      efficiency: clickCount > 0 ? budget / clickCount : 1,
      interactions
    };
  }

  async generateReport(): Promise<string> {
    const result = await this.verifyBudget();
    const duration = Date.now() - this.flowStartTime;

    return `
📊 Click Budget Report - ${this.flowType.toUpperCase()} Flow
==========================================
✅ Budget: ${result.budget} clicks maximum
${result.passed ? '✅' : '❌'} Actual: ${result.clickCount} clicks
${result.passed ? '✅' : '❌'} Status: ${result.passed ? 'PASSED' : 'FAILED'}
📈 Efficiency: ${(result.efficiency * 100).toFixed(1)}%
⏱️  Duration: ${duration}ms

🔍 Interaction Timeline:
${result.interactions.map(i =>
  `${i.clickNumber}. ${i.element}${i.testId ? `[data-testid="${i.testId}"]` : ''} (${i.timestamp}ms)`
).join('\n')}

${result.passed ? '' : `
⚠️  CLICK BUDGET EXCEEDED!
Expected: ≤ ${result.budget} clicks
Actual: ${result.clickCount} clicks
This flow needs optimization to meet UX requirements.
`}
    `;
  }

  /**
   * Self-healing click with automatic retry and selector fallback
   */
  async clickWithBudgetTracking(
    primarySelector: string,
    fallbackSelectors: string[] = [],
    description: string = 'element'
  ): Promise<boolean> {
    const allSelectors = [primarySelector, ...fallbackSelectors];

    for (const selector of allSelectors) {
      try {
        const element = this.page.locator(selector);

        // Wait for element with reasonable timeout
        await element.waitFor({
          state: 'visible',
          timeout: 5000
        });

        // Verify element is enabled
        const isEnabled = await element.isEnabled();
        if (!isEnabled) {
          console.warn(`[CLICK-BUDGET] Element ${selector} is disabled, trying next selector`);
          continue;
        }

        // Perform click
        await element.click();

        console.log(`[CLICK-BUDGET] Successfully clicked ${description} using selector: ${selector}`);
        return true;

      } catch (error) {
        console.warn(`[CLICK-BUDGET] Failed to click ${selector}: ${error}`);

        // If this was the primary selector and we have fallbacks, continue
        if (selector === primarySelector && fallbackSelectors.length > 0) {
          console.log(`[CLICK-BUDGET] Trying fallback selectors for ${description}`);
          continue;
        }
      }
    }

    // All selectors failed
    console.error(`[CLICK-BUDGET] FAILED: Could not click ${description} with any selector`);
    return false;
  }

  /**
   * Wait for state change without arbitrary sleeps (self-healing requirement)
   */
  async waitForStateChange(
    selector: string,
    expectedState: 'visible' | 'hidden' | 'enabled' | 'disabled',
    timeout: number = 5000,
    description: string = 'state change'
  ): Promise<boolean> {
    try {
      const element = this.page.locator(selector);

      switch (expectedState) {
        case 'visible':
          await element.waitFor({ state: 'visible', timeout });
          break;
        case 'hidden':
          await element.waitFor({ state: 'hidden', timeout });
          break;
        case 'enabled':
          await element.waitFor({ state: 'attached', timeout });
          await this.page.waitForFunction(
            (sel) => {
              const el = document.querySelector(sel);
              return el && !el.hasAttribute('disabled');
            },
            selector,
            { timeout }
          );
          break;
        case 'disabled':
          await this.page.waitForFunction(
            (sel) => {
              const el = document.querySelector(sel);
              return el && el.hasAttribute('disabled');
            },
            selector,
            { timeout }
          );
          break;
      }

      console.log(`[CLICK-BUDGET] ✅ State change verified: ${description} is ${expectedState}`);
      return true;

    } catch (error) {
      console.error(`[CLICK-BUDGET] ❌ State change timeout: ${description} did not become ${expectedState} within ${timeout}ms`);
      return false;
    }
  }

  /**
   * Network idle wait for dynamic content loading
   */
  async waitForNetworkIdle(timeout: number = 5000): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
      console.log(`[CLICK-BUDGET] ✅ Network idle achieved`);
    } catch (error) {
      console.warn(`[CLICK-BUDGET] ⚠️ Network idle timeout after ${timeout}ms, continuing...`);
    }
  }
}

// Extend global window interface for TypeScript
declare global {
  interface Window {
    clickBudgetTracker?: {
      clicks: number;
      interactions: Array<any>;
      startTime: number;
    };
  }
}

/**
 * Factory function to create click budget trackers for different flows
 */
export const createClickBudgetTracker = {
  purchase: (page: Page) => new ClickBudgetTracker(page, 'purchase'),
  booking: (page: Page) => new ClickBudgetTracker(page, 'booking'),
  reorder: (page: Page) => new ClickBudgetTracker(page, 'reorder'),
  admin: (page: Page) => new ClickBudgetTracker(page, 'admin')
};

/**
 * Test helper for validating critical user flows with click budgets
 */
export async function validateFlowWithClickBudget(
  page: Page,
  flowType: 'purchase' | 'booking' | 'reorder' | 'admin',
  testSteps: Array<{
    action: () => Promise<void>;
    description: string;
    maxClicks?: number;
  }>
): Promise<{
  success: boolean;
  report: string;
  budgetMet: boolean;
}> {
  const tracker = new ClickBudgetTracker(page, flowType);
  let success = true;
  let stepResults: string[] = [];

  try {
    for (const [index, step] of testSteps.entries()) {
      console.log(`[FLOW-VALIDATION] Step ${index + 1}: ${step.description}`);

      const clicksBefore = await tracker.getClickCount();
      await step.action();
      const clicksAfter = await tracker.getClickCount();
      const stepClicks = clicksAfter - clicksBefore;

      stepResults.push(`Step ${index + 1}: ${step.description} (${stepClicks} clicks)`);

      // Check individual step click limit if specified
      if (step.maxClicks && stepClicks > step.maxClicks) {
        stepResults.push(`  ⚠️ Step exceeded individual limit: ${stepClicks}/${step.maxClicks}`);
      }
    }

    const result = await tracker.verifyBudget();
    const report = await tracker.generateReport();

    return {
      success: success && result.passed,
      report: report + '\n\nStep Details:\n' + stepResults.join('\n'),
      budgetMet: result.passed
    };

  } catch (error) {
    const report = await tracker.generateReport();
    return {
      success: false,
      report: report + `\n\n❌ Flow failed with error: ${error}`,
      budgetMet: false
    };
  }
}