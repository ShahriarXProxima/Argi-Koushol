import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return jsonError("BAD_REQUEST", "sessionId query parameter is required", 400);
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return jsonSuccess({ messages });
  } catch (error) {
    console.error("Error loading chat history:", error);
    return jsonError("INTERNAL_ERROR", "Failed to load chat history.", 500);
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return jsonError("BAD_REQUEST", "sessionId query parameter is required", 400);
  }

  try {
    const result = await prisma.chatMessage.deleteMany({
      where: { sessionId },
    });

    return jsonSuccess({
      cleared: true,
      count: result.count,
    });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return jsonError("INTERNAL_ERROR", "Failed to clear chat history.", 500);
  }
}
