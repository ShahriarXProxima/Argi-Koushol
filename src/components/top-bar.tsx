"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { Bell, Leaf, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { SystemStatusPill } from "@/components/system-status-pill";
import { useI18n } from "@/lib/i18n";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TopBar() {
  const { isBangla, t } = useI18n();
  const { data } = useSWR<{ count: number }>(
    "/api/alerts?unreadOnly=true",
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true }
  );

  const unreadCount = data?.count ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-8">
      {/* Brand / Title for mobile & farmer context */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-foreground md:hidden"
        >
          <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Leaf className="size-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-primary">
              {t("app.title")}
            </span>
            <span className="text-[10px] text-muted-foreground -mt-0.5 font-medium">
              {t("app.subtitle")}
            </span>
          </div>
        </Link>

        {/* Farmer greeting (desktop and tablet) */}
        <div className="hidden items-center gap-3 md:flex">
          <Avatar className="size-10 rounded-full border-2 border-primary/20 bg-secondary/80">
            <AvatarFallback className="rounded-full bg-primary/10 text-xs font-bold text-primary">
              {isBangla ? "র" : "RI"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {t("topbar.farmerName")}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {isBangla ? "(Rafiqul Islam)" : "(রফিকুল ইসলাম)"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              <MapPin className="size-3 text-primary" />
              <span>{t("topbar.farmerLocation")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* System Health Status Pill (MCP, n8n, LLM) */}
        <SystemStatusPill />

        {/* Mobile farmer short indicator */}
        <div className="flex items-center gap-1.5 md:hidden pr-1">
          <Avatar className="size-8 rounded-full border border-primary/20 bg-secondary/80">
            <AvatarFallback className="rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {isBangla ? "র" : "RI"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Language switch */}
        <LanguageToggle />

        {/* Alert Bell with unread counter */}
        <Link href="/alerts" aria-label={t("topbar.alerts")}>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-10 rounded-full border border-border/80 bg-card/60 hover:bg-secondary text-foreground transition-all cursor-pointer shadow-xs"
          >
            <Bell className="size-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="sr-only">
              {unreadCount > 0 ? `${unreadCount} ${t("topbar.unreadAlerts")}` : t("topbar.alerts")}
            </span>
          </Button>
        </Link>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
