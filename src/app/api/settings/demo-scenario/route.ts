import { z } from "zod";
import { getDemoScenario, setDemoScenario } from "@/lib/data/settings";
import { jsonSuccess, jsonError, handleZodError } from "@/lib/api";


const updateScenarioSchema = z.object({
  scenario: z.enum(["NORMAL", "HEAVY_RAIN_4H", "HEATWAVE"]),
});

export async function GET() {
  try {
    const demoScenario = await getDemoScenario();
    return jsonSuccess({ demoScenario });
  } catch (error) {
    console.error("Error retrieving demo scenario:", error);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve demo scenario.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateScenarioSchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const updated = await setDemoScenario(parsed.data.scenario);
    return jsonSuccess({ success: true, demoScenario: updated });
  } catch (error) {
    console.error("Error updating demo scenario:", error);
    return jsonError("INTERNAL_ERROR", "Failed to update demo scenario.", 500);
  }
}
