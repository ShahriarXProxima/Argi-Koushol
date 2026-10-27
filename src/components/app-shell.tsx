"use client";

import * as React from "react";
import { Sidebar, MobileTabBar } from "@/components/navigation";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { ChatDock } from "@/components/chat-dock";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Desktop sidebar rail */}
      <React.Suspense fallback={<aside className="hidden md:flex md:w-20 lg:w-24 md:flex-col bg-secondary/50 border-r border-border/70" />}>
        <Sidebar />
      </React.Suspense>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-12 max-w-[1536px] w-full mx-auto">
          {children}
        </main>
        <Footer />
      </div>

      {/* Mobile bottom tab navigation */}
      <React.Suspense fallback={null}>
        <MobileTabBar />
      </React.Suspense>

      {/* Fixed bottom-right chat dock */}
      <ChatDock />
    </div>
  );
}
