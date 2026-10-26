import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { LLMToolDeclaration } from "./llm";

// ============================================================================
// MCP Client & Tool Cache
// ============================================================================

interface CachedTools {
  timestamp: number;
  tools: LLMToolDeclaration[];
}

let cachedTools: CachedTools | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds TTL

/**
 * Creates and connects a new MCP SDK client instance over Streamable HTTP transport.
 */
export async function createMcpClient(): Promise<Client> {
  const baseUrl = (process.env.MCP_SERVER_URL || "http://localhost:3001").replace(/\/$/, "");
  const serverUrl = new URL(`${baseUrl}/mcp`);
  const token = (process.env.MCP_TOKEN || "").trim();

  const transport = new StreamableHTTPClientTransport(serverUrl, {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const client = new Client(
    {
      name: "agri-koushol-app-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  return client;
}

/**
 * Lists available MCP tools converted to the LLM function-declaration format.
 * Caches the tool list for 60 seconds.
 */
export async function listMcpTools(): Promise<LLMToolDeclaration[]> {
  const now = Date.now();
  if (cachedTools && now - cachedTools.timestamp < CACHE_TTL_MS) {
    return cachedTools.tools;
  }

  let client: Client | null = null;
  try {
    client = await createMcpClient();
    const result = await client.listTools();

    const tools: LLMToolDeclaration[] = result.tools.map((t) => ({
      name: t.name,
      description: t.description || "",
      parametersJsonSchema: t.inputSchema || { type: "object", properties: {} },
    }));

    cachedTools = {
      timestamp: now,
      tools,
    };

    return tools;
  } catch (err) {
    console.warn("[MCP Client] Failed to fetch tools from MCP server, using cached or fallback declarations:", err);
    if (cachedTools) {
      return cachedTools.tools;
    }
    // Return standard fallback declarations if server is booting
    return getFallbackToolDeclarations();
  } finally {
    if (client) {
      try {
        await client.close();
      } catch {
        // Ignored
      }
    }
  }
}

/**
 * Executes an MCP tool call on the MCP server.
 */
export async function callMcpTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  let client: Client | null = null;
  try {
    client = await createMcpClient();
    const response = await client.callTool({
      name,
      arguments: args,
    });

    const contentItem = (response.content as Array<{ text: string }>)?.[0];
    const textResult = contentItem?.text || JSON.stringify(response);

    return textResult;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[MCP Client] Error calling tool '${name}':`, err);
    return JSON.stringify({
      error: "TOOL_EXECUTION_FAILED",
      tool: name,
      message: errorMsg,
    });
  } finally {
    if (client) {
      try {
        await client.close();
      } catch {
        // Ignored
      }
    }
  }
}

/**
 * Fallback tool declarations in case MCP server is temporarily starting up
 */
function getFallbackToolDeclarations(): LLMToolDeclaration[] {
  return [
    {
      name: "get_current_weather",
      description: "Fetches current weather and 48-hour forecast for a field.",
      parametersJsonSchema: {
        type: "object",
        properties: { field_id: { type: "string" } },
        required: ["field_id"],
      },
    },
    {
      name: "check_field_status",
      description: "Retrieves complete agronomic status of a field.",
      parametersJsonSchema: {
        type: "object",
        properties: { field_id: { type: "string" } },
        required: ["field_id"],
      },
    },
    {
      name: "read_soil_moisture",
      description: "Reads soil moisture telemetry history over specified hours.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          field_id: { type: "string" },
          hours: { type: "number", default: 24 },
        },
        required: ["field_id"],
      },
    },
    {
      name: "get_detection_history",
      description: "Retrieves recent computer-vision crop disease detections.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          field_id: { type: "string" },
          limit: { type: "number", default: 5 },
        },
        required: ["field_id"],
      },
    },
    {
      name: "get_active_decisions",
      description: "Retrieves active or scheduled decisions for a field.",
      parametersJsonSchema: {
        type: "object",
        properties: { field_id: { type: "string" } },
        required: ["field_id"],
      },
    },
    {
      name: "schedule_irrigation",
      description: "Schedules simulated irrigation for a field.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          field_id: { type: "string" },
          start_time_iso: { type: "string" },
          duration_minutes: { type: "number" },
          reason: { type: "string" },
          source: { type: "string", enum: ["CHATBOT", "N8N"] },
        },
        required: ["field_id", "start_time_iso", "duration_minutes", "reason"],
      },
    },
    {
      name: "pause_irrigation",
      description: "Pauses active or scheduled irrigation.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          field_id: { type: "string" },
          reason: { type: "string" },
          source: { type: "string", enum: ["CHATBOT", "N8N"] },
        },
        required: ["field_id", "reason"],
      },
    },
    {
      name: "trigger_irrigation",
      description: "Immediately executes simulated irrigation cycle.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          field_id: { type: "string" },
          duration_minutes: { type: "number" },
          reason: { type: "string" },
          source: { type: "string", enum: ["CHATBOT", "N8N"] },
        },
        required: ["field_id", "duration_minutes", "reason"],
      },
    },
    {
      name: "schedule_spray",
      description: "Schedules chemical crop protection spraying. Refuses if rain probability > 50%.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          field_id: { type: "string" },
          start_time_iso: { type: "string" },
          reason: { type: "string" },
          source: { type: "string", enum: ["CHATBOT", "N8N"] },
        },
        required: ["field_id", "start_time_iso", "reason"],
      },
    },
    {
      name: "estimate_yield",
      description: "Runs the YieldMax predictive yield engine for a field.",
      parametersJsonSchema: {
        type: "object",
        properties: { field_id: { type: "string" } },
        required: ["field_id"],
      },
    },
    {
      name: "create_alert",
      description: "Creates an agronomic alert and decision record.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          field_id: { type: "string" },
          severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          title: { type: "string" },
          message: { type: "string" },
          source: { type: "string", enum: ["CHATBOT", "N8N", "MANUAL"] },
        },
        required: ["field_id", "severity", "title", "message"],
      },
    },
  ];
}
