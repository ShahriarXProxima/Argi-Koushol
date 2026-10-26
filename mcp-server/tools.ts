import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "../src/lib/prisma";
import { getOrFetchWeather } from "../src/lib/weather";
import { estimateYield } from "../src/lib/yield";
import { getCropBaseline } from "../src/lib/yield-constants";
import type { AlertSeverity, DecisionSource } from "@prisma/client";

// ============================================================================
// 60-Second Idempotency Cache for Write Tools
// ============================================================================

interface IdempotencyRecord {
  timestamp: number;
  data: unknown;
}

const idempotencyCache = new Map<string, IdempotencyRecord>();

function getCachedResult(key: string): unknown | null {
  const entry = idempotencyCache.get(key);
  if (!entry) return null;
  const elapsed = Date.now() - entry.timestamp;
  if (elapsed < 60_000) {
    return entry.data;
  }
  idempotencyCache.delete(key);
  return null;
}

function setCachedResult(key: string, data: unknown): void {
  idempotencyCache.set(key, { timestamp: Date.now(), data });
  // Periodic cleanup of entries older than 2 minutes
  const now = Date.now();
  for (const [k, v] of idempotencyCache.entries()) {
    if (now - v.timestamp > 120_000) {
      idempotencyCache.delete(k);
    }
  }
}

/**
 * Helper to compute yield and persist a YieldPrediction row.
 */
async function computeAndSaveYield(fieldId: string) {
  const field = await prisma.field.findUnique({
    where: { id: fieldId },
    include: {
      readings: { orderBy: { recordedAt: "desc" }, take: 1 },
      weatherLogs: { orderBy: { fetchedAt: "desc" }, take: 1 },
      detections: {
        where: { status: { in: ["FLAGGED", "CONFIRMED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      decisions: {
        where: { status: { in: ["PENDING", "SCHEDULED"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!field) return null;

  const baseline = getCropBaseline(field.crop);

  // 1. Soil health (0 - 1)
  let soilHealth = 0.85;
  const latestReading = field.readings[0];
  if (latestReading) {
    const ratio = latestReading.soilMoisture / field.soilMoistureThreshold;
    soilHealth = ratio >= 1.0 ? Math.min(1.0, 0.85 + (ratio - 1.0) * 0.15) : Math.max(0.2, ratio * 0.85);
  }

  // 2. Active disease penalty
  let activeDiseasePenalty = 0.0;
  const latestDetection = field.detections[0];
  if (latestDetection) {
    const hasScheduledSpray = field.decisions.some(
      (d) => d.action === "SPRAY_NOW" || d.action === "DELAY_SPRAY"
    );
    activeDiseasePenalty = hasScheduledSpray
      ? Math.round(latestDetection.confidence * 0.15 * 100) / 100
      : Math.round(latestDetection.confidence * 0.35 * 100) / 100;
  }

  // 3. Weather stress
  let weatherStress = 0.05;
  const latestWeather = field.weatherLogs[0];
  if (latestWeather) {
    if (latestWeather.tempMax >= 35) weatherStress += 0.15;
    if (latestWeather.rainMm48h >= 25) weatherStress += 0.12;
  }
  weatherStress = Math.min(0.3, weatherStress);

  const yieldResult = estimateYield({
    crop: field.crop,
    baselineTonsPerHa: baseline.baselineTonsPerHa,
    soilHealth,
    activeDiseasePenalty,
    weatherStress,
    plantedOn: field.plantedOn,
    cropDurationDays: field.cropDurationDays,
    weatherDelayDays: 0,
  });

  const prediction = await prisma.yieldPrediction.create({
    data: {
      fieldId: field.id,
      tonsPerHa: yieldResult.tonsPerHa,
      harvestDate: new Date(yieldResult.harvestWindow.optimal),
      confidence: yieldResult.confidence,
      factors: yieldResult.factors as unknown as object,
    },
  });

  return { yieldResult, prediction };
}

// ============================================================================
// Register All 11 Tools
// ============================================================================

export function registerAllTools(server: McpServer): void {
  // --------------------------------------------------------------------------
  // Tool 1: get_current_weather
  // --------------------------------------------------------------------------
  server.registerTool(
    "get_current_weather",
    {
      description:
        "Fetches current weather telemetry, 48-hour forecast, 6-hour rain probability, max temperature, risk badges, and data source for a specific field. Essential before recommending or executing chemical spraying or irrigation.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field (e.g. cmvpap35100019ep849ii6yh8)"),
      },
    },
    async ({ field_id }) => {
      try {
        const weather = await getOrFetchWeather(field_id);
        return {
          content: [{ type: "text", text: JSON.stringify(weather, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'. ${message}`,
                  suggestion: "Please verify the field ID or use check_field_status.",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // --------------------------------------------------------------------------
  // Tool 2: check_field_status
  // --------------------------------------------------------------------------
  server.registerTool(
    "check_field_status",
    {
      description:
        "Retrieves complete agronomic status of a field: crop name, growth stage, planted date, area in hectares, active unread alerts, latest disease detection, latest sensor readings, and recent decisions.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field to inspect"),
      },
    },
    async ({ field_id }) => {
      const field = await prisma.field.findUnique({
        where: { id: field_id },
        include: {
          readings: { orderBy: { recordedAt: "desc" }, take: 1 },
          detections: { orderBy: { createdAt: "desc" }, take: 1 },
          alerts: { where: { read: false }, orderBy: { createdAt: "desc" }, take: 5 },
          decisions: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field with ID '${field_id}' was not found. Please verify the ID.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const status = {
        id: field.id,
        name: field.name,
        crop: field.crop,
        growthStage: field.growthStage,
        plantedOn: field.plantedOn.toISOString(),
        cropDurationDays: field.cropDurationDays,
        areaHa: field.areaHa,
        soilMoistureThreshold: field.soilMoistureThreshold,
        coordinates: { lat: field.lat, lng: field.lng },
        latestReading: field.readings[0] || null,
        latestDetection: field.detections[0] || null,
        activeAlertsCount: field.alerts.length,
        activeAlerts: field.alerts,
        recentDecisions: field.decisions,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
      };
    }
  );

  // --------------------------------------------------------------------------
  // Tool 3: read_soil_moisture
  // --------------------------------------------------------------------------
  server.registerTool(
    "read_soil_moisture",
    {
      description:
        "Reads soil moisture history for a field over the requested lookback window (default 24 hours). Returns latest value, threshold, below_threshold boolean, moisture trend (RISING, FALLING, or STABLE), and recent readings.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field"),
        hours: z.number().int().positive().default(24).describe("Number of hours of historical readings to analyze (default 24)"),
      },
    },
    async ({ field_id, hours = 24 }) => {
      const field = await prisma.field.findUnique({
        where: { id: field_id },
        select: { id: true, name: true, soilMoistureThreshold: true },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const since = new Date(Date.now() - hours * 3600 * 1000);
      const readings = await prisma.sensorReading.findMany({
        where: { fieldId: field_id, recordedAt: { gte: since } },
        orderBy: { recordedAt: "asc" },
      });

      const latestReading = readings[readings.length - 1];
      const latestValue = latestReading ? latestReading.soilMoisture : null;

      let trend: "RISING" | "FALLING" | "STABLE" = "STABLE";
      if (readings.length >= 2 && latestValue !== null) {
        const earliest = readings[0].soilMoisture;
        const diff = latestValue - earliest;
        if (diff > 1.0) trend = "RISING";
        else if (diff < -1.0) trend = "FALLING";
      }

      const belowThreshold = latestValue !== null ? latestValue < field.soilMoistureThreshold : false;

      const summary = {
        fieldId: field.id,
        fieldName: field.name,
        hoursRequested: hours,
        readingsCount: readings.length,
        latestValue,
        threshold: field.soilMoistureThreshold,
        below_threshold: belowThreshold,
        trend,
        readings: readings.slice(-10).map((r) => ({
          recordedAt: r.recordedAt.toISOString(),
          soilMoisture: r.soilMoisture,
          temperature: r.temperature,
          humidity: r.humidity,
        })),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  // --------------------------------------------------------------------------
  // Tool 4: get_detection_history
  // --------------------------------------------------------------------------
  server.registerTool(
    "get_detection_history",
    {
      description:
        "Retrieves recent computer-vision crop disease and pest detections for a field, including detection label, confidence percentage, status, coordinates, and timestamp.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field"),
        limit: z.number().int().positive().max(50).default(5).describe("Maximum number of detections to retrieve (default 5)"),
      },
    },
    async ({ field_id, limit = 5 }) => {
      const field = await prisma.field.findUnique({
        where: { id: field_id },
        select: { id: true, name: true },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const detections = await prisma.detection.findMany({
        where: { fieldId: field_id },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                fieldId: field.id,
                fieldName: field.name,
                count: detections.length,
                detections,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // --------------------------------------------------------------------------
  // Tool 5: get_active_decisions
  // --------------------------------------------------------------------------
  server.registerTool(
    "get_active_decisions",
    {
      description:
        "Retrieves all active or scheduled agronomic decisions (status PENDING or SCHEDULED) for a field, including action type, reasoning, scheduled time, and override status.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field"),
      },
    },
    async ({ field_id }) => {
      const field = await prisma.field.findUnique({
        where: { id: field_id },
        select: { id: true, name: true },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const decisions = await prisma.decision.findMany({
        where: {
          fieldId: field_id,
          status: { in: ["PENDING", "SCHEDULED"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          detection: true,
          alerts: true,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                fieldId: field.id,
                fieldName: field.name,
                activeDecisionsCount: decisions.length,
                decisions,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // --------------------------------------------------------------------------
  // Tool 6: schedule_irrigation (Write Tool)
  // --------------------------------------------------------------------------
  server.registerTool(
    "schedule_irrigation",
    {
      description:
        "Schedules a simulated irrigation cycle for a field at a future date/time. Creates a simulated Decision and Alert. Enforces 60-second idempotency.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field"),
        start_time_iso: z.string().describe("ISO 8601 string representing when irrigation should begin"),
        duration_minutes: z.number().positive().describe("Duration of the irrigation in minutes"),
        reason: z.string().describe("Agronomic justification for irrigation (e.g. soil moisture below 35% threshold)"),
        source: z.enum(["CHATBOT", "N8N"]).optional().default("CHATBOT").describe("Origin of the decision: CHATBOT or N8N"),
      },
    },
    async ({ field_id, start_time_iso, duration_minutes, reason, source = "CHATBOT" }) => {
      // 1. Idempotency Check (60 seconds)
      const cacheKey = `schedule_irrigation:${field_id}:${start_time_iso}:${duration_minutes}:${reason}:${source}`;
      const cached = getCachedResult(cacheKey);
      if (cached) {
        return {
          content: [{ type: "text", text: JSON.stringify(cached, null, 2) }],
        };
      }

      const field = await prisma.field.findUnique({
        where: { id: field_id },
        select: { id: true, name: true, crop: true },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const scheduledDate = new Date(start_time_iso);
      const decisionSource: DecisionSource = source === "N8N" ? "N8N" : "CHATBOT";

      // 2. Create Decision
      const decision = await prisma.decision.create({
        data: {
          fieldId: field.id,
          action: "IRRIGATE",
          status: "SCHEDULED",
          scheduledFor: scheduledDate,
          reasoning: reason,
          simulated: true,
          source: decisionSource,
        },
        include: {
          field: { select: { id: true, name: true, crop: true } },
        },
      });

      // 3. Create linked Alert
      const alert = await prisma.alert.create({
        data: {
          fieldId: field.id,
          decisionId: decision.id,
          severity: "LOW",
          title: `Scheduled Irrigation: ${field.name}`,
          message: `Irrigation scheduled for ${start_time_iso} (${duration_minutes} min). Reason: ${reason}`,
          messageBn: `${field.name} জমিতে সেচ নির্ধারণ করা হয়েছে (${duration_minutes} মিনিট)। কারণ: ${reason}`,
          source: decisionSource,
          read: false,
        },
      });

      // 4. Recompute Yield
      try {
        await computeAndSaveYield(field.id);
      } catch (yErr) {
        console.warn("Could not recompute yield:", yErr);
      }

      const result = {
        success: true,
        idempotent: false,
        decision,
        alert,
      };

      setCachedResult(cacheKey, result);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // --------------------------------------------------------------------------
  // Tool 7: pause_irrigation (Write Tool)
  // --------------------------------------------------------------------------
  server.registerTool(
    "pause_irrigation",
    {
      description:
        "Pauses active or scheduled irrigation for a field (e.g., in response to forecasted rain or water conservation). Creates a simulated Decision and Alert. Enforces 60-second idempotency.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field"),
        reason: z.string().describe("Agronomic justification for pausing irrigation (e.g. imminent rainfall)"),
        source: z.enum(["CHATBOT", "N8N"]).optional().default("CHATBOT").describe("Origin of the decision: CHATBOT or N8N"),
      },
    },
    async ({ field_id, reason, source = "CHATBOT" }) => {
      const cacheKey = `pause_irrigation:${field_id}:${reason}:${source}`;
      const cached = getCachedResult(cacheKey);
      if (cached) {
        return {
          content: [{ type: "text", text: JSON.stringify(cached, null, 2) }],
        };
      }

      const field = await prisma.field.findUnique({
        where: { id: field_id },
        select: { id: true, name: true },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const decisionSource: DecisionSource = source === "N8N" ? "N8N" : "CHATBOT";

      const decision = await prisma.decision.create({
        data: {
          fieldId: field.id,
          action: "PAUSE_IRRIGATION",
          status: "SCHEDULED",
          reasoning: reason,
          simulated: true,
          source: decisionSource,
        },
        include: {
          field: { select: { id: true, name: true, crop: true } },
        },
      });

      const alert = await prisma.alert.create({
        data: {
          fieldId: field.id,
          decisionId: decision.id,
          severity: "LOW",
          title: `Irrigation Paused: ${field.name}`,
          message: `Irrigation paused. Reason: ${reason}`,
          messageBn: `${field.name} জমিতে সেচ স্থগিত করা হয়েছে। কারণ: ${reason}`,
          source: decisionSource,
          read: false,
        },
      });

      try {
        await computeAndSaveYield(field.id);
      } catch (yErr) {
        console.warn("Could not recompute yield:", yErr);
      }

      const result = {
        success: true,
        idempotent: false,
        decision,
        alert,
      };

      setCachedResult(cacheKey, result);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // --------------------------------------------------------------------------
  // Tool 8: trigger_irrigation (Write Tool)
  // --------------------------------------------------------------------------
  server.registerTool(
    "trigger_irrigation",
    {
      description:
        "Immediately triggers a simulated irrigation cycle for a field. Creates a simulated Decision with status COMPLETED and an Alert. Enforces 60-second idempotency.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field"),
        duration_minutes: z.number().positive().describe("Duration of immediate irrigation in minutes"),
        reason: z.string().describe("Immediate agronomic justification for emergency or manual irrigation"),
        source: z.enum(["CHATBOT", "N8N"]).optional().default("CHATBOT").describe("Origin of the decision: CHATBOT or N8N"),
      },
    },
    async ({ field_id, duration_minutes, reason, source = "CHATBOT" }) => {
      const cacheKey = `trigger_irrigation:${field_id}:${duration_minutes}:${reason}:${source}`;
      const cached = getCachedResult(cacheKey);
      if (cached) {
        return {
          content: [{ type: "text", text: JSON.stringify(cached, null, 2) }],
        };
      }

      const field = await prisma.field.findUnique({
        where: { id: field_id },
        select: { id: true, name: true },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const decisionSource: DecisionSource = source === "N8N" ? "N8N" : "CHATBOT";

      const decision = await prisma.decision.create({
        data: {
          fieldId: field.id,
          action: "IRRIGATE",
          status: "COMPLETED",
          reasoning: `Immediate irrigation executed (${duration_minutes}m): ${reason}`,
          simulated: true,
          source: decisionSource,
        },
        include: {
          field: { select: { id: true, name: true, crop: true } },
        },
      });

      const alert = await prisma.alert.create({
        data: {
          fieldId: field.id,
          decisionId: decision.id,
          severity: "LOW",
          title: `Immediate Irrigation Executed: ${field.name}`,
          message: `Immediate irrigation (${duration_minutes}m) executed. Reason: ${reason}`,
          messageBn: `${field.name} জমিতে তাৎক্ষণিক সেচ কার্যকর করা হয়েছে (${duration_minutes} মিনিট)। কারণ: ${reason}`,
          source: decisionSource,
          read: false,
        },
      });

      try {
        await computeAndSaveYield(field.id);
      } catch (yErr) {
        console.warn("Could not recompute yield:", yErr);
      }

      const result = {
        success: true,
        idempotent: false,
        decision,
        alert,
      };

      setCachedResult(cacheKey, result);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // --------------------------------------------------------------------------
  // Tool 9: schedule_spray (Write Tool with AI Safety Rule)
  // --------------------------------------------------------------------------
  server.registerTool(
    "schedule_spray",
    {
      description:
        "Schedules simulated chemical crop protection spraying. ENFORCES AI SAFETY RULE: Refuses to schedule or execute spraying if rain probability in the next 6 hours exceeds 50%. Enforces 60-second idempotency.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field"),
        start_time_iso: z.string().describe("ISO 8601 string representing scheduled spray time"),
        reason: z.string().describe("Agronomic justification for spraying (e.g. targeted blight treatment)"),
        source: z.enum(["CHATBOT", "N8N"]).optional().default("CHATBOT").describe("Origin of the decision: CHATBOT or N8N"),
      },
    },
    async ({ field_id, start_time_iso, reason, source = "CHATBOT" }) => {
      const cacheKey = `schedule_spray:${field_id}:${start_time_iso}:${reason}:${source}`;
      const cached = getCachedResult(cacheKey);
      if (cached) {
        return {
          content: [{ type: "text", text: JSON.stringify(cached, null, 2) }],
        };
      }

      const field = await prisma.field.findUnique({
        where: { id: field_id },
        select: { id: true, name: true },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      // Check AI Safety Rule: 6-hour rain probability > 50%
      const weather = await getOrFetchWeather(field.id);
      if (weather.rainProbability6h > 50) {
        const violationResponse = {
          success: false,
          refused: true,
          safetyViolation: true,
          rule: "Never recommend or execute spraying when rain probability > 50% within next 6 hours.",
          rainProbability6h: weather.rainProbability6h,
          message: `AI Safety Rule Violation: Spraying refused. The forecasted rain probability over the next 6 hours is ${weather.rainProbability6h}%, exceeding the 50% safety guard threshold. Spraying under rain conditions wastes expensive agrochemicals and causes toxic environmental runoff into waterways.`,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(violationResponse, null, 2),
            },
          ],
          isError: true,
        };
      }

      const scheduledDate = new Date(start_time_iso);
      const decisionSource: DecisionSource = source === "N8N" ? "N8N" : "CHATBOT";

      const decision = await prisma.decision.create({
        data: {
          fieldId: field.id,
          action: "SPRAY_NOW",
          status: "SCHEDULED",
          scheduledFor: scheduledDate,
          reasoning: reason,
          simulated: true,
          source: decisionSource,
        },
        include: {
          field: { select: { id: true, name: true, crop: true } },
        },
      });

      const alert = await prisma.alert.create({
        data: {
          fieldId: field.id,
          decisionId: decision.id,
          severity: "MEDIUM",
          title: `Crop Protection Spray Scheduled: ${field.name}`,
          message: `Spray scheduled for ${start_time_iso}. Reason: ${reason}`,
          messageBn: `${field.name} জমিতে স্প্রে নির্ধারণ করা হয়েছে। কারণ: ${reason}`,
          source: decisionSource,
          read: false,
        },
      });

      try {
        await computeAndSaveYield(field.id);
      } catch (yErr) {
        console.warn("Could not recompute yield:", yErr);
      }

      const result = {
        success: true,
        idempotent: false,
        decision,
        alert,
      };

      setCachedResult(cacheKey, result);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // --------------------------------------------------------------------------
  // Tool 10: estimate_yield
  // --------------------------------------------------------------------------
  server.registerTool(
    "estimate_yield",
    {
      description:
        "Runs the YieldMax predictive yield engine for a field, returning projected tons per hectare, confidence score, optimal harvest window, and impact factor waterfall based on telemetry and weather stress.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field"),
      },
    },
    async ({ field_id }) => {
      const field = await prisma.field.findUnique({
        where: { id: field_id },
        select: { id: true, name: true, crop: true, areaHa: true },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const computation = await computeAndSaveYield(field_id);
      if (!computation) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "COMPUTATION_FAILED",
                  message: "Could not compute yield estimate for field.",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const response = {
        fieldId: field.id,
        fieldName: field.name,
        crop: field.crop,
        areaHa: field.areaHa,
        tonsPerHa: computation.yieldResult.tonsPerHa,
        confidence: computation.yieldResult.confidence,
        harvestWindow: computation.yieldResult.harvestWindow,
        factors: computation.yieldResult.factors,
        predictionId: computation.prediction.id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  // --------------------------------------------------------------------------
  // Tool 11: create_alert (Write Tool)
  // --------------------------------------------------------------------------
  server.registerTool(
    "create_alert",
    {
      description:
        "Creates an agronomic alert for the farmer and logs an accompanying simulated Decision record with status PENDING. Enforces 60-second idempotency.",
      inputSchema: {
        field_id: z.string().describe("The unique ID of the field"),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).describe("Severity level of the alert"),
        title: z.string().describe("Alert headline / title"),
        message: z.string().describe("Detailed alert message for the farmer in English or Bangla"),
        source: z.enum(["CHATBOT", "N8N", "MANUAL"]).optional().default("CHATBOT").describe("Source of the alert"),
      },
    },
    async ({ field_id, severity, title, message, source = "CHATBOT" }) => {
      const cacheKey = `create_alert:${field_id}:${severity}:${title}:${message}:${source}`;
      const cached = getCachedResult(cacheKey);
      if (cached) {
        return {
          content: [{ type: "text", text: JSON.stringify(cached, null, 2) }],
        };
      }

      const field = await prisma.field.findUnique({
        where: { id: field_id },
        select: { id: true, name: true },
      });

      if (!field) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "NOT_FOUND",
                  message: `Field not found with ID '${field_id}'.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const decisionSource: DecisionSource = source === "N8N" ? "N8N" : "CHATBOT";

      const decision = await prisma.decision.create({
        data: {
          fieldId: field.id,
          action: "INSPECT",
          status: "PENDING",
          reasoning: `Alert Created: ${title} - ${message}`,
          simulated: true,
          source: decisionSource,
        },
        include: {
          field: { select: { id: true, name: true, crop: true } },
        },
      });

      const alert = await prisma.alert.create({
        data: {
          fieldId: field.id,
          decisionId: decision.id,
          severity: severity as AlertSeverity,
          title,
          message,
          source: decisionSource,
          read: false,
        },
      });

      const result = {
        success: true,
        idempotent: false,
        decision,
        alert,
      };

      setCachedResult(cacheKey, result);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
