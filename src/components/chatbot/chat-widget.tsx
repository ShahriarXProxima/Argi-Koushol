"use client";

import * as React from "react";
import {
  Sprout,
  Shield,
  Loader2,
} from "lucide-react";
import { ChatHeader, type FieldOption } from "./chat-header";
import { ChatMessageItem, type ChatMessageDisplay } from "./chat-message-item";
import { QuickReplies } from "./quick-replies";
import { ChatInput } from "./chat-input";
import { ToolChip } from "./tool-chip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LLMToolCall } from "@/lib/llm";
import { useI18n } from "@/lib/i18n";

const SESSION_STORAGE_KEY = "agri_koushol_chat_session_id";

interface RawFieldItem {
  id: string;
  name: string;
  crop: string;
}

interface RawAlertItem {
  id: string;
  title: string;
  message: string;
  messageBn?: string | null;
  createdAt: string;
}

interface RawMessageItem {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: LLMToolCall[];
  createdAt: string;
}

const emptySubscribe = () => () => {};

function getSessionIdSnapshot(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sid);
  }
  return sid;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasUnread, setHasUnread] = React.useState(false);

  // Sync with external localStorage using React 19 recommended hook
  const activeSessionId = React.useSyncExternalStore(
    emptySubscribe,
    getSessionIdSnapshot,
    () => ""
  );

  const [overrideSessionId, setOverrideSessionId] = React.useState<string | null>(null);
  const sessionId = overrideSessionId || activeSessionId;
  const { locale: language, toggleLocale: handleToggleLanguage } = useI18n();
  const [fields, setFields] = React.useState<FieldOption[]>([]);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string>("all");

  const [messages, setMessages] = React.useState<ChatMessageDisplay[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState("");
  const [streamingToolCalls, setStreamingToolCalls] = React.useState<LLMToolCall[]>([]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const seenAlertIdsRef = React.useRef<Set<string>>(new Set());

  // 1. Fetch available fields for field selector
  React.useEffect(() => {
    async function loadFields() {
      try {
        const res = await fetch("/api/fields");
        if (res.ok) {
          const json = await res.json();
          const rawItems: RawFieldItem[] = json?.data?.fields || json?.fields || [];
          const items: FieldOption[] = rawItems.map((f) => ({
            id: f.id,
            name: f.name,
            crop: f.crop,
          }));
          setFields(items);
        }
      } catch (err) {
        console.warn("Could not load fields for chatbot header:", err);
      }
    }
    loadFields();
  }, []);

  // 2. Load chat history from /api/chat/history when sessionId is available
  React.useEffect(() => {
    const currentSid = sessionId || activeSessionId;
    if (!currentSid) return;

    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat/history?sessionId=${currentSid}`);
        if (res.ok) {
          const json = await res.json();
          const rawMessages: RawMessageItem[] = json?.data?.messages || json?.messages || [];
          const loaded: ChatMessageDisplay[] = rawMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolCalls: m.toolCalls,
            createdAt: m.createdAt,
          }));

          if (loaded.length > 0) {
            setMessages(loaded);
          } else {
            // Seed welcome greeting if empty
            setMessages([
              {
                id: "welcome-init",
                role: "assistant",
                content:
                  language === "bn"
                    ? "নমস্কার/সালাম! আমি **শস্য-প্রহরী** (Shoshsho-Prohori)। আপনার মাঠের ফসলের অবস্থা, মাটির আর্দ্রতা বা আবহাওয়া সম্পর্কে যেকোনো তথ্য জানতে নিচে লিখুন।"
                    : "Hello! I am **Shoshsho-Prohori**, your autonomous AI agronomist assistant. Ask me about your fields, soil moisture, weather forecast, or irrigation recommendations.",
                createdAt: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        console.warn("Could not load chat history:", err);
      }
    }

    loadHistory();
  }, [sessionId, activeSessionId, language]);

  // 3. Proactive Alert Listener (Polls every 10 seconds)
  React.useEffect(() => {
    const checkAlerts = async () => {
      try {
        const res = await fetch("/api/alerts?unreadOnly=true");
        if (!res.ok) return;
        const json = await res.json();
        const unreadAlerts: RawAlertItem[] = json?.data?.alerts || json?.alerts || [];

        if (Array.isArray(unreadAlerts) && unreadAlerts.length > 0) {
          const newAlerts = unreadAlerts.filter(
            (a) => !seenAlertIdsRef.current.has(a.id)
          );

          if (newAlerts.length > 0) {
            for (const a of newAlerts) {
              seenAlertIdsRef.current.add(a.id);
            }

            const proactiveMessages: ChatMessageDisplay[] = newAlerts.map((a) => ({
              id: `proactive-${a.id}`,
              role: "assistant",
              content: `**[${a.title}]**\n${a.message}${
                a.messageBn ? `\n\n_${a.messageBn}_` : ""
              }`,
              isProactive: true,
              alertId: a.id,
              createdAt: a.createdAt,
            }));

            setMessages((prev) => [...prev, ...proactiveMessages]);

            // If chat dock is closed, trigger unread badge notification
            if (!isOpen) {
              setHasUnread(true);
            }
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    const interval = setInterval(checkAlerts, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Scroll to bottom on message updates
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isStreaming]);

  // Clear chat conversation
  const handleClearChat = async () => {
    const currentSid = sessionId || activeSessionId;
    if (!currentSid) return;
    try {
      await fetch(`/api/chat/history?sessionId=${currentSid}`, {
        method: "DELETE",
      });
      // Generate a fresh session
      const newSid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_STORAGE_KEY, newSid);
      }
      setOverrideSessionId(newSid);
      setMessages([
        {
          id: "welcome-fresh",
          role: "assistant",
          content:
            language === "bn"
              ? "কথোপকথন মুছে ফেলা হয়েছে। আমি আপনাকে কীভাবে সাহায্য করতে পারি?"
              : "Conversation cleared. How can I assist you with your fields today?",
          createdAt: new Date().toISOString(),
        },
      ]);
      toast.success(language === "bn" ? "কথোপকথন মুছে ফেলা হয়েছে" : "Chat cleared");
    } catch {
      toast.error("Failed to clear chat history");
    }
  };

  // Send message and stream SSE events
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const currentSid = sessionId || activeSessionId;
    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessageDisplay = {
      id: userMessageId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent("");
    setStreamingToolCalls([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSid,
          message: text,
          fieldId: selectedFieldId === "all" ? undefined : selectedFieldId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat API responded with HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";
      const currentToolCalls: LLMToolCall[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const event = JSON.parse(trimmed.slice(6));

              if (event.type === "tool_call") {
                const tc = event.data as LLMToolCall;
                currentToolCalls.push(tc);
                setStreamingToolCalls([...currentToolCalls]);
              } else if (event.type === "tool_result") {
                const data = event.data as { name: string; result: string; id?: string };
                const match = currentToolCalls.find((t) => t.name === data.name);
                if (match) {
                  match.result = data.result;
                  setStreamingToolCalls([...currentToolCalls]);
                }
              } else if (event.type === "text") {
                accumulatedText = event.data;
                setStreamingContent(accumulatedText);
              } else if (event.type === "done") {
                accumulatedText = event.data?.text || accumulatedText;
                setStreamingContent(accumulatedText);
              } else if (event.type === "error") {
                toast.error(event.data?.message || "An error occurred");
              }
            } catch {
              // Ignore partial parse
            }
          }
        }
      }

      // Finalize completed assistant message
      const assistantMsg: ChatMessageDisplay = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: accumulatedText || "আমি আপনার তথ্য প্রক্রিয়া করেছি। (Data retrieved successfully.)",
        toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      console.error("[ChatWidget] SSE stream failed:", err);
      const fallbackText =
        language === "bn"
          ? "আমি সেন্সর ও টুলস ডেটা পেতে পারিনি, অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
          : "I could not reach my tools, please try again shortly.";

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: fallbackText,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      setStreamingToolCalls([]);
    }
  };

  // Open Chat and clear unread badge
  const handleOpenChat = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* Floating Trigger Button (Bottom-Right)                         */}
      {/* ------------------------------------------------------------- */}
      {!isOpen && (
        <aside
          id="chat-dock-container"
          role="complementary"
          aria-label="AI Farm Assistant Dock"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40"
        >
          <Button
            size="icon"
            onClick={handleOpenChat}
            className="size-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-white/20 flex items-center justify-center cursor-pointer relative group"
            aria-label="Open Shoshsho-Prohori Assistant"
          >
            {/* Avatar Icon */}
            <Sprout className="size-6 group-hover:scale-110 transition-transform text-white" />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-900 rounded-full p-0.5 shadow-xs border border-background">
              <Shield className="size-3 fill-current" />
            </div>

            {/* Unread Notification Dot */}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex size-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full size-4 bg-destructive border-2 border-background" />
              </span>
            )}
            <span className="sr-only">Open Shoshsho-Prohori Chat</span>
          </Button>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Chat Window Panel (Desktop floating card / Mobile bottom-sheet) */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="শস্য-প্রহরী AI Assistant"
          className={cn(
            "fixed z-50 flex flex-col bg-card border border-border shadow-2xl transition-all overflow-hidden",
            // Desktop: Floating panel (420x620 px)
            "md:bottom-6 md:right-6 md:w-[420px] md:h-[620px] md:max-h-[85vh] md:rounded-2xl",
            // Mobile: Full-height bottom sheet
            "inset-x-0 bottom-0 h-[92vh] sm:h-[85vh] rounded-t-3xl md:rounded-b-2xl"
          )}
        >
          {/* Header */}
          <ChatHeader
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            onClearChat={handleClearChat}
            onClose={() => setIsOpen(false)}
          />

          {/* Scrollable Message List */}
          <div
            className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-muted/20 text-xs sm:text-sm"
            aria-live="polite"
          >
            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {/* Active Streaming Message Preview */}
            {isStreaming && (
              <div className="flex flex-col gap-1.5 animate-in fade-in-50">
                {/* Active Tool Calling Chips */}
                {streamingToolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-9">
                    {streamingToolCalls.map((tc, idx) => (
                      <ToolChip
                        key={`streaming-tc-${idx}`}
                        name={tc.name}
                        args={tc.args}
                        result={tc.result}
                        isExecuting={!tc.result}
                      />
                    ))}
                  </div>
                )}

                {/* Assistant Streaming Bubble */}
                {streamingContent && (
                  <ChatMessageItem
                    message={{
                      id: "streaming-live",
                      role: "assistant",
                      content: streamingContent,
                    }}
                    isStreaming={true}
                  />
                )}

                {/* Thinking / Running indicator if text hasn't arrived yet */}
                {!streamingContent && (
                  <div className="flex items-center gap-2 pl-9 text-xs text-muted-foreground animate-pulse">
                    <Loader2 className="size-3.5 animate-spin text-emerald-600" />
                    <span>
                      {language === "bn"
                        ? "শস্য-প্রহরী মাঠের ডেটা পর্যবেক্ষণ করছে..."
                        : "Shoshsho-Prohori is checking telemetry and weather..."}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Chips */}
          <div className="px-2.5 pt-1 bg-card/60 backdrop-blur-xs border-t border-border/40">
            <QuickReplies
              language={language}
              onSelectPrompt={handleSendMessage}
              disabled={isStreaming}
            />
          </div>

          {/* Chat Input Bar */}
          <ChatInput
            onSend={handleSendMessage}
            isStreaming={isStreaming}
            language={language}
          />
        </div>
      )}
    </>
  );
}
