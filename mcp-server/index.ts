import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAllTools } from "./tools";

// Load environment variables if available
try {
  process.loadEnvFile();
} catch {
  // Ignored if file already loaded or in production container
}

const app = express();
app.use(express.json());

// ============================================================================
// Safe Request Logging Middleware (Never Logs Secrets)
// ============================================================================
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    // Log only method, url, status, and duration — no authorization headers or sensitive bodies
    console.log(
      `[MCP Server] ${new Date().toISOString()} | ${req.method} ${req.path} | ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// ============================================================================
// Health Check Route
// ============================================================================
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "agri-koushol-mcp",
    transport: "streamable-http",
    mode: "stateless",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Bearer-Token Authentication Middleware
// ============================================================================
const authMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const expectedToken = process.env.MCP_TOKEN?.trim();

  if (!expectedToken) {
    console.warn(
      "[MCP Server] Warning: MCP_TOKEN is not configured in environment."
    );
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message:
          "Unauthorized: Missing or invalid Bearer token in Authorization header.",
      },
      id: null,
    });
  }

  next();
};

// ============================================================================
// Factory to Create McpServer Instance with Registered Tools
// ============================================================================
function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "agri-koushol-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        logging: {},
      },
    }
  );

  registerAllTools(server);
  return server;
}

// ============================================================================
// MCP Streamable HTTP Transport Route (Stateless Mode)
// ============================================================================
app.post("/mcp", authMiddleware, async (req, res) => {
  const server = createServer();
  try {
    // Stateless Streamable HTTP mode: sessionIdGenerator is undefined
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error("[MCP Server] Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error handling MCP request",
        },
        id: null,
      });
    }
  }
});

// Stateless transport rejects GET and DELETE on /mcp as per MCP HTTP spec
app.get("/mcp", authMiddleware, (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message:
        "Method Not Allowed: Stateless streamable HTTP transport requires POST requests.",
    },
    id: null,
  });
});

app.delete("/mcp", authMiddleware, (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message:
        "Method Not Allowed: Stateless streamable HTTP transport requires POST requests.",
    },
    id: null,
  });
});

// ============================================================================
// Start Server
// ============================================================================
const PORT = Number(process.env.MCP_PORT || 3001);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌾 Agri-Koushol MCP Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 MCP Endpoint: http://localhost:${PORT}/mcp`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
});

process.on("SIGINT", () => {
  console.log("[MCP Server] Shutting down gracefully...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("[MCP Server] Shutting down gracefully...");
  server.close(() => process.exit(0));
});
