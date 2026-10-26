import "server-only";
import { prisma } from "@/lib/prisma";
import type { Field, SensorReading, WeatherLog, Decision, YieldPrediction, Detection } from "@prisma/client";

export interface FieldWithDetails extends Field {
  latestReading?: SensorReading | null;
  latestWeatherLog?: WeatherLog | null;
  activeDecisions: Decision[];
  yieldPrediction?: YieldPrediction | null;
  detections: Detection[];
}

/**
 * Retrieve all fields with their latest reading summary, weather, and detections
 */
export async function getFields() {
  const fields = await prisma.field.findMany({
    orderBy: { name: "asc" },
    include: {
      sensors: true,
      detections: {
        orderBy: { createdAt: "desc" },
      },
      yieldPredictions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      readings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      weatherLogs: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
    },
  });

  return fields.map((f) => ({
    ...f,
    latestReading: f.readings[0] || null,
    latestWeatherLog: f.weatherLogs[0] || null,
    yieldPrediction: f.yieldPredictions[0] || null,
    detections: f.detections,
  }));
}

/**
 * Retrieve a single field by ID including latest reading, latest weather log, and active decisions
 */
export async function getField(id: string): Promise<FieldWithDetails | null> {
  const field = await prisma.field.findUnique({
    where: { id },
    include: {
      sensors: true,
      detections: {
        orderBy: { createdAt: "desc" },
      },
      readings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      weatherLogs: {
        orderBy: { fetchedAt: "desc" },
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
        take: 1,
      },
    },
  });

  if (!field) return null;

  return {
    ...field,
    latestReading: field.readings[0] || null,
    latestWeatherLog: field.weatherLogs[0] || null,
    activeDecisions: field.decisions,
    yieldPrediction: field.yieldPredictions[0] || null,
    detections: field.detections,
  };
}

/**
 * Retrieve yield prediction for a specific field
 */
export async function getYieldPrediction(fieldId: string) {
  return prisma.yieldPrediction.findFirst({
    where: { fieldId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieve all active detections across fields
 */
export async function getDetections() {
  return prisma.detection.findMany({
    orderBy: { createdAt: "desc" },
    include: { field: { select: { id: true, name: true, crop: true } } },
  });
}
