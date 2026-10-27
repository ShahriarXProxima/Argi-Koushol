import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runAgent } from "@/lib/agent";
import { getOrFetchWeather } from "@/lib/weather";
import { jsonSuccess, jsonError, handleZodError, requireApiKey } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

const DECISION_SYSTEM_PROMPT =
  "You are the Agri-Koushol decision engine. Given a disease detection, gather facts with tools (check_field_status, get_current_weather, read_soil_moisture, get_detection_history), then choose one action. Rules: no spraying if rain probability in 6h > 50%, then DELAY_SPRAY to the next dry window; confidence < 0.6 means INSPECT; prefer the lowest-impact effective treatment. Respond ONLY with JSON. farmerMessage and farmerMessageBn must be short, plain-language, and state the field, the problem, the decision and the new time.";

const requestSchema = z.object({
  fieldId: z.string().min(1, "fieldId is required"),
  detectionId: z.string().optional().nullable(),
  context: z.string().optional().nullable(),
});

export const decisionOutputSchema = z.object({
  decision: z.enum([
    "SPRAY_NOW",
    "DELAY_SPRAY",
    "IRRIGATE",
    "PAUSE_IRRIGATION",
    "INSPECT",
    "NO_ACTION",
  ]),
  reasoning: z.string().min(1),
  rescheduleTimeIso: z.string().nullable(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  farmerMessage: z.string().min(1),
  farmerMessageBn: z.string().min(1),
});

export type DecisionOutput = z.infer<typeof decisionOutputSchema>;

const decisionJsonSchema = {
  type: "object",
  properties: {
    decision: {
      type: "string",
      enum: [
        "SPRAY_NOW",
        "DELAY_SPRAY",
        "IRRIGATE",
        "PAUSE_IRRIGATION",
        "INSPECT",
        "NO_ACTION",
      ],
    },
    reasoning: { type: "string" },
    rescheduleTimeIso: { type: ["string", "null"] },
    severity: {
      type: "string",
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    },
    farmerMessage: { type: "string" },
    farmerMessageBn: { type: "string" },
  },
  required: [
    "decision",
    "reasoning",
    "rescheduleTimeIso",
    "severity",
    "farmerMessage",
    "farmerMessageBn",
  ],
};

function parseJsonDecision(text: string): DecisionOutput | null {
  try {
    // Strip markdown code fence if present
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    const validated = decisionOutputSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
  } catch {
    // Parse error
  }
  return null;
}

export async function POST(request: Request) {
  // 1. Rate limiting: 30 decision requests per minute per IP
  const rateLimitError = checkRateLimit(request, {
    endpointPrefix: "/api/decide",
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (rateLimitError) return rateLimitError;

  // 2. Authenticate with INGEST_API_KEY
  const authError = requireApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const parsedRequest = requestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return handleZodError(parsedRequest.error);
  }

  const { fieldId, detectionId, context } = parsedRequest.data;

  // 2. Fetch Field and Detection records
  const field = await prisma.field.findUnique({ where: { id: fieldId } });
  if (!field) {
    return jsonError("NOT_FOUND", `Field not found with ID '${fieldId}'`, 404);
  }

  const detection = detectionId
    ? await prisma.detection.findUnique({ where: { id: detectionId } })
    : null;

  if (detectionId && !detection) {
    return jsonError(
      "NOT_FOUND",
      `Detection not found with ID '${detectionId}'`,
      404
    );
  }

  const userPrompt = detection
    ? `Crop disease detection event:
Field: "${field.name}" (ID: "${field.id}", Crop: "${field.crop}")
Detection ID: "${detection.id}"
Label: "${detection.label}"
Confidence: ${detection.confidence} (${Math.round(detection.confidence * 100)}%)
Timestamp: "${detection.createdAt.toISOString()}"

Gather telemetry using available tools (check_field_status, get_current_weather, read_soil_moisture, get_detection_history) and determine the autonomous agronomic decision. Respond ONLY with valid JSON.`
    : `Field agronomic telemetry event:
Field: "${field.name}" (ID: "${field.id}", Crop: "${field.crop}")
Context: "${context || "Telemetry review"}"

Gather telemetry using available tools (check_field_status, get_current_weather, read_soil_moisture, get_detection_history) and determine the autonomous agronomic decision (e.g. IRRIGATE if soil moisture is below threshold, PAUSE_IRRIGATION if rain is imminent, or NO_ACTION). Respond ONLY with valid JSON.`;

  // 3. Run Agent (First Attempt)
  let agentResult = await runAgent({
    system: DECISION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    jsonSchema: decisionJsonSchema,
    maxSteps: 6,
    timeoutMs: 30000,
  });

  let decisionData = parseJsonDecision(agentResult.text);

  // 4. Retry Once if JSON is invalid
  if (!decisionData) {
    console.warn("[POST /api/decide] First attempt produced invalid JSON. Retrying once...");
    agentResult = await runAgent({
      system: DECISION_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: agentResult.text },
        {
          role: "user",
          content:
            "The output was not valid JSON adhering strictly to the schema. Output ONLY the raw JSON object conforming to the required schema keys.",
        },
      ],
      jsonSchema: decisionJsonSchema,
      maxSteps: 3,
      timeoutMs: 20000,
    });

    decisionData = parseJsonDecision(agentResult.text);
  }

  // If still invalid after retry, synthesize structured fallback
  if (!decisionData) {
    const diseaseName = detection?.label ?? "Potential crop condition";
    decisionData = {
      decision: "INSPECT",
      reasoning: "LLM output formatting error. Defaulting to safe INSPECT action for farmer verification.",
      rescheduleTimeIso: null,
      severity: "MEDIUM",
      farmerMessage: `${field.name}: ${diseaseName} detected. Please inspect the field manually.`,
      farmerMessageBn: `${field.name}: ${diseaseName} শনাক্ত হয়েছে। অনুগ্রহ করে সরাসরি মাঠ পরিদর্শন করুন।`,
    };
  }

  // 5. Enforce AI Safety Rules in Code
  // Rule A: If detection confidence < 0.6 => decision must be forced to INSPECT
  if (detection && detection.confidence < 0.6) {
    decisionData.decision = "INSPECT";
    decisionData.reasoning = `[AI Safety Guard: Detection confidence ${Math.round(
      detection.confidence * 100
    )}% is below 60% threshold - forced INSPECT] ${decisionData.reasoning}`;
    decisionData.severity = "MEDIUM";
    decisionData.farmerMessage = `${field.name}: Possible ${detection.label} detected with low confidence (${Math.round(
      detection.confidence * 100
    )}%). Manual inspection recommended before chemical application.`;
    decisionData.farmerMessageBn = `${field.name}: কম আত্মবিশ্বাসের সাথে (${Math.round(
      detection.confidence * 100
    )}%) সম্ভাব্য ${detection.label} শনাক্ত হয়েছে। কোনো রাসায়নিক ব্যবহারের পূর্বে সরাসরি মাঠ পরিদর্শন করুন।`;
  }

  // Rule B: Never recommend or execute spraying when rain probability > 50% within next 6 hours
  const weather = await getOrFetchWeather(field.id);
  if (weather.rainProbability6h > 50 && decisionData.decision === "SPRAY_NOW") {
    decisionData.decision = "DELAY_SPRAY";
    const nextDryWindow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    decisionData.rescheduleTimeIso = nextDryWindow;
    decisionData.reasoning = `[AI Safety Guard: Rain probability in next 6h is ${weather.rainProbability6h}% (>50%) - forced DELAY_SPRAY to prevent chemical runoff] ${decisionData.reasoning}`;
    decisionData.farmerMessage = `${field.name}: ${detection ? detection.label : "Disease"} detected, but spray delayed due to high rain probability (${weather.rainProbability6h}%). Rescheduled to tomorrow.`;
    decisionData.farmerMessageBn = `${field.name}: ${detection ? detection.label : "রোগ"} শনাক্ত হয়েছে, কিন্তু আগামী ৬ ঘণ্টায় বৃষ্টির ঝুঁকি (${weather.rainProbability6h}%) থাকায় স্প্রে স্থগিত করে আগামীকাল নির্ধারণ করা হয়েছে।`;
  }

  return jsonSuccess({
    decision: decisionData,
    field: { id: field.id, name: field.name, crop: field.crop },
    detection: detection
      ? {
          id: detection.id,
          label: detection.label,
          confidence: detection.confidence,
        }
      : null,
    weather: {
      rainProbability6h: weather.rainProbability6h,
      rainMm48h: weather.rainMm48h,
      source: weather.source,
      stale: weather.stale,
    },
    toolCalls: agentResult.toolCalls,
  });
}
