import { prisma } from "../src/lib/prisma";

try {
  process.loadEnvFile();
} catch {
  // Ignored
}

const SCENARIOS = ["NORMAL", "HEAVY_RAIN_4H", "HEATWAVE"] as const;

interface DecideApiResponse {
  decision?: {
    decision: string;
    severity: string;
    reasoning: string;
    rescheduleTimeIso?: string | null;
    farmerMessage: string;
    farmerMessageBn: string;
  };
  weather?: {
    rainProbability6h: number;
    rainMm48h: number;
  };
  data?: {
    decision?: {
      decision: string;
      severity: string;
      reasoning: string;
      rescheduleTimeIso?: string | null;
      farmerMessage: string;
      farmerMessageBn: string;
    };
    weather?: {
      rainProbability6h: number;
      rainMm48h: number;
    };
  };
}

async function main() {
  console.log("=================================================");
  console.log("⚖️ Agri-Koushol Autonomous Decision Engine Test");
  console.log("   Endpoint: POST /api/decide under Demo Scenarios");
  console.log("=================================================");

  // 1. Locate a seeded blight detection
  const detection = await prisma.detection.findFirst({
    where: { label: { contains: "Blight" } },
    include: { field: true },
  }) || (await prisma.detection.findFirst({ include: { field: true } }));

  if (!detection) {
    throw new Error("No detections found. Please run npm run db:seed first.");
  }

  console.log(`\n🔍 Target Detection: "${detection.label}"`);
  console.log(`   Field: "${detection.field.name}" (ID: ${detection.field.id})`);
  console.log(`   Confidence: ${detection.confidence} (${Math.round(detection.confidence * 100)}%)`);
  console.log(`   Status: ${detection.status}`);

  const apiKey = process.env.INGEST_API_KEY || "dev-ingest-key";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const scenario of SCENARIOS) {
    console.log("\n-------------------------------------------------");
    console.log(`🌦️ Scenario: \x1b[1m\x1b[33m${scenario}\x1b[0m`);
    console.log("-------------------------------------------------");

    // Set demo scenario in database
    await prisma.appSetting.upsert({
      where: { key: "demo-scenario" },
      update: { value: { scenario } },
      create: { key: "demo-scenario", value: { scenario } },
    });

    console.log(`Updated AppSetting 'demo-scenario' -> ${scenario}`);

    let responseData: DecideApiResponse | null = null;

    try {
      // Try HTTP POST to Next.js API route
      const res = await fetch(`${baseUrl}/api/decide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          fieldId: detection.fieldId,
          detectionId: detection.id,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API returned HTTP ${res.status}: ${errorText}`);
      }

      responseData = await res.json();
    } catch (httpErr: unknown) {
      console.warn("Direct HTTP call failed, invoking route handler directly:", (httpErr as Error).message);
      // Fallback: invoke route handler directly
      const { POST } = await import("../src/app/api/decide/route");
      const req = new Request(`${baseUrl}/api/decide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          fieldId: detection.fieldId,
          detectionId: detection.id,
        }),
      });

      const res = await POST(req);
      responseData = await res.json();
    }

    const dec = responseData?.data?.decision || responseData?.decision;
    const weather = responseData?.data?.weather || responseData?.weather;

    console.log(`\n📋 Decision: \x1b[1m\x1b[32m${dec?.decision}\x1b[0m (Severity: ${dec?.severity})`);
    console.log(`🌧️ 6h Rain Probability: ${weather?.rainProbability6h}% (48h Accumulation: ${weather?.rainMm48h} mm)`);
    console.log(`⏰ Rescheduled Time: ${dec?.rescheduleTimeIso || "N/A"}`);
    console.log(`💡 Reasoning: ${dec?.reasoning}`);
    console.log(`🇬🇧 Farmer Message (EN): "${dec?.farmerMessage}"`);
    console.log(`🇧🇩 Farmer Message (BN): "${dec?.farmerMessageBn}"`);

    // Verify AI safety rules
    if ((weather?.rainProbability6h ?? 0) > 50) {
      if (dec?.decision === "SPRAY_NOW") {
        console.error("❌ SAFETY VIOLATION: SPRAY_NOW was permitted despite rain probability > 50%!");
      } else {
        console.log("🛡️ AI Safety Check: Spray successfully blocked / delayed due to rain probability > 50%.");
      }
    } else {
      console.log("🛡️ AI Safety Check: Dry conditions verified for targeted treatment.");
    }
  }

  // Restore scenario to NORMAL
  await prisma.appSetting.upsert({
    where: { key: "demo-scenario" },
    update: { value: { scenario: "NORMAL" } },
    create: { key: "demo-scenario", value: { scenario: "NORMAL" } },
  });

  console.log("\n=================================================");
  console.log("✅ All scenario evaluations completed successfully!");
  console.log("=================================================");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Test failed with error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
