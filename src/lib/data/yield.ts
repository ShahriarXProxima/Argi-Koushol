import "server-only";
import { prisma } from "@/lib/prisma";
import { estimateYield, type EstimateYieldInput, type YieldEstimateResult } from "@/lib/yield";

export interface RecomputeYieldOptions {
  untreatedBlightDays?: number;
}

/**
 * Recomputes the crop yield prediction for a field from its latest telemetry,
 * weather forecasts, active disease detections, and scheduled decisions,
 * and records a new YieldPrediction row in the database.
 */
export async function recomputeFieldYieldPrediction(
  fieldId: string,
  options?: RecomputeYieldOptions
) {
  const field = await prisma.field.findUnique({
    where: { id: fieldId },
    include: {
      readings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      weatherLogs: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
      detections: {
        where: {
          status: { in: ["FLAGGED", "CONFIRMED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      decisions: {
        where: {
          status: { in: ["PENDING", "SCHEDULED"] },
        },
        orderBy: { createdAt: "desc" },
      },
      yieldPredictions: {
        orderBy: { createdAt: "desc" },
        take: 2,
      },
    },
  });

  if (!field) {
    throw new Error(`Field with ID '${fieldId}' not found.`);
  }

  // 1. Evaluate Soil Health (0 to 1) from FDR soil moisture & pH
  let soilHealth = 0.85; // healthy benchmark
  const latestReading = field.readings[0];
  if (latestReading) {
    const moistureRatio = latestReading.soilMoisture / field.soilMoistureThreshold;
    if (moistureRatio >= 1.0) {
      soilHealth = Math.min(1.0, 0.85 + (moistureRatio - 1.0) * 0.15);
    } else {
      // Moisture deficit penalty
      soilHealth = Math.max(0.15, moistureRatio * 0.8);
    }

    // Optional pH balance evaluation (6.0 - 7.0 is optimal for rice/potato)
    if (latestReading.ph) {
      if (latestReading.ph < 5.5 || latestReading.ph > 7.8) {
        soilHealth = Math.max(0.2, soilHealth - 0.1);
      }
    }
  }

  // 2. Evaluate Active Disease Penalty (0 to 0.5) from Drone / AI Vision detections
  let activeDiseasePenalty = 0.0;
  const activeDetection = field.detections[0];
  if (activeDetection) {
    const isLateBlight =
      activeDetection.label.toLowerCase().includes("blight") ||
      activeDetection.label.toLowerCase().includes("infestans");

    if (isLateBlight) {
      activeDiseasePenalty = Math.min(0.45, activeDetection.confidence * 0.42);
    } else {
      activeDiseasePenalty = Math.min(0.3, activeDetection.confidence * 0.25);
    }
  }

  // 3. Evaluate Weather Stress (0 to 0.3) from latest WeatherLog
  let weatherStress = 0.0;
  let weatherDelayDays = 0;
  const latestWeather = field.weatherLogs[0];
  if (latestWeather) {
    // Excessive rain probability stress
    if (latestWeather.rainProbability6h > 50) {
      weatherStress += Math.min(0.15, (latestWeather.rainProbability6h / 100) * 0.2);
      weatherDelayDays += 2;
    }

    // Heat stress
    if (latestWeather.tempMax > 32) {
      weatherStress += Math.min(0.15, (latestWeather.tempMax - 32) * 0.04);
    }
  }

  // Check active decisions (e.g. DELAY_SPRAY adds delay)
  const hasDelayDecision = field.decisions.some((d) => d.action === "DELAY_SPRAY");
  if (hasDelayDecision) {
    weatherDelayDays += 2;
  }

  // 4. Run pure agronomic yield estimation
  const input: EstimateYieldInput = {
    crop: field.crop,
    soilHealth,
    activeDiseasePenalty,
    weatherStress: Math.min(0.3, weatherStress),
    plantedOn: field.plantedOn,
    cropDurationDays: field.cropDurationDays,
    weatherDelayDays,
    untreatedBlightDays: options?.untreatedBlightDays || 0,
  };

  const estimate: YieldEstimateResult = estimateYield(input);

  // 5. Record new YieldPrediction in database
  const prediction = await prisma.yieldPrediction.create({
    data: {
      fieldId: field.id,
      tonsPerHa: estimate.tonsPerHa,
      harvestDate: estimate.harvestWindow.optimal,
      confidence: estimate.confidence,
      factors: estimate.factors as unknown as object,
    },
  });

  return {
    estimate,
    prediction,
    field,
  };
}

/**
 * Retrieve all fields with their current and previous yield prediction to determine changes
 */
export async function getYieldOverview() {
  const fields = await prisma.field.findMany({
    orderBy: { name: "asc" },
    include: {
      readings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      weatherLogs: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
      detections: {
        where: {
          status: { in: ["FLAGGED", "CONFIRMED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      decisions: {
        where: {
          status: { in: ["PENDING", "SCHEDULED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      yieldPredictions: {
        orderBy: { createdAt: "desc" },
        take: 2,
      },
    },
  });

  return fields.map((f) => {
    const latestPrediction = f.yieldPredictions[0] || null;
    const previousPrediction = f.yieldPredictions[1] || null;

    let whatChanged = "গতকাল থেকে: স্থিতিশীল পূর্বাভাস (কোনো উল্লেখযোগ্য পরিবর্তন নেই)";
    let deltaYesterday = 0;

    if (latestPrediction && previousPrediction) {
      deltaYesterday = Number((latestPrediction.tonsPerHa - previousPrediction.tonsPerHa).toFixed(2));
      const percent = Number(((deltaYesterday / previousPrediction.tonsPerHa) * 100).toFixed(1));

      if (deltaYesterday > 0) {
        whatChanged = `গতকাল থেকে: +${deltaYesterday} টন/হেক্টর (+${percent}%) অনুকূল অবস্থার কারণে বৃদ্ধি`;
      } else if (deltaYesterday < 0) {
        whatChanged = `গতকাল থেকে: ${deltaYesterday} টন/হেক্টর (${percent}%) বালাই/আবহাওয়া চাপের কারণে হ্রাস`;
      }
    } else if (latestPrediction) {
      whatChanged = "প্রাথমিক মডেল প্রাক্কলন সক্রিয়";
    }

    return {
      field: f,
      latestPrediction,
      previousPrediction,
      whatChanged,
      deltaYesterday,
      latestReading: f.readings[0] || null,
      latestWeather: f.weatherLogs[0] || null,
      activeDetection: f.detections[0] || null,
      activeDecision: f.decisions[0] || null,
    };
  });
}

export type YieldOverviewItem = Awaited<ReturnType<typeof getYieldOverview>>[number];
