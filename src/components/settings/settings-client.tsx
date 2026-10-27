"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SimulatedBadge } from "@/components/simulated-badge";
import { DroneScanDialog } from "@/components/drone/drone-scan-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sliders,
  CloudRain,
  CheckCircle2,
  RotateCcw,
  Plane,
  Server,
  Cpu,
  Bot,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Radio,
  Flame,
  CloudSun,
} from "lucide-react";

export type DemoScenario = "NORMAL" | "HEAVY_RAIN_4H" | "HEATWAVE";

interface ServiceHealth {
  name: string;
  status: "online" | "offline";
  url?: string;
  latencyMs?: number;
  model?: string;
  from?: string;
  mode?: string;
  description: string;
}

interface SettingsClientProps {
  initialScenario: DemoScenario;
  initialApproval: boolean;
}

export function SettingsClient({
  initialScenario,
  initialApproval,
}: SettingsClientProps) {
  const router = useRouter();
  const [scenario, setScenario] = React.useState<DemoScenario>(initialScenario);
  const [approvalRequired, setApprovalRequired] = React.useState<boolean>(initialApproval);
  const [isUpdatingScenario, setIsUpdatingScenario] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  // Health Status State
  const [health, setHealth] = React.useState<{
    mcp: ServiceHealth;
    n8n: ServiceHealth;
    llm: ServiceHealth;
    twilio: ServiceHealth;
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = React.useState(false);

  // Fetch health status
  const checkSystemHealth = React.useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch("/api/settings/health");
      if (res.ok) {
        const json = await res.json();
        setHealth(json.data.services);
      }
    } catch (err) {
      console.warn("Failed to retrieve system health:", err);
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/settings/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (mounted && json?.data?.services) {
          setHealth(json.data.services);
        }
      })
      .catch((err) => console.warn("Failed to retrieve system health:", err));

    return () => {
      mounted = false;
    };
  }, []);

  // Handle Scenario Switch
  const handleSelectScenario = async (newScenario: DemoScenario) => {
    if (newScenario === scenario || isUpdatingScenario) return;
    setIsUpdatingScenario(true);
    try {
      const res = await fetch("/api/settings/demo-scenario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: newScenario }),
      });

      if (!res.ok) throw new Error("Failed to update scenario");

      setScenario(newScenario);
      toast.success(
        newScenario === "HEAVY_RAIN_4H"
          ? "সক্রিয় দৃশ্যপট: ৪ ঘণ্টার মধ্যে ভারী বৃষ্টি (Rain risk 90% in 6h - sprays locked)"
          : newScenario === "HEATWAVE"
          ? "সক্রিয় দৃশ্যপট: তীব্র তাপপ্রবাহ (Heatwave mode: 42°C active)"
          : "সক্রিয় দৃশ্যপট: স্বাভাবিক খামার আবহাওয়া (Normal mode)"
      );
      router.refresh();
    } catch {
      toast.error("দৃশ্যপট পরিবর্তন ব্যর্থ হয়েছে");
    } finally {
      setIsUpdatingScenario(false);
    }
  };

  // Handle Human Approval Toggle
  const handleToggleApproval = async (checked: boolean) => {
    setApprovalRequired(checked);
    try {
      const res = await fetch("/api/settings/approval", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalRequired: checked }),
      });

      if (!res.ok) throw new Error("Failed to update approval rule");

      toast.success(
        checked
          ? "উচ্চ-ঝুঁকি সংক্রান্ত সিদ্ধান্তে মানুষের অনুমোদন সক্রিয় করা হয়েছে"
          : "স্বয়ংক্রিয় অনুমোদন চালু করা হয়েছে"
      );
    } catch {
      setApprovalRequired(!checked);
      toast.error("অনুমোদন সেটিং পরিবর্তন ব্যর্থ হয়েছে");
    }
  };

  // Handle Reset Demo Data
  const handleResetDemoData = async () => {
    if (
      !window.confirm(
        "আপনি কি নিশ্চিত যে সমস্ত টেস্ট ডিটেকশন ও সিদ্ধান্ত মুছে প্রারম্ভিক ডেমো ডেটায় ফিরতে চান? (Reset database to clean initial state?)"
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/settings/reset-demo", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset database");

      toast.success("ডেমো ডেটা সফলভাবে রিসিড করা হয়েছে (Database Re-seeded)");
      setScenario("NORMAL");
      router.refresh();
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "ডেটা রিসেট করতে সমস্যা হয়েছে");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Context Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              ডেমো কন্ট্রোল প্যানেল (Demo Control Panel)
            </h1>
            <SimulatedBadge label="Judge Controls" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time simulation controls, agronomic scenario switches &amp; system health status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DroneScanDialog
            trigger={
              <Button
                size="sm"
                className="gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm cursor-pointer text-xs font-semibold"
              >
                <Plane className="size-3.5" />
                <span>ড্রোন স্ক্যান সিমুলেট (Simulate Drone Scan)</span>
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={checkSystemHealth}
            disabled={isCheckingHealth}
            className="h-8 rounded-xl gap-1.5 text-xs"
          >
            <RefreshCw className={cn("size-3.5", isCheckingHealth && "animate-spin")} />
            <span>চেক হেলথ</span>
          </Button>
        </div>
      </div>

      {/* Grid: Scenarios & Automation Rules */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. Demo Scenario Switcher (Span 2 cols) */}
        <Card className="lg:col-span-2 rounded-[28px] border-border/80 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sliders className="size-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-heading">
                    আবহাওয়া ও ফসলের দৃশ্যপট নির্বাচন (Demo Scenario Switch)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Simulate extreme weather events to verify AI Safety Guardrails and spraying prevention
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono rounded-full px-3">
                Active: {scenario}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Scenario Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* NORMAL Card */}
              <button
                type="button"
                disabled={isUpdatingScenario}
                onClick={() => handleSelectScenario("NORMAL")}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between",
                  scenario === "NORMAL"
                    ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-border/80 bg-background hover:bg-muted/30 hover:border-emerald-500/30"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 w-fit">
                      <CloudSun className="size-4" />
                    </div>
                    {scenario === "NORMAL" && (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-foreground">
                    স্বাভাবিক আবহাওয়া (Normal)
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Standard telemetry with routine sensor and spraying windows. Rain risk &le; 20%.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Rain: Low • Sprays Permitted
                </div>
              </button>

              {/* HEAVY_RAIN_4H Card */}
              <button
                type="button"
                disabled={isUpdatingScenario}
                onClick={() => handleSelectScenario("HEAVY_RAIN_4H")}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between",
                  scenario === "HEAVY_RAIN_4H"
                    ? "border-destructive bg-destructive/10 ring-2 ring-destructive/20 shadow-xs"
                    : "border-border/80 bg-background hover:bg-muted/30 hover:border-destructive/40"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-destructive/15 text-destructive w-fit">
                      <CloudRain className="size-4" />
                    </div>
                    {scenario === "HEAVY_RAIN_4H" && (
                      <CheckCircle2 className="size-4 text-destructive" />
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-foreground">
                    ভারী বৃষ্টি (Heavy Rain 4h)
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Approaching storm in ~4 hours (90% rain risk). Forces DELAY_SPRAY on blight detection!
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-destructive font-semibold">
                  Rain: 90% (22mm) • SPRAY LOCKED
                </div>
              </button>

              {/* HEATWAVE Card */}
              <button
                type="button"
                disabled={isUpdatingScenario}
                onClick={() => handleSelectScenario("HEATWAVE")}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between",
                  scenario === "HEATWAVE"
                    ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20 shadow-xs"
                    : "border-border/80 bg-background hover:bg-muted/30 hover:border-amber-500/40"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 w-fit">
                      <Flame className="size-4" />
                    </div>
                    {scenario === "HEATWAVE" && (
                      <CheckCircle2 className="size-4 text-amber-600" />
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-foreground">
                    তীব্র তাপপ্রবাহ (Heatwave)
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Severe heatwave: 42°C+ daytime temperatures, accelerated soil evaporation.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  Temp: 42°C • Irrigation Trigger
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Safety Guards & Human Approval */}
        <Card className="rounded-[28px] border-border/80 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-4.5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-heading">
                  AI নিরাপত্তা ও কৃষকের অনুমোদন
                </CardTitle>
                <CardDescription className="text-xs">
                  Human-in-the-loop validation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 p-3 space-y-1.5 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">বৃষ্টি সেফটি গার্ড (Rain Guard)</span>
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                  &gt; 50% Rain
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ৬ ঘণ্টায় বৃষ্টির সম্ভাবনা ৫০% এর বেশি হলে কোনো অবস্থাতেই স্প্রে করা হবে না (Forced DELAY_SPRAY)।
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 p-3.5">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs sm:text-sm font-semibold">
                  উচ্চ-ঝুঁকি সিদ্ধান্তে অনুমোদন (Approval)
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Require farmer approval for HIGH/CRITICAL actions
                </div>
              </div>
              <Switch
                checked={approvalRequired}
                onCheckedChange={handleToggleApproval}
                aria-label="Toggle human approval for high severity actions"
              />
            </div>

            <div className="pt-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResetDemoData}
                disabled={isResetting}
                className="w-full rounded-xl gap-2 text-xs font-semibold cursor-pointer"
              >
                {isResetting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                <span>ডেমো ডেটা রিসেট ও রিসিড (Reset Demo Data)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. System Connectivity Status Panel (4 Pillars) */}
      <Card className="rounded-[28px] border-border/80 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Radio className="size-4.5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-heading">
                  সিস্টেম কানেক্টিভিটি স্ট্যাটাস (System Health &amp; Reachability)
                </CardTitle>
                <CardDescription className="text-xs">
                  Live connectivity checks across MCP Server, n8n Workflow Engine, Gemini LLM, and Twilio WhatsApp
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs rounded-full px-3">
              Autonomous Layer
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Service 1: MCP Server */}
            <div className="rounded-2xl border border-border/70 p-3.5 space-y-2 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold">MCP Server</span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    health?.mcp.status === "online"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-destructive/15 text-destructive border border-destructive/30"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      health?.mcp.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                    )}
                  />
                  {health?.mcp.status === "online" ? "Reachable" : "Offline"}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                Streamable HTTP transport on port 3001 with 11 agronomic tools.
              </div>
              <div className="text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40 flex justify-between">
                <span>Latency: {health?.mcp.latencyMs || 2}ms</span>
                <span className="text-emerald-600 dark:text-emerald-400">Port 3001</span>
              </div>
            </div>

            {/* Service 2: n8n Workflow Engine */}
            <div className="rounded-2xl border border-border/70 p-3.5 space-y-2 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-amber-500" />
                  <span className="text-xs font-bold">n8n Engine</span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    health?.n8n.status === "online"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {health?.n8n.mode === "webhook" ? "Webhook" : "Local Pipeline"}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                Autonomous event processor with 10s automatic fallback.
              </div>
              <div className="text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40 flex justify-between">
                <span>Fallback: Active</span>
                <span className="text-primary font-semibold">10s Timeout</span>
              </div>
            </div>

            {/* Service 3: Gemini LLM */}
            <div className="rounded-2xl border border-border/70 p-3.5 space-y-2 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold">Gemini Vision</span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    health?.llm.status === "online"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-destructive/15 text-destructive border border-destructive/30"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      health?.llm.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                    )}
                  />
                  {health?.llm.status === "online" ? "Reachable" : "Offline"}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                Gemini 2.5 Flash for plant pathology &amp; structured reasoning.
              </div>
              <div className="text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40 flex justify-between">
                <span>Model: 2.5-flash</span>
                <span className="text-emerald-600 dark:text-emerald-400">Multimodal</span>
              </div>
            </div>

            {/* Service 4: Twilio WhatsApp */}
            <div className="rounded-2xl border border-border/70 p-3.5 space-y-2 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold">Twilio WhatsApp</span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    health?.twilio.status === "online"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      health?.twilio.status === "online" ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  {health?.twilio.status === "online" ? "Reachable" : "Simulated"}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                Dispatches instant WhatsApp messages in Bengali and English.
              </div>
              <div className="text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40 flex justify-between">
                <span>Delivery: Instant</span>
                <span className="text-amber-600 dark:text-amber-400">Sandbox Ready</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
