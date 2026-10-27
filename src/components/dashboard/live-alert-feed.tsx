"use client";

import * as React from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Bot,
  UserCheck,
  MessageSquareText,
  Check,
  ShieldCheck,
  Droplets,
  CloudRain,
  Plane,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface AlertItem {
  id: string;
  fieldId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  messageBn?: string | null;
  source: string;
  read: boolean;
  createdAt: string;
  field?: {
    id: string;
    name: string;
    crop: string;
  } | null;
}

interface AlertFeedResponse {
  alerts: AlertItem[];
  count: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Helper to format relative time nicely in Bangla
function formatRelativeTime(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return "এইমাত্র (just now)";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} মিনিট আগে`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} দিন আগে`;
}

// Source icon mapper
function getSourceIcon(source: string) {
  switch (source.toUpperCase()) {
    case "N8N":
      return { icon: Bot, label: "n8n Workflow Robot", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" };
    case "CHATBOT":
      return { icon: MessageSquareText, label: "শস্য-প্রহরী AI", color: "text-primary bg-primary/10" };
    case "MANUAL":
      return { icon: UserCheck, label: "কৃষক ম্যানুয়াল অ্যাকশন", color: "text-purple-600 dark:text-purple-400 bg-purple-500/10" };
    case "SOIL_GUARD":
      return { icon: Droplets, label: "মাটি সেন্সর অ্যালার্ম", color: "text-sky-600 bg-sky-500/10" };
    case "RAIN_GUARD":
      return { icon: CloudRain, label: "বৃষ্টি সুরক্ষা গার্ড", color: "text-indigo-600 bg-indigo-500/10" };
    case "DRONE_VISION":
      return { icon: Plane, label: "ড্রোন ফটো ডিটেকশন", color: "text-rose-600 bg-rose-500/10" };
    default:
      return { icon: Radio, label: "সিস্টেম সেন্সর", color: "text-muted-foreground bg-muted" };
  }
}

// Severity badge mapper
function getSeverityBadge(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">জরুরি (Critical)</Badge>;
    case "HIGH":
      return <Badge className="text-[10px] uppercase font-bold tracking-wider bg-rose-600 text-white hover:bg-rose-700">উচ্চ (High)</Badge>;
    case "MEDIUM":
      return <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider border-amber-500/30 text-amber-700 dark:text-amber-300">মাঝারি (Medium)</Badge>;
    case "LOW":
    default:
      return <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-sky-700 dark:text-sky-300">সাধারণ (Low)</Badge>;
  }
}

interface LiveAlertFeedProps {
  initialAlerts?: AlertItem[];
}

export function LiveAlertFeed({ initialAlerts = [] }: LiveAlertFeedProps) {
  const { isBangla, t } = useI18n();

  // SWR polling every 5 seconds as specified
  const { data, mutate } = useSWR<AlertFeedResponse>(
    "/api/alerts?limit=8",
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      fallbackData: initialAlerts.length > 0 ? { alerts: initialAlerts, count: initialAlerts.length } : undefined,
    }
  );

  const alerts = data?.alerts || initialAlerts;
  const unreadCount = alerts.filter((a) => !a.read).length;

  // Mark alert as read
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Optimistic update
      mutate(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            alerts: prev.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
          };
        },
        false
      );

      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });

      if (!res.ok) throw new Error("Failed to update alert");
      toast.success(isBangla ? "সতর্কবার্তা পঠিত চিহ্নিত করা হয়েছে।" : "Alert marked as read.");
    } catch {
      toast.error(isBangla ? "সতর্কবার্তা আপডেট করা যায়নি।" : "Failed to update alert.");
      mutate();
    }
  };

  return (
    <Card className="flex flex-col h-full border-border/80 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>{t("feed.title")}</span>
                {unreadCount > 0 ? (
                  <span className="flex size-2 rounded-full bg-destructive animate-pulse" />
                ) : null}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("feed.subtitle")} • SWR Polling (5s)
              </CardDescription>
            </div>
          </div>

          <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 font-medium">
            <Radio className="size-2.5 text-emerald-500 animate-pulse" />
            <span>{unreadCount} {t("common.active")}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 overflow-y-auto max-h-[540px] space-y-2.5 scrollbar-none">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {isBangla ? "কোনো নতুন সতর্কতা নেই" : "No new alerts"}
            </p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              {t("feed.allSafe")}
            </p>
          </div>
        ) : (
          alerts.slice(0, 8).map((alert) => {
            const { icon: SourceIcon, label: sourceLabel, color: sourceColorClass } = getSourceIcon(alert.source);

            return (
              <div
                key={alert.id}
                className={`group relative rounded-xl border p-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
                  alert.read
                    ? "border-border/50 bg-background/40 opacity-75"
                    : "border-border/90 bg-card shadow-xs hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex size-7 items-center justify-center rounded-lg ${sourceColorClass}`}>
                      <SourceIcon className="size-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {sourceLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(alert.createdAt)}
                    </span>
                    {!alert.read ? (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={(e) => handleMarkAsRead(alert.id, e)}
                        className="size-6 rounded-md hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground"
                        title="পঠিত চিহ্নিত করুন"
                      >
                        <Check className="size-3" />
                        <span className="sr-only">Mark read</span>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <h4 className="text-xs font-bold text-foreground leading-snug">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {isBangla ? (alert.messageBn || alert.message) : (alert.message || alert.messageBn)}
                  </p>
                </div>

                {alert.field?.name ? (
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/80 pt-1.5 border-t border-border/40">
                    <span>{alert.field.name} • {alert.field.crop}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wide">
                      ID: #{alert.id.slice(-5)}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
