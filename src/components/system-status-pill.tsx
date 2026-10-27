"use client";

import * as React from "react";
import useSWR from "swr";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

interface HealthService {
  name: string;
  status: "online" | "offline";
  latencyMs?: number;
  mode?: string;
  description?: string;
}

interface HealthApiResponse {
  success: boolean;
  data: {
    timestamp: string;
    services: {
      mcp: HealthService;
      n8n: HealthService;
      llm: HealthService;
      twilio?: HealthService;
    };
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SystemStatusPill() {
  const { isBangla } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { data, error, isLoading } = useSWR<HealthApiResponse>(
    "/api/settings/health",
    fetcher,
    { refreshInterval: 15000, revalidateOnFocus: true }
  );

  // Close dropdown on outside click or Escape key
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const services = data?.data?.services;
  const mcpOnline = services?.mcp?.status === "online";
  const n8nOnline = services?.n8n?.status === "online";
  const llmOnline = services?.llm?.status === "online";

  const totalCore = 3;
  const onlineCount = (mcpOnline ? 1 : 0) + (n8nOnline ? 1 : 0) + (llmOnline ? 1 : 0);

  // Status styling calculation
  let statusColor = "bg-emerald-500";
  let statusBadgeStyle =
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  let statusText = isBangla ? "সিস্টেম স্বাভাবিক" : "Systems Online";

  if (isLoading && !data) {
    statusColor = "bg-muted-foreground";
    statusBadgeStyle = "border-border bg-muted/30 text-muted-foreground";
    statusText = isBangla ? "পরীক্ষা হচ্ছে..." : "Checking...";
  } else if (error || onlineCount === 0) {
    statusColor = "bg-destructive";
    statusBadgeStyle = "border-destructive/30 bg-destructive/10 text-destructive";
    statusText = isBangla ? "সিস্টেম ডাউন" : "Systems Down";
  } else if (onlineCount < totalCore) {
    statusColor = "bg-amber-500";
    statusBadgeStyle =
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    statusText = isBangla
      ? `${totalCore - onlineCount}টি সমস্যা`
      : `${totalCore - onlineCount} Degraded`;
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-90 cursor-pointer ${statusBadgeStyle}`}
        title={
          isBangla
            ? "সিস্টেম স্ট্যাটাস (MCP, n8n, LLM)"
            : "System Health (MCP, n8n, LLM)"
        }
        aria-label={statusText}
        aria-expanded={isOpen}
      >
        <span className="relative flex size-2">
          {onlineCount === totalCore && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
          )}
          <span className={`relative inline-flex size-2 rounded-full ${statusColor}`} />
        </span>

        <span className="hidden sm:inline-block">{statusText}</span>
        <span className="sm:hidden font-mono text-[11px]">{onlineCount}/3</span>
        <ChevronDown
          className={`size-3 opacity-60 ml-0.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border/80 bg-popover/95 p-3.5 shadow-xl backdrop-blur-md z-50 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Activity className="size-3.5 text-primary" />
              <span>{isBangla ? "সিস্টেম কানেক্টিভিটি" : "System Connectivity"}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {onlineCount}/{totalCore} Online
            </span>
          </div>

          <div className="space-y-2">
            {/* MCP Server */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/50">
              <div>
                <p className="font-semibold text-foreground">MCP Server</p>
                <p className="text-[10px] text-muted-foreground">
                  {mcpOnline && services?.mcp?.latencyMs
                    ? `${services.mcp.latencyMs}ms latency`
                    : "Agronomic tools"}
                </p>
              </div>
              {mcpOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
                  <XCircle className="size-3.5" /> Offline
                </span>
              )}
            </div>

            {/* n8n Automation Engine */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/50">
              <div>
                <p className="font-semibold text-foreground">n8n Engine</p>
                <p className="text-[10px] text-muted-foreground">
                  {services?.n8n?.mode === "webhook"
                    ? "External Webhook"
                    : "Internal Pipeline"}
                </p>
              </div>
              {n8nOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                  <AlertCircle className="size-3.5" /> Standby
                </span>
              )}
            </div>

            {/* Gemini LLM */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/50">
              <div>
                <p className="font-semibold text-foreground">Gemini 2.5 LLM</p>
                <p className="text-[10px] text-muted-foreground">Vision & Reasoning</p>
              </div>
              {llmOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
                  <XCircle className="size-3.5" /> Offline
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 flex justify-end">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              <span>
                {isBangla ? "কন্ট্রোল প্যানেল দেখুন" : "View Control Panel"}
              </span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
