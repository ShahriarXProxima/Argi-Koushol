import "dotenv/config";
import { prisma } from "../src/lib/prisma";

interface FieldState {
  id: string;
  name: string;
  crop: string;
  threshold: number;
  moisture: number;
  temp: number;
  humidity: number;
  ph: number;
}

// Strict Agronomic Clamping Bounds
const BOUNDS = {
  moisture: { min: 15.0, max: 85.0 },
  temp: { min: 10.0, max: 48.0 },
  humidity: { min: 20.0, max: 100.0 },
  ph: { min: 5.5, max: 8.5 },
};

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

async function runFeeder() {
  console.log("🌱 [Agri-Koushol Feeder] Initializing continuous sensor simulation...");

  const fields = await prisma.field.findMany({
    select: {
      id: true,
      name: true,
      crop: true,
      soilMoistureThreshold: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (fields.length === 0) {
    console.error("❌ No fields found in database. Run 'npm run db:seed' first.");
    process.exit(1);
  }

  // Initialize field telemetry states from latest sensor readings if available
  const fieldStates: FieldState[] = [];

  for (const field of fields) {
    const latestReading = await prisma.sensorReading.findFirst({
      where: { fieldId: field.id },
      orderBy: { recordedAt: "desc" },
    });

    fieldStates.push({
      id: field.id,
      name: field.name,
      crop: field.crop,
      threshold: field.soilMoistureThreshold,
      moisture: latestReading ? latestReading.soilMoisture : field.soilMoistureThreshold + 2.5,
      temp: latestReading ? latestReading.temperature : 28.0,
      humidity: latestReading ? latestReading.humidity : 65.0,
      ph: latestReading?.ph ?? 6.5,
    });
  }

  console.log(`📡 Simulating realistic telemetry for ${fieldStates.length} fields every 10 seconds.`);
  console.log("Press Ctrl+C to terminate.\n");

  let tickCount = 0;

  async function step() {
    tickCount++;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    // Diurnal solar curve (24-hour cycle: peak warm/dry at 14:00, coolest/humid at 05:00)
    const solarCycle = Math.sin(((currentHour - 8) * Math.PI) / 12);
    const targetBaseTemp = 27.5 + 5.5 * solarCycle;
    const targetBaseHum = 68 - 18 * solarCycle;

    const summaries: string[] = [];

    for (const state of fieldStates) {
      // 1. Temperature walk (smooth pull towards diurnal target with micro-fluctuations)
      const tempJitter = (Math.random() - 0.5) * 0.8;
      state.temp = clamp(
        state.temp * 0.85 + (targetBaseTemp + tempJitter) * 0.15,
        BOUNDS.temp.min,
        BOUNDS.temp.max
      );

      // 2. Humidity walk (inverse to temperature)
      const humJitter = (Math.random() - 0.5) * 2.0;
      state.humidity = clamp(
        state.humidity * 0.85 + (targetBaseHum + humJitter) * 0.15,
        BOUNDS.humidity.min,
        BOUNDS.humidity.max
      );

      // 3. Soil moisture random walk with evaporation drift
      // Daytime solar warmth drives evaporation; night-time settles with slight dew
      const evapDrift = solarCycle > 0 ? (solarCycle * 0.12) : -0.04;
      const moistureJitter = (Math.random() - 0.49) * 0.4;
      state.moisture = clamp(
        state.moisture - evapDrift + moistureJitter,
        BOUNDS.moisture.min,
        BOUNDS.moisture.max
      );

      // 4. Soil pH micro-variation (slow chemical buffering)
      const phJitter = (Math.random() - 0.5) * 0.03;
      state.ph = clamp(
        state.ph * 0.95 + 6.5 * 0.05 + phJitter,
        BOUNDS.ph.min,
        BOUNDS.ph.max
      );

      const roundedMoisture = Math.round(state.moisture * 10) / 10;
      const roundedTemp = Math.round(state.temp * 10) / 10;
      const roundedHumidity = Math.round(state.humidity * 10) / 10;
      const roundedPh = Math.round(state.ph * 100) / 100;

      // Persist reading to database
      await prisma.sensorReading.create({
        data: {
          fieldId: state.id,
          soilMoisture: roundedMoisture,
          temperature: roundedTemp,
          humidity: roundedHumidity,
          ph: roundedPh,
          recordedAt: now,
        },
      });

      // Update hardware sensor caches
      await Promise.all([
        prisma.sensor.updateMany({
          where: { fieldId: state.id, type: "SOIL_MOISTURE" },
          data: { lastValue: roundedMoisture, lastSeen: now },
        }),
        prisma.sensor.updateMany({
          where: { fieldId: state.id, type: "TEMPERATURE" },
          data: { lastValue: roundedTemp, lastSeen: now },
        }),
        prisma.sensor.updateMany({
          where: { fieldId: state.id, type: "SOIL_PH" },
          data: { lastValue: roundedPh, lastSeen: now },
        }),
      ]);

      const isLow = roundedMoisture < state.threshold;
      summaries.push(
        `${state.name.split(" ")[0] || state.name}: ${roundedMoisture}%${isLow ? " (LOW)" : ""} [${roundedTemp}°C]`
      );
    }

    const timeStr = now.toLocaleTimeString("en-GB", { hour12: false });
    console.log(`[Feeder #${tickCount} ${timeStr}] ${summaries.join(" | ")}`);
  }

  // Run first iteration immediately
  await step();

  // Schedule loop every 10 seconds (10,000ms)
  const timer = setInterval(() => {
    step().catch((err) => {
      console.error("[Feeder Error]", err);
    });
  }, 10000);

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log("\n🛑 Stopping sensor feeder...");
    clearInterval(timer);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

runFeeder().catch((err) => {
  console.error("Feeder failed to start:", err);
  process.exit(1);
});
