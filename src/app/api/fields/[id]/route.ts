import { getField } from "@/lib/data/fields";
import { jsonSuccess, jsonError } from "@/lib/api";


interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const field = await getField(id);

    if (!field) {
      return jsonError("NOT_FOUND", `Field with ID '${id}' was not found.`, 404);
    }

    return jsonSuccess({ field });
  } catch (error) {
    console.error("Error fetching field details:", error);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve field details.", 500);
  }
}
