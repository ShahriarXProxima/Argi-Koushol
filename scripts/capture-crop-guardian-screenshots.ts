import puppeteer from "puppeteer";
import path from "node:path";

const BRAIN_DIR = "/home/shahriar/.gemini/antigravity/brain/a63d96e5-08f5-405e-9b86-1c2bb59a754d";

async function capture() {
  console.log("📸 Launching Puppeteer for Crop Guardian screenshots...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // 1. Dashboard screenshot
    console.log("Navigating to Dashboard at http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 4000));

    const dashboardPath = path.join(BRAIN_DIR, "dashboard_heavy_rain_alert.png");
    await page.screenshot({ path: dashboardPath, fullPage: false });
    console.log(`✅ Saved Dashboard screenshot: ${dashboardPath}`);

    // 2. Settings Demo Control Panel screenshot
    console.log("Navigating to Demo Control Panel at http://localhost:3000/settings...");
    await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 4000));

    const settingsPath = path.join(BRAIN_DIR, "settings_demo_control_panel.png");
    await page.screenshot({ path: settingsPath, fullPage: false });
    console.log(`✅ Saved Settings screenshot: ${settingsPath}`);

    // 3. Drone Scan Stepper Modal screenshot
    console.log("Opening Drone Scan Dialog...");
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.waitForSelector("button:has(svg.lucide-plane)", { timeout: 10000 });
    await page.click("button:has(svg.lucide-plane)");
    await page.waitForSelector("div[role='dialog']", { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 2000));

    const modalPath = path.join(BRAIN_DIR, "drone_scan_modal_open.png");
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log(`✅ Saved Drone Scan Dialog screenshot: ${modalPath}`);
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
