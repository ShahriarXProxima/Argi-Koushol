import { runAgent, type AgentEvent } from "../src/lib/agent";
import { prisma } from "../src/lib/prisma";

// Load environment variables
try {
  process.loadEnvFile();
} catch {
  // Ignored
}

const CHAT_SYSTEM_PROMPT =
  "You are Shoshsho-Prohori (শস্য-প্রহরী), a friendly agronomist assistant for farmers in Bangladesh. Reply in the language the farmer wrote in (Bangla or English), in short plain sentences. Always check facts with tools before advising: check_field_status, read_soil_moisture, get_current_weather. Never guess sensor or weather values. If a field is not specified, ask which field or list the fields. Never recommend spraying if rain probability is above 50% within 6 hours. If rain is expected within 6 hours, pause or skip irrigation and say why. If disease confidence is below 0.6, recommend a manual inspection. When you take an action with a tool, tell the farmer exactly what you did and that it can be changed. Say clearly when data is simulated or stale.";

async function main() {
  console.log("=================================================");
  console.log("🌾 Shoshsho-Prohori (শস্য-প্রহরী) Agent Verification");
  console.log("=================================================");

  // Find Field A for contextual reference
  const fieldA = await prisma.field.findFirst({
    where: { name: { contains: "Sector 1" } },
  }) || (await prisma.field.findFirst());

  const question = "Should I irrigate Field A today?";
  console.log(`\n👨‍🌾 Farmer asks: "${question}"`);
  console.log(`🌾 Target field context: ${fieldA?.name} (ID: ${fieldA?.id})\n`);

  console.log("🤖 Running autonomous agent loop with MCP tool calls...\n");

  const startTime = Date.now();
  let toolCallIndex = 0;

  const result = await runAgent({
    system: CHAT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: fieldA ? `${question}\n[Context: Field A id="${fieldA.id}"]` : question,
      },
    ],
    maxSteps: 6,
    onEvent: (event: AgentEvent) => {
      if (event.type === "tool_call") {
        toolCallIndex++;
        const data = event.data as { name: string; args: Record<string, unknown> };
        console.log(`\x1b[34m[Tool Call #${toolCallIndex}]\x1b[0m \x1b[1m${data.name}\x1b[0m`);
        console.log(`  Arguments:`, JSON.stringify(data.args, null, 2));
      } else if (event.type === "tool_result") {
        const data = event.data as { name: string; result: string };
        let preview = data.result;
        try {
          const parsed = JSON.parse(data.result);
          preview = JSON.stringify(parsed, null, 2);
          if (preview.length > 300) {
            preview = preview.slice(0, 300) + "... [truncated]";
          }
        } catch {
          if (preview.length > 300) preview = preview.slice(0, 300) + "...";
        }
        console.log(`\x1b[32m[Tool Result #${toolCallIndex}]\x1b[0m \x1b[1m${data.name}\x1b[0m`);
        console.log(`  Data:`, preview, "\n");
      }
    },
  });

  const duration = Date.now() - startTime;

  console.log("=================================================");
  console.log(`📢 Shoshsho-Prohori Final Answer (${duration}ms):`);
  console.log("=================================================");
  console.log(result.text);
  console.log("=================================================");
  console.log(`✅ Completed in ${result.steps} steps with ${result.toolCalls.length} tool calls.`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Test failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
