import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runAgent, type AgentEvent } from "@/lib/agent";
import type { LLMMessage, LLMToolCall } from "@/lib/llm";
import { jsonError, handleZodError } from "@/lib/api";

const CHAT_SYSTEM_PROMPT =
  "You are Shoshsho-Prohori (শস্য-প্রহরী), a friendly agronomist assistant for farmers in Bangladesh. Reply in the language the farmer wrote in (Bangla or English), in short plain sentences. Always check facts with tools before advising: check_field_status, read_soil_moisture, get_current_weather. Never guess sensor or weather values. If asked for information you do not have (like commodity or market prices, future crop prices, or general trivia), honestly say you cannot check that and never invent values or numbers. If a field is not specified, ask which field or list the fields. Never recommend spraying if rain probability is above 50% within 6 hours. If rain is expected within 6 hours, pause or skip irrigation using the pause_irrigation tool and explain why and that an automated decision was created. If disease confidence is below 0.6, recommend a manual inspection. When you take an action with a tool, tell the farmer exactly what you did and that it can be changed. Say clearly when data is simulated or stale.";

const chatRequestSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  message: z.string().min(1, "message is required"),
  fieldId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("BAD_REQUEST", "Invalid JSON payload.", 400);
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return handleZodError(parsed.error);
  }

  const { sessionId, message, fieldId } = parsed.data;

  try {
    // 1. Fetch last 10 messages for session history
    const pastRecords = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    pastRecords.reverse();

    // 2. Persist the new user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "user",
        content: message,
      },
    });

    // 3. Construct LLM conversation context
    const messages: LLMMessage[] = pastRecords.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      toolCalls: Array.isArray(m.toolCalls)
        ? (m.toolCalls as unknown as LLMToolCall[])
        : undefined,
    }));

    const contextualUserPrompt = fieldId
      ? `${message}\n[Context: Farmer selected fieldId="${fieldId}"]`
      : message;

    messages.push({
      role: "user",
      content: contextualUserPrompt,
    });

    // 4. Setup Server-Sent Events (SSE) Stream
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Stream worker executes in background while client reads SSE stream
    (async () => {
      try {
        const agentResult = await runAgent({
          system: CHAT_SYSTEM_PROMPT,
          messages,
          maxSteps: 6,
          timeoutMs: 30000,
          onEvent: async (event: AgentEvent) => {
            const chunk = `data: ${JSON.stringify(event)}\n\n`;
            await writer.write(encoder.encode(chunk));
          },
        });

        // 5. Persist assistant response and executed toolCalls
        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: "assistant",
            content: agentResult.text,
            toolCalls:
              agentResult.toolCalls.length > 0
                ? (agentResult.toolCalls as unknown as object)
                : undefined,
          },
        });
      } catch (streamErr: unknown) {
        const errMessage =
          streamErr instanceof Error ? streamErr.message : String(streamErr);
        console.error("[Chat SSE] Error in agent execution stream:", streamErr);

        const errorChunk = `data: ${JSON.stringify({
          type: "error",
          data: { message: errMessage },
        })}\n\n`;
        await writer.write(encoder.encode(errorChunk));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    console.error("[Chat API] Internal error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to process chat message.", 500);
  }
}
