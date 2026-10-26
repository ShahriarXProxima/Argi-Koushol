"use client";

import * as React from "react";
import { Sidebar, MobileTabBar } from "@/components/navigation";
import { TopBar } from "@/components/top-bar";
import { ChatDock } from "@/components/chat-dock";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab navigation */}
      <MobileTabBar />

      {/* Fixed bottom-right chat dock */}
      <ChatDock />
    </div>
  );
}
