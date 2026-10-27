import { prisma } from "../src/lib/prisma";
import { sendWhatsApp, formatFarmerWhatsAppMessage } from "../src/lib/notify";

async function main() {
  console.log("=== 1. Testing formatFarmerWhatsAppMessage ===");
  const formatted = formatFarmerWhatsAppMessage({
    fieldName: "Field D (Sector 4 - Potato)",
    problem: "Late Blight (আলুর নাবি ধসা)",
    decision: "DELAY_SPRAY",
    newTimeIso: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    dashboardUrl: "http://localhost:3000/fields/cmvpap4sa00049ep8h1tm3ow6",
  });
  console.log("Message Text:\n" + formatted);
  console.log("---------------------------------------------");

  console.log("=== 2. Testing sendWhatsApp with Alert update ===");
  // Find or create an alert to test alertId update
  let testAlert = await prisma.alert.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!testAlert) {
    const field = await prisma.field.findFirst();
    if (!field) throw new Error("No fields in database");
    testAlert = await prisma.alert.create({
      data: {
        fieldId: field.id,
        title: "Test Alert",
        message: "Test alert for WhatsApp dispatch verification",
        messageBn: "হোয়াটসঅ্যাপ টেস্ট সতর্কতা",
        severity: "HIGH",
        source: "TEST",
        whatsappStatus: "PENDING",
      },
    });
  }

  console.log(`Using Alert ID: ${testAlert.id} (Initial WhatsApp Status: ${testAlert.whatsappStatus})`);

  const result = await sendWhatsApp({
    to: process.env.FARMER_WHATSAPP_TO || "whatsapp:+8801700000000",
    body: formatted,
    alertId: testAlert.id,
  });

  console.log("sendWhatsApp Result:", result);

  const updatedAlert = await prisma.alert.findUnique({
    where: { id: testAlert.id },
  });

  console.log(`Updated Alert WhatsApp Status in DB: ${updatedAlert?.whatsappStatus}`);

  if (updatedAlert?.whatsappStatus !== result.status) {
    throw new Error(`DB status (${updatedAlert?.whatsappStatus}) does not match result status (${result.status})`);
  }

  console.log("=== 3. Testing POST /api/notify HTTP endpoint ===");
  const apiKey = process.env.INGEST_API_KEY || "dev-ingest-key";
  const endpointRes = await fetch("http://localhost:3000/api/notify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      fieldName: "Field A (Boro Rice)",
      problem: "Low soil moisture (24% < 35%)",
      decision: "IRRIGATE",
      alertId: testAlert.id,
    }),
  });

  console.log(`HTTP Status: ${endpointRes.status}`);
  const endpointData = await endpointRes.json();
  console.log("HTTP Response:", JSON.stringify(endpointData, null, 2));

  if (!endpointRes.ok || (!endpointData.success && !endpointData.data?.success)) {
    throw new Error("POST /api/notify failed");
  }

  console.log("\n✅ All notification and WhatsApp tests PASSED successfully!");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
