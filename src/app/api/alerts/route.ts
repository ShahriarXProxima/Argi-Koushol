import { type NextRequest } from "next/server";
import { getAlerts } from "@/lib/data/alerts";
import { jsonSuccess, jsonError, isNextPrerenderError } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const unreadOnly = request.nextUrl.searchParams.get("unreadOnly") === "true";
    const fieldId = request.nextUrl.searchParams.get("fieldId") || undefined;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 50;

    const alerts = await getAlerts({ unreadOnly, fieldId, limit });
    return jsonSuccess({ alerts, count: alerts.length });
  } catch (error) {
    if (isNextPrerenderError(error)) throw error;
    console.error("Error retrieving alerts:", error);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve alerts.", 500);
  }
}
