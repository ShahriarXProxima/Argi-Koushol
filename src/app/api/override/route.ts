import { z } from "zod";
import { overrideDecision } from "@/lib/data/decisions";
import { jsonSuccess, jsonError, handleZodError } from "@/lib/api";


const overrideSchema = z.object({
  decisionId: z.string().min(1, "decisionId is required"),
  action: z.enum(["cancel", "reschedule"]),
  newTime: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = overrideSchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const result = await overrideDecision(parsed.data);
    return jsonSuccess({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to override decision.";
    if (message.includes("not found")) {
      return jsonError("NOT_FOUND", message, 404);
    }

    console.error("Error processing farmer override:", error);
    return jsonError("INTERNAL_ERROR", "Failed to process farmer override request.", 500);
  }
}
