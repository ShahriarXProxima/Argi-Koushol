import { z } from "zod";
import { markAlertRead } from "@/lib/data/alerts";
import { jsonSuccess, jsonError, handleZodError } from "@/lib/api";


const updateAlertSchema = z.object({
  read: z.boolean().default(true),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    let read = true;
    try {
      const body = await request.json();
      const parsed = updateAlertSchema.safeParse(body);
      if (!parsed.success) {
        return handleZodError(parsed.error);
      }
      read = parsed.data.read;
    } catch {
      read = true;
    }

    const alert = await markAlertRead(id, read);
    return jsonSuccess({ success: true, alert });
  } catch (error) {
    console.error("Error updating alert status:", error);
    return jsonError("INTERNAL_ERROR", "Failed to update alert.", 500);
  }
}
