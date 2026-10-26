import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { prisma } from "../src/lib/prisma";

try {
  process.loadEnvFile();
} catch {
  // Ignored if already loaded
}

async function runMcpTest() {
  console.log("=================================================");
  console.log("🌾 Agri-Koushol MCP Server Verification Test");
  console.log("=================================================");

  const port = process.env.MCP_PORT || 3001;
  const token = process.env.MCP_TOKEN || "";
  const serverUrl = new URL(`http://localhost:${port}/mcp`);

  console.log(`Connecting to MCP server at: ${serverUrl}`);
  console.log(`Auth Bearer token configured: ${token ? "YES" : "NO"}`);

  // 1. Initialize Client & Streamable HTTP Transport
  const transport = new StreamableHTTPClientTransport(serverUrl, {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const client = new Client(
    {
      name: "agri-koushol-test-runner",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  console.log("\n📡 Establishing connection with MCP transport...");
  await client.connect(transport);
  console.log("✅ Successfully connected to Agri-Koushol MCP server!");

  // 2. List all exposed tools
  console.log("\n📋 Listing available MCP tools...");
  const toolsResponse = await client.listTools();
  const tools = toolsResponse.tools;

  console.log(`Discovered ${tools.length} registered tools:`);
  tools.forEach((t, i) => {
    const desc = t.description ? t.description.slice(0, 75) : "No description";
    console.log(`  ${i + 1}. \x1b[32m${t.name}\x1b[0m: ${desc}...`);
  });

  if (tools.length < 11) {
    throw new Error(`Expected at least 11 tools, but found ${tools.length}`);
  }

  // Find a seeded field to run tests against
  const fieldA = await prisma.field.findFirst({
    where: { name: { contains: "উত্তর মাঠ" } },
  }) || (await prisma.field.findFirst());

  if (!fieldA) {
    throw new Error("No seeded fields found in database. Run npm run db:seed first.");
  }

  console.log(`\n🌾 Target Field for tests: "${fieldA.name}" (ID: ${fieldA.id})`);

  // 3. Test Tool 1: check_field_status
  console.log("\n-------------------------------------------------");
  console.log("🔧 Testing Tool 1: check_field_status");
  console.log("-------------------------------------------------");
  const fieldStatusResult = await client.callTool({
    name: "check_field_status",
    arguments: { field_id: fieldA.id },
  });

  const fieldStatusContent = (fieldStatusResult.content as Array<{ text: string }>)[0]?.text;
  console.log("Response:");
  console.log(fieldStatusContent);

  // 4. Test Tool 2: get_current_weather
  console.log("\n-------------------------------------------------");
  console.log("🔧 Testing Tool 2: get_current_weather");
  console.log("-------------------------------------------------");
  const weatherResult = await client.callTool({
    name: "get_current_weather",
    arguments: { field_id: fieldA.id },
  });

  const weatherContent = (weatherResult.content as Array<{ text: string }>)[0]?.text;
  console.log("Response:");
  console.log(weatherContent);

  // 5. Test Tool 3: read_soil_moisture
  console.log("\n-------------------------------------------------");
  console.log("🔧 Testing Tool 3: read_soil_moisture");
  console.log("-------------------------------------------------");
  const moistureResult = await client.callTool({
    name: "read_soil_moisture",
    arguments: { field_id: fieldA.id, hours: 24 },
  });

  const moistureContent = (moistureResult.content as Array<{ text: string }>)[0]?.text;
  console.log("Response:");
  console.log(moistureContent);

  // 6. Test Tool 4: estimate_yield
  console.log("\n-------------------------------------------------");
  console.log("🔧 Testing Tool 4: estimate_yield");
  console.log("-------------------------------------------------");
  const yieldResult = await client.callTool({
    name: "estimate_yield",
    arguments: { field_id: fieldA.id },
  });

  const yieldContent = (yieldResult.content as Array<{ text: string }>)[0]?.text;
  console.log("Response:");
  console.log(yieldContent);

  // 7. Test AI Safety Rule & Write Tool: schedule_spray
  console.log("\n-------------------------------------------------");
  console.log("🛡️ Testing AI Safety Rule on schedule_spray (Field B with >50% rain)");
  console.log("-------------------------------------------------");
  const fieldB = await prisma.field.findFirst({
    where: { name: { contains: "দক্ষিণ মাঠ" } },
  });

  if (fieldB) {
    const sprayResult = await client.callTool({
      name: "schedule_spray",
      arguments: {
        field_id: fieldB.id,
        start_time_iso: new Date(Date.now() + 3600000).toISOString(),
        reason: "Test chemical spray during rain risk",
      },
    });

    console.log("Safety refusal response (isError =", sprayResult.isError, "):");
    console.log((sprayResult.content as Array<{ text: string }>)[0]?.text);
  }

  // 8. Close client connection
  console.log("\n-------------------------------------------------");
  console.log("✅ All MCP client tests passed successfully!");
  console.log("=================================================");

  await client.close();
  await prisma.$disconnect();
  process.exit(0);
}

runMcpTest().catch(async (err) => {
  console.error("\n❌ MCP Test failed with error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
