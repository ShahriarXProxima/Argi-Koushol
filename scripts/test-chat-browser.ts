import puppeteer from "puppeteer";
import path from "node:path";

const BRAIN_DIR = "/home/shahriar/.gemini/antigravity/brain/a63d96e5-08f5-405e-9b86-1c2bb59a754d";

async function runBrowserTest() {
  console.log("🚀 Launching browser for Chat Widget test...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // Enable console logging from page
    page.on("console", (msg) => {
      const text = msg.text();
      if (!text.includes("Download the React DevTools")) {
        console.log(`[Browser Console] ${text}`);
      }
    });

    console.log("Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });

    // Look for chat dock button
    console.log("Waiting for chat dock button...");
    await page.waitForSelector("#chat-dock-container button, button[aria-label*='Shoshsho-Prohori']", {
      timeout: 10000,
    });

    console.log("Opening chat widget...");
    await page.click("#chat-dock-container button, button[aria-label*='Shoshsho-Prohori']");

    // Wait for chat dialog to appear
    await page.waitForSelector("div[role='dialog']", { timeout: 10000 });
    console.log("Chat dialog opened successfully!");

    // Wait 1s for initial animation & quick replies
    await new Promise((r) => setTimeout(r, 1000));

    // Try finding the textarea
    const textareaSelector = "textarea";
    await page.waitForSelector(textareaSelector, { timeout: 10000 });

    console.log("Typing question: 'Should I irrigate Field A today?'...");
    await page.focus(textareaSelector);
    await page.type(textareaSelector, "Should I irrigate Field A today?", { delay: 30 });

    // Click submit button
    const submitBtnSelector = "button[aria-label='Send message']";
    await page.click(submitBtnSelector);
    console.log("Message submitted! Waiting for SSE streaming response and tool chips...");

    // Wait for assistant response to stream and tool chips to render (up to 30s)
    await page.waitForFunction(
      () => {
        // Look for tool chips or assistant bubbles
        const toolChips = document.querySelectorAll("button[aria-expanded]");
        const assistantBubbles = document.querySelectorAll("div[aria-live='polite'] .bg-card");
        return toolChips.length > 0 || assistantBubbles.length > 1;
      },
      { timeout: 35000 }
    );

    console.log("Assistant response stream initiated!");

    // Wait another 5 seconds for complete streaming & tool execution
    await new Promise((r) => setTimeout(r, 6000));

    // Click the first tool-chip button to expand the tool inspector
    console.log("Looking for tool chips to expand inspector...");
    const toolChipExpanded = await page.evaluate(() => {
      const toolChipButtons = Array.from(document.querySelectorAll("button[aria-expanded]")) as HTMLButtonElement[];
      // Find one that is a tool chip
      const chip = toolChipButtons.find((btn) => btn.getAttribute("title")?.includes("tool inputs") || btn.textContent?.includes("read_soil_moisture") || btn.textContent?.includes("get_current_weather") || btn.textContent?.includes("done"));
      if (chip) {
        chip.click();
        return chip.textContent;
      }
      return null;
    });

    console.log(`Expanded tool chip: ${toolChipExpanded}`);

    // Wait 1s for expansion animation
    await new Promise((r) => setTimeout(r, 1000));

    // Desktop Screenshot
    const desktopPath = path.join(BRAIN_DIR, "chatbot_desktop.png");
    await page.screenshot({ path: desktopPath, fullPage: false });
    console.log(`Saved desktop screenshot to ${desktopPath}`);

    // Mobile Viewport Check (390 x 844 - iPhone 14)
    console.log("Testing mobile viewport 390x844...");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 1000));

    // Ensure chat widget is open on mobile
    const isMobileDialogOpen = await page.$("div[role='dialog']");
    if (!isMobileDialogOpen) {
      await page.waitForSelector("#chat-dock-container button, button[aria-label*='Shoshsho-Prohori']", { timeout: 5000 });
      await page.click("#chat-dock-container button, button[aria-label*='Shoshsho-Prohori']");
      await page.waitForSelector("div[role='dialog']", { timeout: 5000 });
    }
    await new Promise((r) => setTimeout(r, 1000));

    const mobilePath = path.join(BRAIN_DIR, "chatbot_mobile.png");
    await page.screenshot({ path: mobilePath, fullPage: false });
    console.log(`Saved mobile screenshot to ${mobilePath}`);

    console.log("✅ Chat Widget browser test completed successfully!");
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch((err) => {
  console.error("Browser test failed:", err);
  process.exit(1);
});
