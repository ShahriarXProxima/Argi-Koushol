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
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <React.Suspense fallback={<aside className="hidden md:flex md:w-64 md:flex-col md:inset-y-0 bg-sidebar border-r border-sidebar-border" />}>
        <Sidebar />
      </React.Suspense>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
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
