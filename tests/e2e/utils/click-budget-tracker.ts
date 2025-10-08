import { Page, Locator } from '@playwright/test';

export type FlowType = 'purchase' | 'booking' | 'navigation' | 'search';

export interface FlowStep {
  action: () => Promise<void>;
  description: string;
  maxClicks: number;
}

export interface FlowResult {
  success: boolean;
  budgetMet: boolean;
  totalClicks: number;
  steps: Array<{
    description: string;
    clicks: number;
    success: boolean;
    maxClicks: number;
  }>;
  report: string;
}

export class ClickBudgetTracker {
  private page: Page;
  private flowType: FlowType;
  private clickCount: number = 0;
  private interactions: Array<{
    element: string;
    action: string;
    timestamp: number;
  }> = [];

  constructor(page: Page, flowType: FlowType) {
    this.page = page;
    this.flowType = flowType;
  }

  public async clickWithBudgetTracking(
    primarySelector: string,
    fallbackSelectors: string[] = [],
    description: string = 'Unknown action'
  ): Promise<boolean> {
    const selectors = [primarySelector, ...fallbackSelectors];

    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector);
        const count = await element.count();

        if (count > 0) {
          const isVisible = await element.first().isVisible();

          if (isVisible) {
            await element.first().click();
            this.clickCount++;
            this.interactions.push({
              element: selector,
              action: 'click',
              timestamp: Date.now()
            });

            console.log(`[BUDGET] Click ${this.clickCount}: ${description} (${selector})`);
            return true;
          }
        }
      } catch (error) {
        console.log(`[BUDGET] Selector failed: ${selector} - ${error}`);
        continue;
      }
    }

    console.log(`[BUDGET] No clickable element found for: ${description}`);
    return false;
  }

  public async waitForStateChange(
    selector: string,
    state: 'visible' | 'hidden' | 'attached' | 'detached' | 'enabled' | 'disabled',
    timeout: number = 5000,
    description: string = 'State change'
  ): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      await element.waitFor({ state, timeout });

      console.log(`[BUDGET] State change successful: ${description}`);
      return true;
    } catch (error) {
      console.log(`[BUDGET] State change timeout: ${description} (${timeout}ms)`);
      return false;
    }
  }

  public async waitForNetworkIdle(timeout: number = 5000): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
      console.log(`[BUDGET] Network idle achieved`);
    } catch (error) {
      console.log(`[BUDGET] Network idle timeout after ${timeout}ms`);
    }
  }

  public getClickCount(): number {
    return this.clickCount;
  }

  public getInteractions(): Array<{
    element: string;
    action: string;
    timestamp: number;
  }> {
    return [...this.interactions];
  }

  public reset(): void {
    this.clickCount = 0;
    this.interactions = [];
  }

  public generateReport(): string {
    const report = [
      `=== Click Budget Report (${this.flowType}) ===`,
      `Total Clicks: ${this.clickCount}`,
      ``,
      `Interactions:`,
      ...this.interactions.map((interaction, index) =>
        `${index + 1}. ${interaction.action.toUpperCase()} on ${interaction.element}`
      ),
      ``,
      `Budget Status: ${this.isWithinBudget() ? '✅ WITHIN BUDGET' : '❌ OVER BUDGET'}`,
      `Expected Max Clicks: ${this.getBudgetForFlow()}`,
      `=======================================`
    ];

    return report.join('\n');
  }

  private getBudgetForFlow(): number {
    const budgets: Record<FlowType, number> = {
      purchase: 4,    // Browse → Select → Add to Cart → Checkout
      booking: 2,     // Select Service → Confirm
      navigation: 3,  // Navigate → Browse → Select
      search: 2       // Search → Select Result
    };

    return budgets[this.flowType] || 3;
  }

  private isWithinBudget(): boolean {
    return this.clickCount <= this.getBudgetForFlow();
  }
}

export async function validateFlowWithClickBudget(
  page: Page,
  flowType: FlowType,
  steps: FlowStep[]
): Promise<FlowResult> {
  const tracker = new ClickBudgetTracker(page, flowType);
  const stepResults: FlowResult['steps'] = [];
  let totalClicks = 0;
  let allStepsSuccessful = true;

  for (const step of steps) {
    const startingClicks = tracker.getClickCount();
    let stepSuccess = false;

    try {
      await step.action();
      stepSuccess = true;
    } catch (error) {
      console.log(`[BUDGET] Step failed: ${step.description} - ${error}`);
      stepSuccess = false;
      allStepsSuccessful = false;
    }

    const endingClicks = tracker.getClickCount();
    const stepClicks = endingClicks - startingClicks;
    totalClicks += stepClicks;

    stepResults.push({
      description: step.description,
      clicks: stepClicks,
      success: stepSuccess,
      maxClicks: step.maxClicks
    });

    // Check if this step exceeded its click budget
    if (stepClicks > step.maxClicks) {
      console.log(`[BUDGET] ❌ Step over budget: ${step.description} (${stepClicks}/${step.maxClicks} clicks)`);
    } else {
      console.log(`[BUDGET] ✅ Step within budget: ${step.description} (${stepClicks}/${step.maxClicks} clicks)`);
    }
  }

  const budgetForFlow = tracker['getBudgetForFlow']();
  const budgetMet = totalClicks <= budgetForFlow;

  const report = [
    `=== Flow Validation Report ===`,
    `Flow Type: ${flowType}`,
    `Total Steps: ${steps.length}`,
    `Total Clicks: ${totalClicks}/${budgetForFlow}`,
    `All Steps Successful: ${allStepsSuccessful ? 'YES' : 'NO'}`,
    `Budget Met: ${budgetMet ? 'YES' : 'NO'}`,
    ``,
    `Step Breakdown:`,
    ...stepResults.map((step, index) =>
      `${index + 1}. ${step.description}: ${step.clicks}/${step.maxClicks} clicks ${step.success ? '✅' : '❌'}`
    ),
    ``,
    `Detailed Interactions:`,
    ...tracker.getInteractions().map((interaction, index) =>
      `${index + 1}. ${interaction.action.toUpperCase()} → ${interaction.element}`
    ),
    `==============================`
  ].join('\n');

  return {
    success: allStepsSuccessful,
    budgetMet,
    totalClicks,
    steps: stepResults,
    report
  };
}