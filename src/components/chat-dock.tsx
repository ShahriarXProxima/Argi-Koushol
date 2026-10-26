"use client";

import * as React from "react";
import { ChatWidget } from "@/components/chatbot/chat-widget";

/**
 * ChatDock: Houses the autonomous Shoshsho-Prohori AI conversational widget
 * Floating on the bottom-right on desktop, and expanding into a full-height sheet on mobile.
 */
export function ChatDock() {
  return <ChatWidget />;
}
