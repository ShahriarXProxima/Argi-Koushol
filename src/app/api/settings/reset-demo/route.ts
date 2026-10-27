import { seedDatabase } from "../../../../../prisma/seed";
import { jsonSuccess, jsonError } from "@/lib/api";

export async function POST() {
  try {
    console.log("[POST /api/settings/reset-demo] Initiating database re-seed...");
    await seedDatabase();
    return jsonSuccess({
      success: true,
      message: "Demo database reset and re-seeded successfully.",
    });
  } catch (error: unknown) {
    console.error("[POST /api/settings/reset-demo] Failed to reset demo data:", error);
    return jsonError("INTERNAL_ERROR", "Failed to reset demo data.", 500);
  }
}
