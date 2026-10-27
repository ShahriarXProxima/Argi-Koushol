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
import { Badge } from "@/components/ui/badge";
import { useI18n, type TranslationKey } from "@/lib/i18n";

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
    <aside className="hidden md:flex md:w-64 md:flex-col md:inset-y-0 bg-sidebar border-r border-sidebar-border select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Leaf className="size-5.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-sidebar-foreground">
            {t("app.title")}
          </span>
          <span className="text-[11px] font-medium tracking-wide text-primary">
            {t("app.subtitle")}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          {t("nav.mainNavigation")}
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          const primaryLabel = isBangla ? item.nameBn : item.name;
          const secondaryLabel = isBangla ? item.name : item.nameBn;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "size-5 transition-transform group-hover:scale-105",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"
                  )}
                />
                <div className="flex flex-col text-left">
                  <span className="leading-tight">{primaryLabel}</span>
                  <span
                    className={cn(
                      "text-[10px] leading-tight",
                      isActive ? "text-primary-foreground/80 font-normal" : "text-muted-foreground"
                    )}
                  >
                    {secondaryLabel}
                  </span>
                </div>
              </div>

              {item.badge ? (
                <Badge
                  variant="destructive"
                  className={cn(
                    "h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full justify-center",
                    isActive ? "bg-white text-destructive hover:bg-white" : ""
                  )}
                >
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Farm Safety Quick Status Footer */}
      <div className="p-4 m-3 rounded-2xl bg-secondary/60 border border-sidebar-border">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldAlert className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">
            {t("nav.safetyPolicy")}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t("nav.safetyText")}
        </p>
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { isBangla } = useI18n();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-border/80 bg-background/95 backdrop-blur-md md:hidden px-2 pb-safe"
      aria-label="Mobile Navigation Bar"
    >
      <div className="grid h-full w-full grid-cols-5 items-center">
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
                "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors touch-manipulation px-0.5",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="truncate max-w-[64px] text-[10px] text-center leading-tight">
                {displayLabel}
              </span>
              {isActive ? (
                <span className="absolute bottom-1 h-1 w-5 rounded-full bg-primary" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
