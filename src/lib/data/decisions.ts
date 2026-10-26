import "server-only";
import { prisma } from "@/lib/prisma";
import { createAlert } from "./alerts";
import { recomputeFieldYieldPrediction } from "./yield";
import type { DecisionAction, DecisionStatus, DecisionSource, AlertSeverity } from "@prisma/client";

export class SafetyViolationError extends Error {
  code = "AI_SAFETY_VIOLATION";
  constructor(message: string) {
    super(message);
    this.name = "SafetyViolationError";
  }
}

export interface CreateDecisionInput {
  fieldId: string;
  detectionId?: string | null;
  action: DecisionAction;
  reasoning: string;
  scheduledFor?: Date | string | null;
  severity: AlertSeverity;
  farmerMessage: string;
  farmerMessageBn?: string | null;
  source: DecisionSource;
  simulated?: boolean;
}

export interface OverrideDecisionInput {
  decisionId: string;
  action: "cancel" | "reschedule";
  newTime?: Date | string | null;
}

/**
 * Creates an autonomous Decision and its associated Alert while enforcing AI safety rules.
 * AI Safety Rules:
 * 1. Never recommend or execute SPRAY_NOW when rain probability > 50% within next 6 hours.
 * 2. If detection confidence < 0.6, the decision must be forced to INSPECT.
 */
export async function createDecision(input: CreateDecisionInput) {
  let finalAction = input.action;
  let finalReasoning = input.reasoning;

  // 1. Rule 1: Check rain safety guard for SPRAY_NOW
  if (finalAction === "SPRAY_NOW") {
    const latestWeather = await prisma.weatherLog.findFirst({
      where: { fieldId: input.fieldId },
      orderBy: { fetchedAt: "desc" },
    });

    if (latestWeather && latestWeather.rainProbability6h > 50) {
      throw new SafetyViolationError(
        `AI Safety Rule Violation: Cannot execute SPRAY_NOW when 6-hour rain probability (${latestWeather.rainProbability6h}%) exceeds the 50% safety guard threshold.`
      );
    }
  }

  // 2. Rule 2: Check detection confidence < 0.6 => force INSPECT
  if (input.detectionId) {
    const detection = await prisma.detection.findUnique({
      where: { id: input.detectionId },
    });

    if (detection && detection.confidence < 0.6) {
      if (finalAction !== "INSPECT") {
        finalAction = "INSPECT";
        finalReasoning = `[AI Guard: Confidence ${Math.round(
          detection.confidence * 100
        )}% is below 60% threshold - forced INSPECT] ${finalReasoning}`;
      }
    }
  }

  // 3. Create the Decision
  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : null;
  const decision = await prisma.decision.create({
    data: {
      fieldId: input.fieldId,
      detectionId: input.detectionId ?? null,
      action: finalAction,
      reasoning: finalReasoning,
      scheduledFor,
      status: "PENDING",
      source: input.source,
      simulated: input.simulated ?? true,
    },
    include: {
      field: {
        select: { id: true, name: true, crop: true },
      },
      detection: true,
    },
  });

  // 4. Create the linked Alert
  const alert = await createAlert({
    fieldId: input.fieldId,
    decisionId: decision.id,
    severity: input.severity,
    title: `Decision: ${finalAction} (${decision.field.name})`,
    message: input.farmerMessage,
    messageBn: input.farmerMessageBn ?? null,
    source: input.source,
  });

  // Recompute field yield prediction after new Decision
  try {
    await recomputeFieldYieldPrediction(input.fieldId);
  } catch (err) {
    console.error("Failed to recompute yield after decision:", err);
  }

  return { decision, alert };
}

/**
 * Updates status of an existing decision
 */
export async function updateDecisionStatus(
  id: string,
  status: DecisionStatus,
  reasoningUpdate?: string
) {
  const current = await prisma.decision.findUnique({ where: { id } });
  if (!current) return null;

  return prisma.decision.update({
    where: { id },
    data: {
      status,
      ...(reasoningUpdate
        ? { reasoning: `${current.reasoning} | Update: ${reasoningUpdate}` }
        : {}),
    },
    include: {
      field: true,
      detection: true,
    },
  });
}

/**
 * Farmer override handler: cancels or reschedules a decision and creates a MANUAL alert
 */
export async function overrideDecision(input: OverrideDecisionInput) {
  const decision = await prisma.decision.findUnique({
    where: { id: input.decisionId },
    include: { field: true },
  });

  if (!decision) {
    throw new Error(`Decision with ID '${input.decisionId}' not found.`);
  }

  let updatedDecision;
  let alertTitle = "";
  let alertMessage = "";
  let alertMessageBn = "";

  if (input.action === "cancel") {
    updatedDecision = await prisma.decision.update({
      where: { id: input.decisionId },
      data: {
        status: "OVERRIDDEN",
        reasoning: `${decision.reasoning} [Manually cancelled by farmer]`,
      },
      include: { field: true },
    });

    alertTitle = `ম্যানুয়াল বাতিল: ${decision.action}`;
    alertMessage = `Farmer manually cancelled decision #${decision.id.slice(-6)} for ${decision.field.name}.`;
    alertMessageBn = `কৃষক কর্তৃক ${decision.field.name}-এর ${decision.action} সিদ্ধান্তটি ম্যানুয়ালি বাতিল করা হয়েছে।`;
  } else {
    const rescheduleTime = input.newTime ? new Date(input.newTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    updatedDecision = await prisma.decision.update({
      where: { id: input.decisionId },
      data: {
        status: "SCHEDULED",
        scheduledFor: rescheduleTime,
        reasoning: `${decision.reasoning} [Rescheduled by farmer to ${rescheduleTime.toISOString()}]`,
      },
      include: { field: true },
    });

    alertTitle = `পুনঃনির্ধারিত সিদ্ধান্ত: ${decision.action}`;
    alertMessage = `Farmer rescheduled decision #${decision.id.slice(-6)} to ${rescheduleTime.toLocaleTimeString()}.`;
    alertMessageBn = `কৃষক কর্তৃক সিদ্ধান্ত #${decision.id.slice(-6)} সময় পরিবর্তন করে ${rescheduleTime.toLocaleString("bn-BD")} করা হয়েছে।`;
  }

  // Create manual audit alert
  const alert = await createAlert({
    fieldId: decision.fieldId,
    decisionId: decision.id,
    severity: "MEDIUM",
    title: alertTitle,
    message: alertMessage,
    messageBn: alertMessageBn,
    source: "MANUAL",
    whatsappStatus: "LOGGED",
  });

  // Recompute field yield prediction after override
  try {
    await recomputeFieldYieldPrediction(decision.fieldId);
  } catch (err) {
    console.error("Failed to recompute yield after override:", err);
  }

  return { decision: updatedDecision, alert };
}

/**
 * Retrieve all decisions for a field, newest first
 */
export async function getFieldDecisions(fieldId: string) {
  return prisma.decision.findMany({
    where: { fieldId },
    orderBy: { createdAt: "desc" },
    include: {
      detection: true,
      alerts: true,
    },
  });
}
