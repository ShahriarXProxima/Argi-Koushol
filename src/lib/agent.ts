import {
  defaultLLMProvider,
  type LLMMessage,
  type LLMProvider,
  type LLMToolCall,
} from "./llm";
import { listMcpTools, callMcpTool } from "./mcp-client";

// ============================================================================
// Agent Event & Options Types
// ============================================================================

export type AgentEventType =
  | "tool_call"
  | "tool_result"
  | "token"
  | "text"
  | "error"
  | "done";

export interface AgentEvent {
  type: AgentEventType;
  data: unknown;
}

export interface RunAgentOptions {
  system: string;
  messages: LLMMessage[];
  maxSteps?: number; // default 6
  timeoutMs?: number; // default 30000
  jsonSchema?: unknown;
  provider?: LLMProvider;
  onEvent?: (event: AgentEvent) => void | Promise<void>;
}

export interface RunAgentResult {
  text: string;
  toolCalls: LLMToolCall[];
  steps: number;
  success: boolean;
}

// ============================================================================
// Core Autonomous Agent Execution Loop
// ============================================================================

export async function runAgent(options: RunAgentOptions): Promise<RunAgentResult> {
  const maxSteps = options.maxSteps ?? 6;
  const timeoutMs = options.timeoutMs ?? 30000;
  const provider = options.provider ?? defaultLLMProvider;

  const emit = async (event: AgentEvent) => {
    if (options.onEvent) {
      try {
        await options.onEvent(event);
      } catch (err) {
        console.warn("[Agent] Error in onEvent listener:", err);
      }
    }
  };

  // Wrap execution with hard timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error(`Agent execution timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  const executionPromise = (async (): Promise<RunAgentResult> => {
    const tools = await listMcpTools();
    const conversation: LLMMessage[] = [...options.messages];
    const executedToolCalls: LLMToolCall[] = [];
    let finalText = "";

    for (let step = 0; step < maxSteps; step++) {
      const llmResult = await provider.generate({
        system: options.system,
        messages: conversation,
        tools,
        jsonSchema: options.jsonSchema,
      });

      // 1. If LLM requested tool calls, execute them
      if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
        // Append assistant's intent with tool calls to conversation history
        conversation.push({
          role: "assistant",
          content: llmResult.text || "",
          toolCalls: llmResult.toolCalls,
        });

        for (const tc of llmResult.toolCalls) {
          executedToolCalls.push(tc);

          // Emit tool_call event
          await emit({
            type: "tool_call",
            data: {
              name: tc.name,
              args: tc.args,
              id: tc.id,
            },
          });

          // Call MCP Tool
          const toolResult = await callMcpTool(tc.name, tc.args);

          // Emit tool_result event
          await emit({
            type: "tool_result",
            data: {
              name: tc.name,
              args: tc.args,
              result: toolResult,
              id: tc.id,
            },
          });

          // Append tool response to conversation history
          conversation.push({
            role: "tool",
            content: toolResult,
            toolName: tc.name,
            toolCallId: tc.id,
          });
        }

        // Continue loop to let model reason over tool observations
        continue;
      }

      // 2. Final text response received from model
      finalText = llmResult.text;
      await emit({ type: "text", data: finalText });
      await emit({
        type: "done",
        data: { text: finalText, toolCalls: executedToolCalls },
      });

      return {
        text: finalText,
        toolCalls: executedToolCalls,
        steps: step + 1,
        success: true,
      };
    }

    // If max steps reached without completion
    const fallbackText =
      finalText ||
      "পর্যাপ্ত তথ্য সংগ্রহ সম্পন্ন হয়েছে। আরও বিস্তারিত তথ্যের জন্য নির্দিষ্ট মাঠ পরিদর্শন করুন। (Gathered available telemetry. Please inspect the field for further manual checks.)";

    await emit({ type: "text", data: fallbackText });
    await emit({
      type: "done",
      data: { text: fallbackText, toolCalls: executedToolCalls },
    });

    return {
      text: fallbackText,
      toolCalls: executedToolCalls,
      steps: maxSteps,
      success: true,
    };
  })();

  try {
    return await Promise.race([executionPromise, timeoutPromise]);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Agent] Execution error or timeout occurred:", errorMsg);

    await emit({
      type: "error",
      data: { message: errorMsg },
    });

    const friendlyFallback =
      "দুঃখিত, তথ্য সংগ্রহ বা প্রক্রিয়া করতে কিছুটা বিলম্ব হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন। (Sorry, there was a temporary delay retrieving farm data or processing the response. Please try again shortly.)";

    await emit({ type: "text", data: friendlyFallback });
    await emit({
      type: "done",
      data: { text: friendlyFallback, toolCalls: [] },
    });

    return {
      text: friendlyFallback,
      toolCalls: [],
      steps: 0,
      success: false,
    };
  }
}
