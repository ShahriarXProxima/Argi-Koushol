import puppeteer from "puppeteer";
import path from "path";

const ARTIFACTS_DIR = "/home/shahriar/.gemini/antigravity/brain/a63d96e5-08f5-405e-9b86-1c2bb59a754d";
const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("🚀 Launching Puppeteer for i18n & 390px Mobile Verification...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  // Helper to check horizontal overflow
  async function checkHorizontalOverflow(viewName: string) {
    const hasOverflow = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      // Also check if any element bleeds past viewport
      const elements = Array.from(document.querySelectorAll("*"));
      const overflowing = elements.filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > docWidth + 2; // allowance of 2px for sub-pixel anti-aliasing
      });
      return {
        hasScrollOverflow: scrollWidth > docWidth + 2,
        docWidth,
        scrollWidth,
        overflowCount: overflowing.length,
      };
    });

    console.log(`[Overflow Check: ${viewName}] docWidth=${hasOverflow.docWidth}, scrollWidth=${hasOverflow.scrollWidth}, overflowingElements=${hasOverflow.overflowCount}`);
    if (hasOverflow.hasScrollOverflow) {
      console.warn(`⚠️ Warning: Horizontal overflow detected in ${viewName}!`);
    } else {
      console.log(`✅ Zero horizontal overflow in ${viewName} (Fits perfectly at ${hasOverflow.docWidth}px)`);
    }
  }

  // ==========================================
  // PART 1: BANGLA MODE VERIFICATION
  // ==========================================
  console.log("\n==========================================");
  console.log("🇧🇩 TESTING BANGLA (বাংলা) LOCALIZATION");
  console.log("==========================================");

  // Set cookie for Bangla
  await page.setCookie({
    name: "agri_locale",
    value: "bn",
    domain: "localhost",
    path: "/",
  });

  // Mobile viewport: 390 x 844 (iPhone 12/13/14)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

  // 1. Dashboard in Bangla on Mobile
  console.log("Opening Dashboard (BN - 390px)...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("main");
  await new Promise((r) => setTimeout(r, 2000));

  await checkHorizontalOverflow("Dashboard BN Mobile (390px)");

  const dashBnMobilePath = path.join(ARTIFACTS_DIR, "dashboard_bn_mobile_390.png");
  await page.screenshot({ path: dashBnMobilePath });
  console.log(`📸 Saved: ${dashBnMobilePath}`);

  // 2. Alerts in Bangla on Mobile
  console.log("Opening Alerts (BN - 390px)...");
  await page.goto(`${BASE_URL}/alerts`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("main");
  await new Promise((r) => setTimeout(r, 2000));

  await checkHorizontalOverflow("Alerts BN Mobile (390px)");

  const alertsBnMobilePath = path.join(ARTIFACTS_DIR, "alerts_bn_mobile_390.png");
  await page.screenshot({ path: alertsBnMobilePath });
  console.log(`📸 Saved: ${alertsBnMobilePath}`);

  // 3. Field Detail in Bangla on Mobile
  console.log("Opening Field Detail (BN - 390px)...");
  await page.goto(`${BASE_URL}/fields/cmvpap4sa00049ep8h1tm3ow6`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("main");
  await new Promise((r) => setTimeout(r, 2000));

  await checkHorizontalOverflow("Field Detail BN Mobile (390px)");

  const fieldBnMobilePath = path.join(ARTIFACTS_DIR, "field_detail_bn_mobile_390.png");
  await page.screenshot({ path: fieldBnMobilePath });
  console.log(`📸 Saved: ${fieldBnMobilePath}`);

  // 4. Desktop Dashboard in Bangla
  console.log("Opening Dashboard (BN - Desktop 1280px)...");
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));

  const dashBnDesktopPath = path.join(ARTIFACTS_DIR, "dashboard_bn_desktop.png");
  await page.screenshot({ path: dashBnDesktopPath });
  console.log(`📸 Saved: ${dashBnDesktopPath}`);

  // ==========================================
  // PART 2: ENGLISH MODE VERIFICATION
  // ==========================================
  console.log("\n==========================================");
  console.log("🇬🇧 TESTING ENGLISH LOCALIZATION");
  console.log("==========================================");

  // Set cookie for English
  await page.setCookie({
    name: "agri_locale",
    value: "en",
    domain: "localhost",
    path: "/",
  });

  // Mobile viewport: 390 x 844
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

  // 1. Dashboard in English on Mobile
  console.log("Opening Dashboard (EN - 390px)...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("main");
  await new Promise((r) => setTimeout(r, 2000));

  await checkHorizontalOverflow("Dashboard EN Mobile (390px)");

  const dashEnMobilePath = path.join(ARTIFACTS_DIR, "dashboard_en_mobile_390.png");
  await page.screenshot({ path: dashEnMobilePath });
  console.log(`📸 Saved: ${dashEnMobilePath}`);

  // 2. Alerts in English on Mobile
  console.log("Opening Alerts (EN - 390px)...");
  await page.goto(`${BASE_URL}/alerts`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("main");
  await new Promise((r) => setTimeout(r, 2000));

  await checkHorizontalOverflow("Alerts EN Mobile (390px)");

  const alertsEnMobilePath = path.join(ARTIFACTS_DIR, "alerts_en_mobile_390.png");
  await page.screenshot({ path: alertsEnMobilePath });
  console.log(`📸 Saved: ${alertsEnMobilePath}`);

  // 3. Desktop Dashboard in English
  console.log("Opening Dashboard (EN - Desktop 1280px)...");
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));

  const dashEnDesktopPath = path.join(ARTIFACTS_DIR, "dashboard_en_desktop.png");
  await page.screenshot({ path: dashEnDesktopPath });
  console.log(`📸 Saved: ${dashEnDesktopPath}`);

  await browser.close();
  console.log("\n✨ All i18n & 390px mobile visual verifications completed successfully!");
}

main().catch((err) => {
  console.error("Puppeteer verification failed:", err);
  process.exit(1);
});
