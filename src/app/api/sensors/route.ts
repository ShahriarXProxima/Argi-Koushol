import { type NextRequest } from "next/server";
import { z } from "zod";
import { getSensors, getReadings, recordSensorReading } from "@/lib/data/sensors";
import { jsonSuccess, jsonError, handleZodError, requireApiKey, isNextPrerenderError } from "@/lib/api";

const recordReadingSchema = z.object({
  fieldId: z.string().min(1, "fieldId is required"),
  soilMoisture: z
    .number()
    .min(0, "Soil moisture cannot be negative")
    .max(100, "Soil moisture cannot exceed 100%"),
  temperature: z
    .number()
    .min(-20, "Temperature too low")
    .max(65, "Temperature too high"),
  humidity: z
    .number()
    .min(0, "Humidity cannot be negative")
    .max(100, "Humidity cannot exceed 100%"),
  ph: z
    .number()
    .min(0, "pH must be between 0 and 14")
    .max(14, "pH must be between 0 and 14")
    .optional()
    .nullable(),
  recordedAt: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const fieldId = request.nextUrl.searchParams.get("fieldId") || undefined;
    const hoursParam = request.nextUrl.searchParams.get("hours");
    const hours = hoursParam ? Math.max(1, parseInt(hoursParam, 10)) : 24;

    if (fieldId) {
      const readings = await getReadings(fieldId, hours);
      return jsonSuccess({ fieldId, hours, readings, count: readings.length });
    }

    const sensors = await getSensors();
    return jsonSuccess({ sensors, count: sensors.length });
  } catch (error) {
    if (isNextPrerenderError(error)) throw error;
    console.error("Error fetching sensor data:", error);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve sensor data.", 500);
  }
}

export async function POST(request: Request) {
  // 1. Authenticate with INGEST_API_KEY
  const authError = requireApiKey(request);
  if (authError) return authError;

  // 2. Parse and validate JSON body
  try {
    const body = await request.json();
    const parsed = recordReadingSchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const reading = await recordSensorReading(parsed.data);
    return jsonSuccess({ success: true, reading }, 201);
  } catch (error) {
    console.error("Error recording sensor reading:", error);
    return jsonError("INTERNAL_ERROR", "Failed to record sensor reading.", 500);
  }
}
