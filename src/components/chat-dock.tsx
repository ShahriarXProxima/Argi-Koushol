"use client";

import * as React from "react";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * ChatDock: Empty fixed bottom-right dock placeholder for Shoshsho-Prohori AI Assistant
 * To be implemented with conversational AI features in subsequent steps.
 */
export function ChatDock() {
  return (
    <div
      id="chat-dock-container"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40"
      aria-label="AI Farm Assistant Dock"
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon"
              className="size-13 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all border-2 border-primary-foreground/20 flex items-center justify-center cursor-pointer group"
              aria-label="Open Shoshsho-Prohori Assistant"
            />
          }
        >
          <MessageSquareText className="size-6 group-hover:scale-110 transition-transform text-white" />
          <span className="sr-only">Shoshsho-Prohori Chat</span>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs font-semibold px-2.5 py-1">
          শস্য-প্রহরী (Shoshsho-Prohori AI)
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
