import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { classifyLeafImage } from "@/lib/llm";
import { runPipeline } from "@/lib/pipeline";
import { jsonSuccess, jsonError, handleZodError } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

// Maximum upload size: 5 MB
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

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
  // 1. Rate limiting: 15 detection requests per minute per IP
  const rateLimitError = checkRateLimit(request, {
    endpointPrefix: "/api/detect",
    limit: 15,
    windowMs: 60 * 1000,
  });
  if (rateLimitError) return rateLimitError;

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
        return jsonError("BAD_REQUEST", "fieldId is required in form-data.", 400);
      }
      fieldId = formFieldId;

      if (!file) {
        return jsonError("BAD_REQUEST", "An image file is required in form-data.", 400);
      }

      // Validate File Size
      if (file.size > MAX_UPLOAD_BYTES) {
        return jsonError(
          "PAYLOAD_TOO_LARGE",
          "File size exceeds the 5MB upload limit.",
          413
        );
      }

      // Validate MIME Type
      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        return jsonError(
          "UNSUPPORTED_MEDIA_TYPE",
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
          415
        );
      }

      // Validate Extension
      const rawExt = file.name ? path.extname(file.name).toLowerCase() : ".jpg";
      const fileExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : ".jpg";

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
        return jsonError("BAD_REQUEST", "Invalid JSON payload.", 400);
      }

      const parsed = stagedRequestSchema.safeParse(body);
      if (!parsed.success) {
        return handleZodError(parsed.error);
      }

      fieldId = parsed.data.fieldId;
      // Prevent directory traversal attacks by taking only the basename
      const safeBasename = path.basename(parsed.data.stagedImage).replace(/\.[^/.]+$/, "");
      stagedImageName = safeBasename;

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
      return jsonError("NOT_FOUND", `Field not found with ID '${fieldId}'.`, 404);
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
    console.error("[POST /api/detect] Error processing detection:", error);
    // Never expose raw stack traces or internal errors to client
    return jsonError("INTERNAL_ERROR", "Failed to process leaf detection.", 500);
  }
}
