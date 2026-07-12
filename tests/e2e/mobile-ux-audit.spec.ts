import { test, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

test.use({
  viewport: { width: 375, height: 812 },
  video: "on",
  screenshot: "on",
});

const TENANT = "wondernails";
const ISSUES: string[] = [];
const SHOT_DIR = "test-results/mobile-ux";

function ensureDir(d: string) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

async function audit(
  page: Page,
  name: string,
  url: string,
  loginFirst = false,
) {
  ensureDir(SHOT_DIR);
  const msgs: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") msgs.push(m.text().substring(0, 150));
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Horizontal scroll check
    const hScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 5,
    );
    if (hScroll) ISSUES.push(`${name}: horizontal scroll`);

    // Tiny text check
    const tinyTexts = await page.evaluate(() => {
      const els = document.querySelectorAll("span, p, div, button, a");
      let count = 0;
      els.forEach((el) => {
        const fs = window.getComputedStyle(el).fontSize;
        if (
          parseFloat(fs) < 11 &&
          el.textContent &&
          el.textContent.trim().length > 5
        )
          count++;
      });
      return count;
    });
    if (tinyTexts > 5)
      ISSUES.push(`${name}: ${tinyTexts} elementos con texto < 11px`);

    // Emoji usage (should use SVG icons)
    const emojis = await page.evaluate(() => {
      const text = document.body.innerText;
      const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
      return (text.match(emojiRegex) || []).length;
    });
    if (emojis > 3)
      ISSUES.push(`${name}: ${emojis} emojis en texto (usar iconos SVG)`);

    // Overflow hidden check
    const hasOverflowHidden = await page.evaluate(() => {
      const nav = document.querySelector("nav");
      if (!nav) return false;
      return window.getComputedStyle(nav).overflowX === "hidden";
    });

    // Button too small for touch
    const smallButtons = await page.evaluate(() => {
      const btns = document.querySelectorAll("button, a[role='button']");
      let count = 0;
      btns.forEach((b) => {
        const rect = b.getBoundingClientRect();
        if (rect.height > 0 && rect.height < 36) count++;
      });
      return count;
    });
    if (smallButtons > 3)
      ISSUES.push(
        `${name}: ${smallButtons} botones < 36px alto (touch target)`,
      );

    // Check for fixed elements blocking content
    const fixedOverlays = await page.evaluate(() => {
      const els = document.querySelectorAll("*");
      let count = 0;
      els.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.position === "fixed" && style.display !== "none") {
          const rect = el.getBoundingClientRect();
          if (rect.width > 200 && rect.height > 50) count++;
        }
      });
      return count;
    });

    await page.screenshot({
      path: path.join(SHOT_DIR, `${name}.png`),
      fullPage: false,
    });

    console.log(
      `📸 ${name}: hscroll=${hScroll ? "Y" : "N"} emojis=${emojis} smallBtns=${smallButtons} tinyTexts=${tinyTexts} console=${msgs.length}`,
    );
    if (msgs.length > 0) console.log(`   console: ${msgs[0]}`);
  } catch (e) {
    console.log(
      `❌ ${name}: ${e instanceof Error ? e.message.substring(0, 100) : "error"}`,
    );
    ISSUES.push(`${name}: navigation failed`);
  }
}

test("Mobile UX audit — wondernails all screens", async ({ page }) => {
  // Login
  await page.goto(`http://localhost:3003/t/${TENANT}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.fill('[data-testid="email-input"]', "jagzao@gmail.com");
  await page.fill('[data-testid="password-input"]', "admin");
  await page.getByTestId("login-btn").first().click({ force: true });
  await page.waitForURL(
    (u) => u.href.includes(`/t/${TENANT}`) && !u.href.includes("/login"),
    { timeout: 60000 },
  );
  await page.waitForTimeout(2000);

  // Public + auth screens
  await audit(page, "01-home", `http://localhost:3003/t/${TENANT}`);
  await audit(
    page,
    "02-products",
    `http://localhost:3003/t/${TENANT}/products`,
  );
  await audit(
    page,
    "03-services",
    `http://localhost:3003/t/${TENANT}/services`,
  );
  await audit(page, "04-book", `http://localhost:3003/t/${TENANT}/book`);
  await audit(page, "05-social", `http://localhost:3003/t/${TENANT}/social`);
  await audit(page, "06-admin", `http://localhost:3003/t/${TENANT}/admin`);
  await audit(page, "07-finance", `http://localhost:3003/t/${TENANT}/finance`);
  await audit(
    page,
    "08-clientes",
    `http://localhost:3003/t/${TENANT}/clientes`,
  );
  await audit(
    page,
    "09-inventory",
    `http://localhost:3003/t/${TENANT}/inventory`,
  );
  await audit(page, "10-profile", `http://localhost:3003/t/${TENANT}/profile`);
  await audit(
    page,
    "11-favorites",
    `http://localhost:3003/t/${TENANT}/favorites`,
  );
  await audit(page, "12-pos", `http://localhost:3003/t/${TENANT}/pos`);
  await audit(page, "13-reports", `http://localhost:3003/t/${TENANT}/reports`);

  // Summary
  console.log("\n=== MOBILE UX ISSUES ===");
  ISSUES.forEach((i) => console.log(`  ⚠️  ${i}`));
  console.log(`\nTotal: ${ISSUES.length} issues`);
  fs.writeFileSync(path.join(SHOT_DIR, "ux-issues.txt"), ISSUES.join("\n"));
});
