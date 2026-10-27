"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sprout,
  Bell,
  TrendingUp,
  Settings,
  Leaf,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface NavItemConfig {
  key: TranslationKey;
  name: string;
  nameBn: string;
  shortEn: string;
  shortBn: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    key: "nav.dashboard",
    name: "Dashboard",
    nameBn: "ড্যাশবোর্ড",
    shortEn: "Dashboard",
    shortBn: "ড্যাশবোর্ড",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    key: "nav.fields",
    name: "Fields",
    nameBn: "মাঠ ও ফসল",
    shortEn: "Fields",
    shortBn: "মাঠ",
    href: "/fields",
    icon: Sprout,
  },
  {
    key: "nav.alerts",
    name: "Alerts",
    nameBn: "সতর্কবার্তা",
    shortEn: "Alerts",
    shortBn: "সতর্কতা",
    href: "/alerts",
    icon: Bell,
    badge: 3,
  },
  {
    key: "nav.yieldmax",
    name: "YieldMax",
    nameBn: "ফলন অপ্টিমাইজার",
    shortEn: "YieldMax",
    shortBn: "ফলন",
    href: "/yieldmax",
    icon: TrendingUp,
  },
  {
    key: "nav.settings",
    name: "Settings",
    nameBn: "সেটিংস",
    shortEn: "Settings",
    shortBn: "সেটিংস",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isBangla, t } = useI18n();

  return (
    <TooltipProvider delay={150}>
      <aside
        className="hidden md:flex md:w-20 lg:w-24 md:flex-col md:items-center py-6 px-3 bg-secondary/50 dark:bg-card/40 border-r border-border/70 select-none justify-between transition-all"
        aria-label="Desktop Navigation Dock"
      >
        {/* Top Logo Emblem */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            className="group flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-transform"
            aria-label="Agri-Koushol Home"
          >
            <Leaf className="size-6 transition-transform group-hover:rotate-12" />
          </Link>
          <span className="text-[10px] font-bold tracking-tight text-foreground/80 text-center leading-tight">
            {isBangla ? "কৃষি কৌশল" : "AgriK"}
          </span>
        </div>

        {/* Middle Navigation Pill Stack */}
        <nav className="flex flex-col items-center gap-3 my-auto py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const primaryLabel = isBangla ? item.nameBn : item.name;
            const secondaryLabel = isBangla ? item.name : item.nameBn;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      aria-label={`${primaryLabel} (${secondaryLabel})`}
                      className={cn(
                        "relative flex size-12 items-center justify-center rounded-full transition-all duration-200 cursor-pointer group",
                        isActive
                          ? "pill-active-dark shadow-md scale-105"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                      )}
                    />
                  }
                >
                  <Icon
                    className={cn(
                      "size-5.5 transition-transform group-hover:scale-110",
                      isActive ? "text-white dark:text-emerald-950" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />

                  {/* Unread Alert Notification Dot */}
                  {item.badge ? (
                    <span className="absolute top-2 right-2 flex size-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2.5 bg-rose-500 ring-2 ring-background" />
                    </span>
                  ) : null}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md">
                  <div className="flex flex-col">
                    <span className="font-bold">{primaryLabel}</span>
                    <span className="text-[10px] opacity-75">{secondaryLabel}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom Safety & Farmer Info */}
        <div className="flex flex-col items-center gap-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <div
                  className="flex size-10 items-center justify-center rounded-full bg-secondary/80 border border-border/80 text-primary cursor-help hover:bg-secondary transition-colors"
                  aria-label="Safety Policy"
                />
              }
            >
              <ShieldAlert className="size-4.5" />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3 rounded-2xl text-xs shadow-md">
              <p className="font-bold text-foreground mb-1">{t("nav.safetyPolicy")}</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {t("nav.safetyText")}
              </p>
            </TooltipContent>
          </Tooltip>

          <Link
            href="/settings"
            className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors"
            title="Rafiqul Islam (Farmer Profile)"
          >
            {isBangla ? "র" : "RI"}
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { isBangla } = useI18n();

  return (
    <nav
      className="fixed bottom-3 left-3 right-3 z-40 flex h-16 items-center justify-around rounded-full border border-border/80 bg-card/90 dark:bg-card/90 backdrop-blur-xl md:hidden px-2 shadow-lg"
      aria-label="Mobile Navigation Bar"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;
        const displayLabel = isBangla ? item.shortBn : item.shortEn;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center size-12 rounded-full transition-all duration-200 touch-manipulation cursor-pointer",
              isActive
                ? "pill-active-dark shadow-sm scale-105"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={displayLabel}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={cn(
                  "size-5",
                  isActive ? "text-white dark:text-emerald-950 stroke-[2.2]" : "stroke-[1.8]"
                )}
              />
              {item.badge ? (
                <span className="absolute -top-1 -right-1 flex size-2 rounded-full bg-rose-500 ring-1 ring-background" />
              ) : null}
            </div>
            <span
              className={cn(
                "text-[9px] truncate max-w-[48px] leading-tight font-medium mt-0.5",
                isActive ? "text-white dark:text-emerald-950 font-bold" : "text-muted-foreground"
              )}
            >
              {displayLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
