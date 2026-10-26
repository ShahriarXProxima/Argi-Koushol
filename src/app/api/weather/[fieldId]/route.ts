import { getOrFetchWeather } from "@/lib/weather";
import { jsonSuccess, jsonError, requireApiKey } from "@/lib/api";

interface Params {
  params: Promise<{ fieldId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  // 1. Authenticate with INGEST_API_KEY
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const { fieldId } = await params;
    if (!fieldId) {
      return jsonError("BAD_REQUEST", "Field ID is required", 400);
    }

    const weather = await getOrFetchWeather(fieldId);
    return jsonSuccess({ weather });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Field not found")) {
      return jsonError("NOT_FOUND", error.message, 404);
    }
    console.error("Error fetching weather forecast:", error);
    return jsonError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to fetch weather forecast",
      500
    );
  }
}
