import "server-only";
import { prisma } from "@/lib/prisma";
import { recomputeFieldYieldPrediction } from "./yield";

export interface CreateDetectionInput {
  fieldId: string;
  label: string;
  confidence: number;
  imageUrl: string;
  lat?: number | null;
  lng?: number | null;
  status?: string;
}

/**
 * Creates a new Detection and triggers automated yield prediction recomputation
 */
export async function createDetection(input: CreateDetectionInput) {
  const detection = await prisma.detection.create({
    data: {
      fieldId: input.fieldId,
      label: input.label,
      confidence: input.confidence,
      imageUrl: input.imageUrl,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      status: input.status ?? "FLAGGED",
    },
  });

  // Recompute field yield prediction after new Detection
  try {
    await recomputeFieldYieldPrediction(input.fieldId);
  } catch (err) {
    console.error("Failed to recompute yield after detection:", err);
  }

  return detection;
}
