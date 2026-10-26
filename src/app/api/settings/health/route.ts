import { jsonSuccess } from "@/lib/api";

export async function GET() {
  const startTime = Date.now();

  // 1. Check MCP Server
  let mcpStatus: "online" | "offline" = "offline";
  let mcpLatency = 0;
  const mcpUrl = process.env.MCP_SERVER_URL || "http://localhost:3001";
  try {
    const t0 = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${mcpUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    mcpLatency = Date.now() - t0;
    if (res.ok) {
      mcpStatus = "online";
    }
  } catch {
    mcpStatus = "offline";
  }

  // 2. Check n8n Autonomous Workflow Engine
  let n8nStatus: "online" | "offline" = "offline";
  const useN8n = process.env.USE_N8N === "true";
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (useN8n && n8nWebhookUrl && !n8nWebhookUrl.includes("example.com")) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(n8nWebhookUrl, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      n8nStatus = res.status < 500 ? "online" : "offline";
    } catch {
      n8nStatus = "offline";
    }
  } else {
    // If not using external n8n or using simulated engine, it's standby/simulated
    n8nStatus = "online"; // Internal autonomous pipeline active
  }

  // 3. Check Gemini LLM Provider
  let llmStatus: "online" | "offline" = "offline";
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiApiKey && geminiApiKey.length > 0 && !geminiApiKey.includes("your-")) {
    llmStatus = "online";
  } else {
    llmStatus = "offline";
  }

  // 4. Check Twilio WhatsApp Gateway
  let twilioStatus: "online" | "offline" = "offline";
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (
    twilioSid &&
    twilioToken &&
    !twilioSid.includes("your-") &&
    !twilioToken.includes("your-")
  ) {
    twilioStatus = "online";
  } else {
    // Marked offline / simulated
    twilioStatus = "offline";
  }

  return jsonSuccess({
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    services: {
      mcp: {
        name: "MCP Server",
        url: mcpUrl,
        status: mcpStatus,
        latencyMs: mcpLatency,
        description: "Agronomic tools & sensors provider (Streamable HTTP)",
      },
      n8n: {
        name: "n8n Workflow Engine",
        status: n8nStatus,
        mode: useN8n ? "webhook" : "internal_pipeline",
        description: useN8n ? "External autonomous webhook" : "Local autonomous event pipeline fallback",
      },
      llm: {
        name: "Gemini 2.5 Flash LLM",
        status: llmStatus,
        model: process.env.LLM_MODEL || "gemini-2.5-flash",
        description: "Vision classification & agronomist reasoning",
      },
      twilio: {
        name: "Twilio WhatsApp Gateway",
        status: twilioStatus,
        from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886",
        description: twilioStatus === "online" ? "Real SMS/WhatsApp live API" : "Simulated dispatcher mode",
      },
    },
  });
}
