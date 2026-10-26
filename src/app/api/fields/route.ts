import { getFields } from "@/lib/data/fields";
import { jsonSuccess, jsonError } from "@/lib/api";


export async function GET() {
  try {
    const fields = await getFields();
    return jsonSuccess({ fields, count: fields.length });
  } catch (error) {
    console.error("Error fetching fields:", error);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve fields.", 500);
  }
}
