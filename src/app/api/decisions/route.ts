import { z } from "zod";
import { createDecision, SafetyViolationError } from "@/lib/data/decisions";
import { jsonSuccess, jsonError, handleZodError, requireApiKey } from "@/lib/api";


const createDecisionSchema = z.object({
  fieldId: z.string().min(1, "fieldId is required"),
  detectionId: z.string().optional().nullable(),
  action: z.enum([
    "SPRAY_NOW",
    "DELAY_SPRAY",
    "IRRIGATE",
    "PAUSE_IRRIGATION",
    "INSPECT",
    "NO_ACTION",
  ]),
  reasoning: z.string().min(1, "reasoning is required"),
  scheduledFor: z.string().optional().nullable(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  farmerMessage: z.string().min(1, "farmerMessage is required"),
  farmerMessageBn: z.string().optional().nullable(),
  source: z.enum(["N8N", "CHATBOT", "MANUAL"]).default("N8N"),
  simulated: z.boolean().default(true),
});

export async function POST(request: Request) {
  // 1. Authenticate with INGEST_API_KEY
  const authError = requireApiKey(request);
  if (authError) return authError;

  // 2. Parse and validate payload
  try {
    const body = await request.json();
    const parsed = createDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const { decision, alert } = await createDecision(parsed.data);
    return jsonSuccess({ success: true, decision, alert }, 201);
  } catch (error) {
    if (error instanceof SafetyViolationError) {
      return jsonError("AI_SAFETY_VIOLATION", error.message, 422);
    }

    console.error("Error creating autonomous decision:", error);
    return jsonError("INTERNAL_ERROR", "Failed to process autonomous decision.", 500);
  }
}
