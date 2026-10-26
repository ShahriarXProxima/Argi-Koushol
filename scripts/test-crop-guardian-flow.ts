import { prisma } from "../src/lib/prisma";
import puppeteer from "puppeteer";
import path from "node:path";

const BRAIN_DIR = "/home/shahriar/.gemini/antigravity/brain/a63d96e5-08f5-405e-9b86-1c2bb59a754d";

async function main() {
  console.log("=================================================");
  console.log("🧪 Crop Guardian Autonomous Flow Test: HEAVY_RAIN_4H on Field D");
  console.log("=================================================");

  // 1. Fetch Field D
  const fieldD = await prisma.field.findFirst({
    where: { name: { contains: "Field D" } },
  });

  if (!fieldD) {
    throw new Error("Field D not found in database! Please run seed first.");
  }

  console.log(`🌾 Target Field: "${fieldD.name}" (ID: ${fieldD.id}, Crop: ${fieldD.crop})`);

  // 2. Set Demo Scenario to HEAVY_RAIN_4H
  console.log("🌧️ Setting active scenario to HEAVY_RAIN_4H...");
  const scenarioRes = await fetch("http://localhost:3000/api/settings/demo-scenario", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario: "HEAVY_RAIN_4H" }),
  });

  const scenarioJson = await scenarioRes.json();
  console.log("Scenario update response:", scenarioJson);

  // 3. Call POST /api/detect with Field D and late_blight
  console.log("🛸 Triggering Crop Guardian detection: POST /api/detect (late_blight on Field D)...");
  const detectRes = await fetch("http://localhost:3000/api/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fieldId: fieldD.id,
      stagedImage: "late_blight",
    }),
  });

  const detectJson = await detectRes.json();
  console.log("Detection API Response Status:", detectRes.status);

  if (!detectRes.ok) {
    console.error("Detect API error:", detectJson);
    throw new Error(`Detect API failed with code ${detectRes.status}`);
  }

  const { detection, classification, pipeline } = detectJson.data || detectJson;

  console.log("\n=================================================");
  console.log("📋 Autonomous Pipeline Execution Results:");
  console.log("=================================================");
  console.log("🔍 Detection ID:   ", detection.id);
  console.log("🏷️ Classification: ", classification.label, `(${Math.round(classification.confidence * 100)}% confidence)`);
  console.log("📍 GPS Point:      ", `${detection.lat}° N, ${detection.lng}° E`);
  console.log("🌦️ Rain 6h Risk:   ", `${pipeline.weather.rainProbability6h}%`);
  console.log("⚖️ Final Decision: ", pipeline.decision.action);
  console.log("📜 AI Reasoning:   ", pipeline.decision.reasoning);
  console.log("⏰ Rescheduled For:", pipeline.decision.scheduledFor);
  console.log("🚨 Alert Title:    ", pipeline.alert.title);
  console.log("💬 Farmer Msg (EN):", pipeline.alert.message);
  console.log("💬 Farmer Msg (BN):", pipeline.alert.messageBn);
  console.log("📱 WhatsApp Status:", pipeline.alert.whatsappStatus);
  console.log("=================================================\n");

  // Verify that the safety rule was strictly enforced
  if (pipeline.decision.action !== "DELAY_SPRAY") {
    throw new Error(`SAFETY RULE VIOLATION: Expected DELAY_SPRAY under HEAVY_RAIN_4H, but received ${pipeline.decision.action}!`);
  }
  console.log("✅ SAFETY RULE ENFORCED: DELAY_SPRAY correctly assigned due to >50% rain probability!");

  // 4. Capture browser screenshots with Puppeteer
  console.log("\n📸 Launching Puppeteer to capture Dashboard and Demo Control Panel...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // A. Dashboard Page
    console.log("Navigating to http://localhost:3000/dashboard...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 4000));

    const dashboardPath = path.join(BRAIN_DIR, "dashboard_heavy_rain_alert.png");
    await page.screenshot({ path: dashboardPath, fullPage: false });
    console.log(`Saved dashboard screenshot: ${dashboardPath}`);

    // B. Settings Demo Control Panel
    console.log("Navigating to http://localhost:3000/settings...");
    await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 4000));

    const settingsPath = path.join(BRAIN_DIR, "settings_demo_control_panel.png");
    await page.screenshot({ path: settingsPath, fullPage: false });
    console.log(`Saved settings screenshot: ${settingsPath}`);

    // C. Open Drone Scan Dialog on Dashboard to show stepper / preview
    console.log("Opening Drone Scan Dialog on dashboard...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.waitForSelector("button:has(svg.lucide-plane)", { timeout: 10000 });
    await page.click("button:has(svg.lucide-plane)");
    await page.waitForSelector("div[role='dialog']", { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 2000));

    const modalPath = path.join(BRAIN_DIR, "drone_scan_modal_open.png");
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log(`Saved drone scan modal screenshot: ${modalPath}`);

    console.log("\n🎉 All tests passed and screenshots captured successfully!");
  } finally {
    await browser.close();
  }
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
