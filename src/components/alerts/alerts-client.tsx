"use client";

import * as React from "react";
import { mutate } from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertSheet, type AlertDecision } from "./alert-sheet";
import {
  AlertTriangle,
  Bot,
  Bug,
  Check,
  CheckCheck,
  Clock,
  CloudRain,
  Droplets,
  Eye,
  Filter,
  MessageSquare,
  Radio,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { AlertWithDetails } from "@/lib/data/alerts";
import { useI18n } from "@/lib/i18n";

interface AlertsClientProps {
  initialAlerts: AlertWithDetails[];
  fields: Array<{ id: string; name: string }>;
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return (
        <Badge variant="destructive" className="font-bold text-[11px] gap-1 shrink-0">
          <ShieldAlert className="size-3" />
          সংকটজনক
        </Badge>
      );
    case "HIGH":
      return (
        <Badge className="bg-rose-600 text-white font-bold text-[11px] gap-1 hover:bg-rose-700 shrink-0">
          <AlertTriangle className="size-3" />
          উচ্চ ঝুঁকি
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge variant="secondary" className="border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[11px] gap-1 shrink-0">
          মাঝারি
        </Badge>
      );
    case "LOW":
    default:
      return (
        <Badge variant="outline" className="text-sky-700 dark:text-sky-300 font-semibold text-[11px] shrink-0">
          সাধারণ
        </Badge>
      );
  }
}

function getSourceIcon(source: string) {
  switch (source.toUpperCase()) {
    case "N8N":
      return <Bot className="size-3.5 text-primary" />;
    case "DRONE_VISION":
      return <Bug className="size-3.5 text-rose-500" />;
    case "RAIN_GUARD":
      return <CloudRain className="size-3.5 text-sky-500" />;
    case "SOIL_GUARD":
      return <Droplets className="size-3.5 text-amber-500" />;
    case "MANUAL":
      return <UserCheck className="size-3.5 text-emerald-600" />;
    default:
      return <Radio className="size-3.5 text-muted-foreground" />;
  }
}

function formatRelativeTime(dateStr: Date | string) {
  const d = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "এইমাত্র";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} মিনিট আগে`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  return d.toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
}

export function AlertsClient({ initialAlerts, fields }: AlertsClientProps) {
  const { isBangla, t } = useI18n();
  const [alerts, setAlerts] = React.useState<AlertWithDetails[]>(initialAlerts);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");
  const [fieldFilter, setFieldFilter] = React.useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = React.useState<string>("ALL");
  const [readFilter, setReadFilter] = React.useState<string>("ALL");

  // Selected alert for side sheet
  const [selectedAlert, setSelectedAlert] = React.useState<AlertWithDetails | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = React.useState(false);

  // Distinct sources in data
  const distinctSources = React.useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => set.add(a.source));
    return Array.from(set);
  }, [alerts]);

  // Filtered alerts
  const filteredAlerts = React.useMemo(() => {
    return alerts.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesMsg = item.message.toLowerCase().includes(query);
        const matchesBn = item.messageBn?.toLowerCase().includes(query) ?? false;
        const matchesField = item.field.name.toLowerCase().includes(query);
        const matchesCrop = item.field.crop.toLowerCase().includes(query);
        const matchesAction = item.decision?.action.toLowerCase().includes(query) ?? false;

        if (!matchesTitle && !matchesMsg && !matchesBn && !matchesField && !matchesCrop && !matchesAction) {
          return false;
        }
      }

      // 2. Severity Filter
      if (severityFilter !== "ALL" && item.severity !== severityFilter) {
        return false;
      }

      // 3. Field Filter
      if (fieldFilter !== "ALL" && item.fieldId !== fieldFilter) {
        return false;
      }

      // 4. Source Filter
      if (sourceFilter !== "ALL" && item.source !== sourceFilter) {
        return false;
      }

      // 5. Read Status Filter
      if (readFilter === "UNREAD" && item.read) return false;
      if (readFilter === "READ" && !item.read) return false;

      return true;
    });
  }, [alerts, searchQuery, severityFilter, fieldFilter, sourceFilter, readFilter]);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH").length;

  // 1. Mark single alert as read
  const handleMarkAlertRead = async (id: string, read = true, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read } : a))
    );
    if (selectedAlert?.id === id) {
      setSelectedAlert((prev) => (prev ? { ...prev, read } : null));
    }

    try {
      await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });

      // Mutate global unread badge
      mutate("/api/alerts?unreadOnly=true");
      mutate("/api/alerts?limit=8");
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  // 2. Mark all as read
  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    // Optimistic update
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));

    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to mark all as read");

      toast.success("সব সতর্কতা পড়া হিসেবে চিহ্নিত করা হয়েছে", {
        description: "টপ বারের আনরিড ব্যাজ এবং ফিড হালনাগাদ করা হয়েছে।",
      });

      // Synchronize topbar and feeds
      mutate("/api/alerts?unreadOnly=true");
      mutate("/api/alerts?limit=8");
    } catch {
      toast.error("ব্যর্থ", {
        description: "সতর্কবার্তা হালনাগাদে সমস্যা দেখা দিয়েছে।",
      });
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // 3. Open alert side sheet
  const handleOpenAlertSheet = (alertItem: AlertWithDetails) => {
    setSelectedAlert(alertItem);
    setIsSheetOpen(true);

    // Automatically mark read if unread
    if (!alertItem.read) {
      handleMarkAlertRead(alertItem.id, true);
    }
  };

  // 4. Handle decision updated from sheet
  const handleDecisionUpdated = (alertId: string, updatedDecision: AlertDecision) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === alertId && a.decision) {
          return {
            ...a,
            decision: {
              ...a.decision,
              status: updatedDecision.status,
              scheduledFor: updatedDecision.scheduledFor,
              reasoning: updatedDecision.reasoning,
            },
          };
        }
        return a;
      })
    );

    if (selectedAlert && selectedAlert.id === alertId && selectedAlert.decision) {
      setSelectedAlert({
        ...selectedAlert,
        decision: {
          ...selectedAlert.decision,
          status: updatedDecision.status,
          scheduledFor: updatedDecision.scheduledFor,
          reasoning: updatedDecision.reasoning,
        },
      });
    }
  };

  const isAnyFilterActive =
    searchQuery.trim() !== "" ||
    severityFilter !== "ALL" ||
    fieldFilter !== "ALL" ||
    sourceFilter !== "ALL" ||
    readFilter !== "ALL";

  const resetFilters = () => {
    setSearchQuery("");
    setSeverityFilter("ALL");
    setFieldFilter("ALL");
    setSourceFilter("ALL");
    setReadFilter("ALL");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Context & Metrics Cards - Soft Bento Pastel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-pastel-mint rounded-[26px] p-5 border shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-85">
              মোট সতর্কতা (Total Alerts)
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
            {alerts.length} <span className="text-sm font-sans font-medium opacity-80">টি এন্ট্রি</span>
          </div>
          <p className="text-xs opacity-80 mt-1 font-medium">সব ফিল্ডের মোট সিস্টেম লগ</p>
        </div>

        <div className="card-pastel-amber rounded-[26px] p-5 border shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-85">
              অপঠিত সতর্কবার্তা (Unread)
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 text-amber-800 dark:text-amber-300">
              <span className="size-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
            {unreadCount} <span className="text-sm font-sans font-medium opacity-80">টি নতুন</span>
          </div>
          <p className="text-xs opacity-80 mt-1 font-medium">কৃষকের পর্যালোচনা অপেক্ষমাণ</p>
        </div>

        <div className="card-pastel-peach rounded-[26px] p-5 border shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-85">
              জরুরি ঝুঁকি (Critical / High)
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 text-rose-800 dark:text-rose-300">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
            {criticalCount} <span className="text-sm font-sans font-medium opacity-80">টি সংকট</span>
          </div>
          <p className="text-xs opacity-80 mt-1 font-medium">নাবী ধসা ও পানির ঘাটতি সংকেত</p>
        </div>

        <div className="card-pastel-lavender rounded-[26px] p-5 border shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-85">
              স্বয়ংক্রিয় অ্যাকশন (Decisions)
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 text-indigo-800 dark:text-indigo-300">
              <Bot className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
            {alerts.filter((a) => !!a.decision).length}{" "}
            <span className="text-sm font-sans font-medium opacity-80">টি সংযুক্ত</span>
          </div>
          <p className="text-xs opacity-80 mt-1 font-medium">ওভাররাইড করার জন্য উন্মুক্ত</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border-border/80 shadow-sm bg-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("alerts.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 rounded-xl text-xs bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Mark All Read Button */}
          <div className="flex items-center gap-2 shrink-0">
            {isAnyFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="size-3.5" />
                <span>রিসেট</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0 || isMarkingAllRead}
              onClick={handleMarkAllAsRead}
              className="h-10 rounded-xl gap-2 text-xs font-semibold border-primary/30 hover:bg-primary/10 text-primary cursor-pointer"
            >
              <CheckCheck className="size-4" />
              <span>{t("alerts.markAllRead")} ({unreadCount})</span>
            </Button>
          </div>
        </div>

        {/* Filter Selectors Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-xs">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="size-3 text-primary" /> ফিল্টার:
          </span>

          {/* Severity Select */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="ALL">সকল তীব্রতা (All Severity)</option>
            <option value="CRITICAL">সংকটজনক (CRITICAL)</option>
            <option value="HIGH">উচ্চ ঝুঁকি (HIGH)</option>
            <option value="MEDIUM">মাঝারি (MEDIUM)</option>
            <option value="LOW">সাধারণ (LOW)</option>
          </select>

          {/* Field Select */}
          <select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="ALL">সকল জমি (All Fields)</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Source Select */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="ALL">সকল উৎস (All Sources)</option>
            {distinctSources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>

          {/* Read Status Select */}
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="ALL">সকল অবস্থা (All Status)</option>
            <option value="UNREAD">অপঠিত মাত্র (Unread Only)</option>
            <option value="READ">পঠিত (Read Only)</option>
          </select>

          <span className="ml-auto text-[11px] font-mono text-muted-foreground">
            দেখানো হচ্ছে: {filteredAlerts.length} / {alerts.length}
          </span>
        </div>
      </Card>

      {/* Alerts Table / List */}
      <Card className="rounded-2xl border-border/80 shadow-sm bg-card overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ShieldCheck className="size-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {t("alerts.noAlerts")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isBangla
                ? "আপনার নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো সতর্কতা খুঁজে পাওয়া যায়নি।"
                : "No alerts match the currently selected filter options."}
            </p>
            {isAnyFilterActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="rounded-xl h-8 text-xs cursor-pointer"
              >
                {t("alerts.resetFilters")}
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredAlerts.map((item) => {
              const isUnread = !item.read;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenAlertSheet(item)}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors cursor-pointer group hover:bg-muted/30 ${
                    isUnread ? "bg-primary/3" : "bg-card"
                  }`}
                >
                  {/* Left Column: Read Dot + Severity + Title/Msg */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Read Status indicator dot */}
                    <div className="pt-1.5 shrink-0">
                      {isUnread ? (
                        <span
                          className="size-2.5 rounded-full bg-primary block animate-pulse"
                          title="Unread alert"
                        />
                      ) : (
                        <span
                          className="size-2 rounded-full bg-muted-foreground/30 block"
                          title="Read alert"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(item.severity)}
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                          {item.field.name}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {isBangla ? (item.messageBn || item.message) : (item.message || item.messageBn)}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          {getSourceIcon(item.source)}
                          <span>{item.source}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="size-3" />
                          <span>{formatRelativeTime(item.createdAt)}</span>
                        </span>
                        {item.whatsappStatus && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                              <MessageSquare className="size-2.5" />
                              <span>WhatsApp: {item.whatsappStatus}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Decision Action + Quick Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/30">
                    {/* Decision info */}
                    {item.decision ? (
                      <div className="text-left md:text-right space-y-0.5">
                        <div className="flex items-center md:justify-end gap-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                            সিদ্ধান্ত:
                          </span>
                          <span
                            className={`text-xs font-mono font-bold ${
                              item.decision.status === "OVERRIDDEN"
                                ? "line-through text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {item.decision.action}
                          </span>
                        </div>
                        <div className="flex items-center md:justify-end gap-1">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              item.decision.status === "OVERRIDDEN"
                                ? "bg-destructive/10 text-destructive"
                                : item.decision.status === "SCHEDULED"
                                ? "bg-sky-500/10 text-sky-600"
                                : "bg-emerald-500/10 text-emerald-600"
                            }`}
                          >
                            {item.decision.status}
                          </span>
                          {item.decision.simulated && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              (Simulated)
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground hidden md:block">
                        তথ্যমূলক
                      </div>
                    )}

                    {/* Quick Read/Unread Toggle */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleMarkAlertRead(item.id, !item.read, e)}
                        title={item.read ? "Mark as unread" : "Mark as read"}
                        className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        {item.read ? (
                          <RotateCcw className="size-3.5" />
                        ) : (
                          <Check className="size-3.5 text-primary" />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAlertSheet(item)}
                        className="h-8 rounded-xl text-xs gap-1 font-semibold group-hover:border-primary/50"
                      >
                        <Eye className="size-3.5" />
                        <span>বিস্তারিত</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Side Sheet */}
      <AlertSheet
        alert={selectedAlert}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onDecisionUpdated={handleDecisionUpdated}
      />
    </div>
  );
}
