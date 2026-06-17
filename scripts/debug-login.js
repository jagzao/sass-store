const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const tenantSlug = process.env.TEST_TENANT_SLUG || "wondernails";
  const url = `http://localhost:3001/t/${tenantSlug}/login`;
  console.log(`Navigating to ${url}`);
  
  await page.goto(url);
  await page.waitForTimeout(5000); // Wait for potential hydration

  console.log('Page Title:', await page.title());
  console.log('Page Content:', await page.content());
  
  await browser.close();
})();
