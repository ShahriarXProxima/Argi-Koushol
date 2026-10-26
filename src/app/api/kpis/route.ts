import { getDashboardKpis } from "@/lib/data/kpis";
import { jsonSuccess, jsonError } from "@/lib/api";


export async function GET() {
  try {
    const kpis = await getDashboardKpis();
    return jsonSuccess({ kpis });
  } catch (error) {
    console.error("Error computing dashboard KPIs:", error);
    return jsonError("INTERNAL_ERROR", "Failed to compute dashboard KPIs.", 500);
  }
}
