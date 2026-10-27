import "server-only";
import { prisma } from "@/lib/prisma";

export interface RecordReadingInput {
  fieldId: string;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  ph?: number | null;
  recordedAt?: Date | string;
}

/**
 * Retrieve sensors optionally filtered by field
 */
export async function getSensors(fieldId?: string) {
  return prisma.sensor.findMany({
    where: fieldId ? { fieldId } : undefined,
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Retrieve hourly sensor readings for a field over a given number of hours
 */
export async function getReadings(fieldId: string, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return prisma.sensorReading.findMany({
    where: {
      fieldId,
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: "asc" },
  });
}

/**
 * Ingest a new sensor reading and update corresponding sensor lastValues
 */
export async function recordSensorReading(input: RecordReadingInput) {
  const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();

  // Validate that target field exists
  const field = await prisma.field.findUnique({
    where: { id: input.fieldId },
    select: { id: true },
  });

  if (!field) {
    throw new Error(`Field not found with ID '${input.fieldId}'`);
  }

  // 1. Create reading row
  const reading = await prisma.sensorReading.create({
    data: {
      fieldId: input.fieldId,
      soilMoisture: input.soilMoisture,
      temperature: input.temperature,
      humidity: input.humidity,
      ph: input.ph ?? null,
      recordedAt,
    },
  });

  // 2. Update latest values on known field sensors
  await Promise.all([
    prisma.sensor.updateMany({
      where: { fieldId: input.fieldId, type: "SOIL_MOISTURE" },
      data: { lastValue: input.soilMoisture, lastSeen: recordedAt },
    }),
    prisma.sensor.updateMany({
      where: { fieldId: input.fieldId, type: "TEMPERATURE" },
      data: { lastValue: input.temperature, lastSeen: recordedAt },
    }),
    input.ph != null
      ? prisma.sensor.updateMany({
          where: { fieldId: input.fieldId, type: "SOIL_PH" },
          data: { lastValue: input.ph, lastSeen: recordedAt },
        })
      : Promise.resolve(),
  ]);

  return reading;
}
