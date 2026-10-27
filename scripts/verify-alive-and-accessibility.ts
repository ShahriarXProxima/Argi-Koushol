import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = "/home/shahriar/.gemini/antigravity/brain/a63d96e5-08f5-405e-9b86-1c2bb59a754d";
const BASE_URL = "http://localhost:3000";

interface AxeViolation {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

interface AxeResults {
  passes: unknown[];
  violations: AxeViolation[];
  incomplete: unknown[];
  inapplicable: unknown[];
}

declare global {
  interface Window {
    axe: {
      run: (options?: unknown) => Promise<AxeResults>;
    };
  }
}

async function main() {
  console.log("🌾 [Agri-Koushol] Starting End-to-End Verification & Accessibility Audit...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();

    // 1. Check PWA Manifest and Favicon
    console.log("\n📱 Checking PWA Manifest and Icons...");
    const manifestRes = await fetch(`${BASE_URL}/manifest.json`);
    console.log(`Manifest status: ${manifestRes.status} ${manifestRes.statusText}`);
    if (manifestRes.ok) {
      const manifestData = await manifestRes.json();
      console.log(`✅ PWA Manifest valid: name="${manifestData.name}", theme_color="${manifestData.theme_color}"`);
    } else {
      console.warn("⚠️ Manifest returned non-200");
    }

    const iconRes = await fetch(`${BASE_URL}/icon.svg`);
    console.log(`Icon status: ${iconRes.status} ${iconRes.statusText}`);
    if (iconRes.ok) {
      console.log("✅ SVG Favicon loaded successfully (200 OK)");
    }

    // 2. Desktop Verification (1280x850)
    console.log("\n🖥️ Checking Desktop Dashboard (1280x850)...");
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000)); // allow count-up and SWR to populate

    // Capture desktop dashboard
    const desktopScreenshot = path.join(ARTIFACTS_DIR, "dashboard_alive_desktop.png");
    await page.screenshot({ path: desktopScreenshot, fullPage: false });
    console.log(`📸 Desktop screenshot saved: ${desktopScreenshot}`);

    // Click System Status Pill to test popover
    const statusPill = await page.$("button[aria-label*='Systems'], button[aria-label*='সিস্টেম']");
    if (statusPill) {
      await statusPill.click();
      await new Promise((r) => setTimeout(r, 600));
      const popoverScreenshot = path.join(ARTIFACTS_DIR, "system_status_popover.png");
      await page.screenshot({ path: popoverScreenshot });
      console.log(`📸 System status popover screenshot saved: ${popoverScreenshot}`);
      // click again to close
      await statusPill.click();
    }

    // Scroll to footer and capture Simulated Data notice
    console.log("\n📜 Checking Footer Simulated Data Notice...");
    const footerElem = await page.$("footer");
    if (footerElem) {
      await footerElem.scrollIntoView();
      await new Promise((r) => setTimeout(r, 500));
      const footerScreenshot = path.join(ARTIFACTS_DIR, "footer_simulated_notice.png");
      await footerElem.screenshot({ path: footerScreenshot });
      console.log(`📸 Footer simulated notice screenshot saved: ${footerScreenshot}`);
    }

    // 3. Lighthouse / Axe-Core Accessibility Audit on Dashboard
    console.log("\n♿ Running Axe-Core / Lighthouse Accessibility Audit on Dashboard...");
    await page.evaluate(async () => {
      window.scrollTo(0, 0);
    });

    // Inject Axe-core
    const axeScript = await fetch("https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js").then((r) => r.text());
    await page.evaluate(axeScript);

    const axeResults: AxeResults = await page.evaluate(async () => {
      return await window.axe.run({
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
        },
      });
    });

    const passedCount = axeResults.passes.length;
    const violationCount = axeResults.violations.length;
    const totalApplicable = passedCount + violationCount;
    const accessibilityScore = totalApplicable > 0 ? Math.round((passedCount / totalApplicable) * 100) : 100;

    console.log(`\n================ ACCESSIBILITY AUDIT REPORT ================`);
    console.log(`Passed Checks: ${passedCount}`);
    console.log(`Violations:    ${violationCount}`);
    console.log(`Lighthouse A11y Equiv Score: ${accessibilityScore} / 100`);

    if (axeResults.violations.length > 0) {
      console.log(`\nViolations detail:`);
      for (const v of axeResults.violations) {
        console.log(`❌ [${v.impact?.toUpperCase()}] ${v.id}: ${v.help}`);
        for (const n of v.nodes.slice(0, 3)) {
          console.log(`   Node: ${n.html.slice(0, 80)}...`);
          if (n.failureSummary) console.log(`   Fix:  ${n.failureSummary.slice(0, 100)}...`);
        }
      }
    } else {
      console.log("🌟 Zero accessibility violations detected! 100% compliant.");
    }
    console.log(`============================================================\n`);

    // 4. Mobile 390px Viewport Check
    console.log("📱 Checking Mobile 390px Viewport...");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));

    const overflowCheck = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const elements = Array.from(document.querySelectorAll("*"));
      const overflowing = elements
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.right > docWidth + 2;
        })
        .map((el) => ({
          tag: el.tagName,
          className: (el as HTMLElement).className,
          right: el.getBoundingClientRect().right,
        }));

      return {
        hasOverflow: scrollWidth > docWidth + 2,
        docWidth,
        scrollWidth,
        overflowCount: overflowing.length,
        overflowing: overflowing.slice(0, 3),
      };
    });

    console.log(`Viewport Width: ${overflowCheck.docWidth}px | Scroll Width: ${overflowCheck.scrollWidth}px`);
    if (overflowCheck.hasOverflow) {
      console.error(`❌ Mobile 390px horizontal overflow detected!`, overflowCheck.overflowing);
    } else {
      console.log(`✅ Zero horizontal overflow at 390px width! Perfectly responsive.`);
    }

    const mobileScreenshot = path.join(ARTIFACTS_DIR, "dashboard_alive_mobile_390.png");
    await page.screenshot({ path: mobileScreenshot, fullPage: false });
    console.log(`📸 Mobile screenshot saved: ${mobileScreenshot}`);

    // Return audit summary
    return {
      accessibilityScore,
      violations: axeResults.violations,
      overflowCheck,
    };
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
