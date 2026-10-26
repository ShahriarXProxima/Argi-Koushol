"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

interface QuickRepliesProps {
  language: "en" | "bn";
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickReplies({
  language,
  onSelectPrompt,
  disabled,
}: QuickRepliesProps) {
  const replies =
    language === "bn"
      ? [
          { label: "আজ কি সেচ দেওয়া উচিত?", text: "Should I irrigate Field A today?" },
          { label: "মাঠ ঘ-এর বর্তমান অবস্থা", text: "Field D status" },
          { label: "এই সপ্তাহের আবহাওয়া", text: "Weather this week" },
          { label: "ফলন পূর্বাভাস কত?", text: "What is the yield prediction for Field A?" },
        ]
      : [
          { label: "Should I irrigate Field A today?", text: "Should I irrigate Field A today?" },
          { label: "Field D status", text: "Field D status" },
          { label: "Weather this week", text: "Weather this week" },
          { label: "Yield prediction", text: "What is the yield prediction for Field A?" },
        ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none select-none">
      <span className="text-[10px] text-muted-foreground uppercase font-semibold shrink-0 flex items-center gap-1 pl-1">
        <Sparkles className="size-2.5 text-amber-500" />
        {language === "bn" ? "প্রস্তাবিত:" : "Quick:"}
      </span>
      {replies.map((reply, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onSelectPrompt(reply.text)}
          className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border border-border/80 bg-background/80 hover:bg-muted/80 text-foreground transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/40 active:scale-95"
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}
