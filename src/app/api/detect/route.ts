import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { classifyLeafImage } from "@/lib/llm";
import { runPipeline } from "@/lib/pipeline";
import { jsonSuccess, jsonError, handleZodError } from "@/lib/api";

const stagedRequestSchema = z.object({
  fieldId: z.string().min(1, "fieldId is required"),
  stagedImage: z.string().min(1, "stagedImage is required"),
});

/**
 * Upload helper that stores files in Supabase Storage with local fallback
 */
async function storeUploadedFile(file: File, filename: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 1. Attempt Supabase Storage
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes("placeholder")) {
      const { data, error } = await supabase.storage
        .from("detections")
        .upload(filename, buffer, { contentType: file.type, upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from("detections")
          .getPublicUrl(filename);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    }
  } catch (err) {
    console.warn("[POST /api/detect] Supabase Storage upload skipped/failed:", err);
  }

  // 2. Reliable local fallback in public/uploads/detections
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "detections");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFilePath = path.join(uploadsDir, filename);
  fs.writeFileSync(localFilePath, buffer);
  return `/uploads/detections/${filename}`;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let fieldId = "";
    let stagedImageName: string | undefined;
    let imageUrl = "";
    let imageBase64: string | undefined;
    let mimeType = "image/png";

    // ------------------------------------------------------------------------
    // A. Handle Multipart Upload (Live camera / file upload)
    // ------------------------------------------------------------------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const formFieldId = formData.get("fieldId");
      const file = (formData.get("image") || formData.get("file")) as File | null;

      if (!formFieldId || typeof formFieldId !== "string") {
        return jsonError("BAD_REQUEST", "fieldId is required in form-data", 400);
      }
      fieldId = formFieldId;

      if (!file) {
        return jsonError("BAD_REQUEST", "An image file is required in form-data", 400);
      }

      const fileExt = file.name ? path.extname(file.name) || ".jpg" : ".jpg";
      const filename = `leaf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${fileExt}`;
      imageUrl = await storeUploadedFile(file, filename);

      const arrayBuffer = await file.arrayBuffer();
      imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      mimeType = file.type || "image/jpeg";
    }
    // ------------------------------------------------------------------------
    // B. Handle JSON Body (Staged demo image selection)
    // ------------------------------------------------------------------------
    else {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonError("BAD_REQUEST", "Invalid JSON payload", 400);
      }

      const parsed = stagedRequestSchema.safeParse(body);
      if (!parsed.success) {
        return handleZodError(parsed.error);
      }

      fieldId = parsed.data.fieldId;
      stagedImageName = parsed.data.stagedImage.replace(/\.[^/.]+$/, ""); // normalize key

      // Map stagedImage to public path
      imageUrl = `/demo-leaves/${stagedImageName}.png`;

      // Read staged image from disk for Gemini Vision inspection if present
      const stagedFilePath = path.join(process.cwd(), "public", "demo-leaves", `${stagedImageName}.png`);
      if (fs.existsSync(stagedFilePath)) {
        const fileBuffer = fs.readFileSync(stagedFilePath);
        imageBase64 = fileBuffer.toString("base64");
        mimeType = "image/png";
      }
    }

    // ------------------------------------------------------------------------
    // Verify Field exists in Database
    // ------------------------------------------------------------------------
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      return jsonError("NOT_FOUND", `Field not found with ID '${fieldId}'`, 404);
    }

    // ------------------------------------------------------------------------
    // Classify with Gemini Vision (or staged fallback)
    // ------------------------------------------------------------------------
    const classification = await classifyLeafImage({
      imageBase64,
      mimeType,
      stagedImage: stagedImageName,
    });

    // ------------------------------------------------------------------------
    // Calculate Jittered GPS Point within Field Polygon
    // ------------------------------------------------------------------------
    const jitterLat = (Math.random() - 0.5) * 0.0006; // ~30 meters jitter
    const jitterLng = (Math.random() - 0.5) * 0.0006;
    const detectionLat = Number((field.lat + jitterLat).toFixed(6));
    const detectionLng = Number((field.lng + jitterLng).toFixed(6));

    // ------------------------------------------------------------------------
    // Save Detection Row
    // ------------------------------------------------------------------------
    const detection = await prisma.detection.create({
      data: {
        fieldId: field.id,
        label: classification.label,
        confidence: classification.confidence,
        imageUrl,
        lat: detectionLat,
        lng: detectionLng,
        status: "PENDING",
      },
    });

    console.log(
      `[POST /api/detect] Created Detection '${detection.id}' (${classification.label}, ${Math.round(
        classification.confidence * 100
      )}%) on ${field.name}`
    );

    // ------------------------------------------------------------------------
    // Execute Autonomous Response Pipeline
    // ------------------------------------------------------------------------
    const pipelineResult = await runPipeline(detection);

    return jsonSuccess({
      detection,
      classification: {
        label: classification.label,
        confidence: classification.confidence,
        symptoms: classification.symptoms,
        staged: classification.staged,
      },
      pipeline: pipelineResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[POST /api/detect] Error processing detection:", error);
    return jsonError("INTERNAL_ERROR", `Detection processing failed: ${message}`, 500);
  }
}
