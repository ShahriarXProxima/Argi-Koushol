import { z } from "zod";
import { sendWhatsApp, formatFarmerWhatsAppMessage } from "@/lib/notify";
import { jsonSuccess, jsonError, handleZodError, requireApiKey } from "@/lib/api";

const notifyRequestSchema = z.object({
  to: z.string().optional(),
  body: z.string().optional(),
  alertId: z.string().optional(),
  // Structured parameters (optional shorthand for automated pipelines)
  fieldName: z.string().optional(),
  problem: z.string().optional(),
  decision: z.string().optional(),
  newTimeIso: z.string().optional().nullable(),
  dashboardUrl: z.string().optional(),
});

export async function POST(request: Request) {
  // 1. Authenticate with INGEST_API_KEY
  const authError = requireApiKey(request);
  if (authError) return authError;

  // 2. Parse & validate JSON payload
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("BAD_REQUEST", "Invalid JSON request body", 400);
  }

  const parsed = notifyRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return handleZodError(parsed.error);
  }

  const { to, alertId, fieldName, problem, decision, newTimeIso, dashboardUrl } = parsed.data;

  // Build message text: either explicit body or structured short farmer format
  let messageText = parsed.data.body?.trim();

  if (!messageText) {
    if (fieldName && problem && decision) {
      messageText = formatFarmerWhatsAppMessage({
        fieldName,
        problem,
        decision,
        newTimeIso,
        dashboardUrl,
      });
    } else {
      return jsonError(
        "VALIDATION_ERROR",
        "Either 'body' or ('fieldName', 'problem', 'decision') must be provided."
      );
    }
  }

  // 3. Dispatch WhatsApp notification
  const result = await sendWhatsApp({
    to,
    body: messageText,
    alertId,
  });

  return jsonSuccess(
    {
      success: result.success,
      status: result.status,
      sid: result.sid,
      alertUpdated: result.alertUpdated ?? false,
      messagePreview: messageText.slice(0, 100),
    },
    result.status === "sent" ? 200 : 200
  );
}
