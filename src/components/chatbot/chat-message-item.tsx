"use client";

import * as React from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  Bot,
  User,
} from "lucide-react";
import { ToolChip } from "./tool-chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LLMToolCall } from "@/lib/llm";

export interface ChatMessageDisplay {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: LLMToolCall[];
  isProactive?: boolean;
  alertId?: string;
  createdAt?: string | Date;
}

interface ChatMessageItemProps {
  message: ChatMessageDisplay;
  isStreaming?: boolean;
}

function parseInlineFormatting(str: string): React.ReactNode[] {
  const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded-sm bg-muted text-foreground font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderMessageContent(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");

    if (isBullet) {
      const content = trimmed.slice(2);
      currentList.push(
        <li key={`li-${index}`} className="my-0.5">
          {parseInlineFormatting(content)}
        </li>
      );
    } else {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-4 my-1 space-y-0.5">
            {currentList}
          </ul>
        );
        currentList = [];
      }

      if (!trimmed) {
        elements.push(<div key={`space-${index}`} className="h-1.5" />);
      } else {
        elements.push(
          <p key={`p-${index}`} className="my-0.5 leading-relaxed">
            {parseInlineFormatting(trimmed)}
          </p>
        );
      }
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="ul-final" className="list-disc pl-4 my-1 space-y-0.5">
        {currentList}
      </ul>
    );
  }

  return elements;
}

export function ChatMessageItem({
  message,
  isStreaming,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <div
      className={cn(
        "flex w-full gap-2 text-xs md:text-sm animate-in fade-in-50 duration-200",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div
          className={cn(
            "size-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs border",
            message.isProactive
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              : "bg-emerald-600 text-white border-emerald-500/20"
          )}
        >
          {message.isProactive ? (
            <AlertTriangle className="size-3.5" />
          ) : (
            <Bot className="size-3.5" />
          )}
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={cn(
          "flex flex-col max-w-[85%] sm:max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Proactive Badge Header */}
        {message.isProactive && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
              Proactive Alert
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] shadow-xs relative group break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-xs"
              : message.isProactive
              ? "bg-amber-500/5 border border-amber-500/30 text-foreground rounded-bl-xs"
              : "bg-card border border-border/80 text-foreground rounded-bl-xs"
          )}
        >
          {/* Text Content */}
          <div className="space-y-0.5">
            {renderMessageContent(message.content)}
          </div>

          {/* Streaming Cursor / Typing Indicator */}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary animate-pulse align-middle" />
          )}

          {/* Link to Alert Sheet if Proactive */}
          {message.isProactive && (
            <div className="mt-2 pt-1.5 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
              <Link
                href="/alerts"
                className="text-amber-700 dark:text-amber-300 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>View Alert Details</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          )}

          {/* Assistant Action Bar: Copy Button */}
          {!isUser && !isStreaming && message.content && (
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleCopy}
                className="size-5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Copy message"
                aria-label="Copy message text"
              >
                {copied ? (
                  <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Tool-Call Chips Row directly beneath assistant answer */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 w-full">
            {message.toolCalls.map((tc, idx) => (
              <ToolChip
                key={`${tc.name}-${idx}`}
                name={tc.name}
                args={tc.args}
                result={tc.result}
              />
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="size-7 rounded-xl bg-muted border border-border/70 flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground shadow-xs">
          <User className="size-3.5" />
        </div>
      )}
    </div>
  );
}
