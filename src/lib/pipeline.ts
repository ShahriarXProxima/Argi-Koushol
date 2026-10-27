import { prisma } from "@/lib/prisma";
import { getOrFetchWeather, type WeatherForecastSummary } from "@/lib/weather";
import { recomputeFieldYieldPrediction } from "@/lib/data/yield";
import { sendWhatsApp, formatFarmerWhatsAppMessage } from "@/lib/notify";
import type { Decision, Alert, YieldPrediction } from "@prisma/client";

export interface PipelineDetectionInput {
  id: string;
  fieldId: string;
  label: string;
  confidence: number;
  imageUrl: string;
  lat?: number | null;
  lng?: number | null;
}

export interface PipelineResult {
  mode: "local" | "n8n_dispatched";
  decision: Decision | null;
  alert: Alert | null;
  weather: WeatherForecastSummary;
  yieldPrediction?: YieldPrediction | null;
  n8nDispatched?: boolean;
}

/**
 * Executes the autonomous agricultural response pipeline locally.
 * Steps:
 * 1. Fetch & summarize current weather (rain probability, storm risk)
 * 2. Evaluate autonomous agronomic decision with AI safety guards
 * 3. Persist Decision and Alert rows
 * 4. Recompute crop yield prediction (YieldMax)
 * 5. Send farmer notification via WhatsApp (Twilio or Simulated)
 */
export async function runLocalPipeline(detection: PipelineDetectionInput): Promise<PipelineResult> {
  console.log(`[Pipeline] Running local autonomous pipeline for Detection '${detection.id}' (Field '${detection.fieldId}')...`);

  // Step 1: Weather check
  const weather = await getOrFetchWeather(detection.fieldId);

  // Fetch field context
  const field = await prisma.field.findUnique({
    where: { id: detection.fieldId },
  });

  if (!field) {
    throw new Error(`Field not found with ID '${detection.fieldId}'`);
  }

  // Check human approval setting
  const approvalSetting = await prisma.appSetting.findUnique({
    where: { key: "human-approval-required" },
  });
  const requiresHumanApproval =
    approvalSetting?.value === true ||
    (typeof approvalSetting?.value === "object" &&
      (approvalSetting?.value as Record<string, unknown>)?.enabled === true);

  // Step 2: Autonomous Decision Evaluation
  const isHealthy =
    detection.label.toLowerCase().includes("healthy") ||
    detection.label.includes("সুস্থ");

  let decisionAction: "SPRAY_NOW" | "DELAY_SPRAY" | "IRRIGATE" | "PAUSE_IRRIGATION" | "INSPECT" | "NO_ACTION";
  let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  let reasoning: string;
  let rescheduleTimeIso: string | null = null;
  let farmerMessageEn: string;
  let farmerMessageBn: string;

  if (isHealthy) {
    decisionAction = "NO_ACTION";
    severity = "LOW";
    reasoning = `Autonomous drone scan confirmed healthy crop canopy condition (Confidence: ${Math.round(
      detection.confidence * 100
    )}%). No chemical treatment or irrigation adjustment needed.`;
    farmerMessageEn = `${field.name} (${field.crop}): Canopy is healthy. No action required.`;
    farmerMessageBn = `${field.name} (${field.crop}): ফসলের ক্যানোপি সম্পূর্ণ সুস্থ রয়েছে। কোনো ব্যবস্থার প্রয়োজন নেই।`;
  } else if (detection.confidence < 0.6) {
    // AI Safety Guard: Low confidence forces INSPECT
    decisionAction = "INSPECT";
    severity = "MEDIUM";
    reasoning = `[AI Safety Guard: Detection confidence ${Math.round(
      detection.confidence * 100
    )}% is below 60% threshold - forced INSPECT] Field verification required before applying agricultural inputs.`;
    farmerMessageEn = `${field.name} (${field.crop}): Possible ${detection.label} detected with low confidence (${Math.round(
      detection.confidence * 100
    )}%). Manual inspection recommended before chemical application.`;
    farmerMessageBn = `${field.name} (${field.crop}): কম আত্মবিশ্বাসের সাথে (${Math.round(
      detection.confidence * 100
    )}%) সম্ভাব্য ${detection.label} শনাক্ত হয়েছে। কোনো রাসায়নিক ব্যবহারের পূর্বে সরাসরি মাঠ পরিদর্শন করুন।`;
  } else if (weather.rainProbability6h > 50) {
    // AI Safety Guard: Rain > 50% forbids SPRAY_NOW, forces DELAY_SPRAY
    decisionAction = "DELAY_SPRAY";
    severity = "MEDIUM";
    const nextDryWindow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    rescheduleTimeIso = nextDryWindow;
    reasoning = `[AI Safety Guard: Rain probability in next 6h is ${weather.rainProbability6h}% (>50%) - forced DELAY_SPRAY to prevent chemical runoff] Spray delayed to next dry window to avoid wash-off and environmental leaching.`;
    farmerMessageEn = `${field.name} (${field.crop}): ${detection.label} detected, but spray delayed due to high rain probability (${weather.rainProbability6h}%). Rescheduled to tomorrow.`;
    farmerMessageBn = `${field.name} (${field.crop}): ${detection.label} শনাক্ত হয়েছে, কিন্তু আগামী ৬ ঘণ্টায় বৃষ্টির ঝুঁকি (${weather.rainProbability6h}%) থাকায় স্প্রে স্থগিত করে আগামীকাল নির্ধারণ করা হয়েছে।`;
  } else {
    // Favorable conditions & confirmed pathogen
    decisionAction = "SPRAY_NOW";
    severity = "HIGH";
    reasoning = `Confirmed ${detection.label} with high confidence (${Math.round(
      detection.confidence * 100
    )}%) and dry weather window (${weather.rainProbability6h}% rain risk). Precision drone spot-spraying scheduled to arrest pathogen spread.`;
    farmerMessageEn = `${field.name} (${field.crop}): ${detection.label} detected. Weather is favorable (${weather.rainProbability6h}% rain risk). Precision fungicide application scheduled immediately.`;
    farmerMessageBn = `${field.name} (${field.crop}): ${detection.label} শনাক্ত হয়েছে। আবহাওয়া অনুকূল (${weather.rainProbability6h}% বৃষ্টির ঝুঁকি)। অবিলম্বে লক্ষ্যযুক্ত স্প্রে নির্ধারণ করা হয়েছে।`;
  }

  // Determine initial status based on action and approval rules
  let decisionStatus: "PENDING" | "SCHEDULED" | "COMPLETED" = "SCHEDULED";
  if (decisionAction === "NO_ACTION") {
    decisionStatus = "COMPLETED";
  } else if (requiresHumanApproval && (severity as string) === "HIGH") {
    decisionStatus = "PENDING"; // Awaiting farmer manual override / authorization
    reasoning = `[Human Approval Guard: High severity action held for manual authorization] ${reasoning}`;
  } else if (decisionAction === "INSPECT") {
    decisionStatus = "PENDING";
  }

  // Step 3: Save Decision and Alert rows
  const decision = await prisma.decision.create({
    data: {
      fieldId: field.id,
      detectionId: detection.id,
      action: decisionAction,
      reasoning,
      scheduledFor: rescheduleTimeIso
        ? new Date(rescheduleTimeIso)
        : decisionAction === "SPRAY_NOW"
        ? new Date()
        : null,
      status: decisionStatus,
      source: "N8N",
      simulated: true,
    },
  });

  // Mark detection as PROCESSED
  await prisma.detection.update({
    where: { id: detection.id },
    data: { status: "PROCESSED" },
  });

  // Create Alert row
  const alert = await prisma.alert.create({
    data: {
      fieldId: field.id,
      decisionId: decision.id,
      severity,
      title: `${decisionAction}: ${detection.label}`,
      message: farmerMessageEn,
      messageBn: farmerMessageBn,
      source: "n8n",
      read: false,
      whatsappStatus: "PENDING",
    },
  });

  // Step 4: Recompute Yield Prediction
  let yieldPrediction: YieldPrediction | null = null;
  try {
    const yieldRes = await recomputeFieldYieldPrediction(field.id);
    yieldPrediction = yieldRes?.prediction || null;
  } catch (err) {
    console.warn(`[Pipeline] Yield recomputation warning for Field '${field.id}':`, err);
  }

  // Step 5: Send WhatsApp Notification (Short farmer format: field, problem, decision, new time, link)
  try {
    const waBody = formatFarmerWhatsAppMessage({
      fieldName: field.name,
      problem: detection.label,
      decision: decisionAction,
      newTimeIso: rescheduleTimeIso,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/fields/${field.id}`,
    });

    const waResult = await sendWhatsApp({
      body: waBody,
      alertId: alert.id,
    });
    alert.whatsappStatus = waResult.status;
  } catch (err) {
    console.warn("[Pipeline] WhatsApp alert dispatch failed:", err);
  }

  console.log(`[Pipeline] Pipeline finished successfully. Decision: ${decisionAction}, Alert: ${alert.id}`);

  return {
    mode: "local",
    decision,
    alert,
    weather,
    yieldPrediction,
  };
}

/**
 * Main Pipeline dispatcher:
 * If USE_N8N=true, POSTs the detection to N8N_WEBHOOK_URL with header x-shared-secret = N8N_SHARED_SECRET.
 * If the n8n call fails or times out after 10s, automatically falls back to runLocalPipeline.
 */
export async function runPipeline(detection: PipelineDetectionInput): Promise<PipelineResult> {
  const useN8n = process.env.USE_N8N === "true";
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const sharedSecret = process.env.N8N_SHARED_SECRET;

  if (useN8n && webhookUrl) {
    console.log(`[Pipeline] Attempting dispatch to n8n webhook (${webhookUrl})...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-shared-secret": sharedSecret || "",
        },
        body: JSON.stringify({
          event: "DETECTION_CREATED",
          detectionId: detection.id,
          fieldId: detection.fieldId,
          label: detection.label,
          confidence: detection.confidence,
          imageUrl: detection.imageUrl,
          lat: detection.lat,
          lng: detection.lng,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        console.log(`[Pipeline] Dispatched successfully to n8n webhook: ${response.status}`);
        const weather = await getOrFetchWeather(detection.fieldId);
        return {
          mode: "n8n_dispatched",
          decision: null,
          alert: null,
          weather,
          n8nDispatched: true,
        };
      } else {
        console.warn(`[Pipeline] n8n returned error status ${response.status}. Falling back to runLocalPipeline...`);
      }
    } catch (err: unknown) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === "AbortError";
      console.warn(
        `[Pipeline] n8n webhook ${isAbort ? "timed out after 10s" : "failed"}. Falling back to runLocalPipeline.`,
        err
      );
    }
  }

  // Fallback to local autonomous pipeline
  return runLocalPipeline(detection);
}
