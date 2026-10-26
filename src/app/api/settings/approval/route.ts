import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, handleZodError } from "@/lib/api";

const approvalSchema = z.object({
  approvalRequired: z.boolean(),
});

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "human-approval-required" },
    });

    let approvalRequired = false;
    if (setting) {
      if (typeof setting.value === "boolean") {
        approvalRequired = setting.value;
      } else if (typeof setting.value === "object" && setting.value !== null) {
        approvalRequired = Boolean((setting.value as Record<string, unknown>).enabled);
      }
    }

    return jsonSuccess({ approvalRequired });
  } catch (error) {
    console.error("[GET /api/settings/approval] Error retrieving approval setting:", error);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve approval setting", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = approvalSchema.safeParse(body);
    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const { approvalRequired } = parsed.data;

    await prisma.appSetting.upsert({
      where: { key: "human-approval-required" },
      create: {
        key: "human-approval-required",
        value: { enabled: approvalRequired, updatedAt: new Date().toISOString() },
      },
      update: {
        value: { enabled: approvalRequired, updatedAt: new Date().toISOString() },
      },
    });

    return jsonSuccess({
      success: true,
      approvalRequired,
    });
  } catch (error) {
    console.error("[PUT /api/settings/approval] Error updating approval setting:", error);
    return jsonError("INTERNAL_ERROR", "Failed to update approval setting", 500);
  }
}
