"use client";

import * as React from "react";
import {
  CloudSun,
  Droplets,
  Eye,
  ScanSearch,
  Scale,
  ShieldCheck,
  TrendingUp,
  Wrench,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolChipProps {
  name: string;
  args?: Record<string, unknown>;
  result?: string;
  isExecuting?: boolean;
}

// Declare helper at module level outside of component render
function renderToolIcon(toolName: string) {
  const cls = "size-3.5 shrink-0";
  switch (toolName) {
    case "get_current_weather":
      return <CloudSun className={cls} />;
    case "read_soil_moisture":
      return <Droplets className={cls} />;
    case "check_field_status":
      return <Eye className={cls} />;
    case "get_detection_history":
      return <ScanSearch className={cls} />;
    case "get_active_decisions":
      return <Scale className={cls} />;
    case "schedule_spray":
      return <ShieldCheck className={cls} />;
    case "estimate_yield":
      return <TrendingUp className={cls} />;
    case "schedule_irrigation":
    case "pause_irrigation":
    case "trigger_irrigation":
      return <Droplets className={cls} />;
    default:
      return <Wrench className={cls} />;
  }
}

export function ToolChip({ name, args, result, isExecuting }: ToolChipProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Parse result for clean preview
  let formattedResult = "";
  if (result) {
    try {
      const parsedResult = JSON.parse(result);
      formattedResult = JSON.stringify(parsedResult, null, 2);
    } catch {
      formattedResult = result;
    }
  }

  return (
    <div className="inline-block my-1 max-w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer select-none",
          isExecuting
            ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 animate-pulse"
            : "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/15"
        )}
        title="Click to view tool inputs and response"
        aria-expanded={isExpanded}
      >
        {renderToolIcon(name)}
        <span className="font-mono text-[11px] truncate">{name}</span>
        {isExecuting ? (
          <span className="text-[10px] opacity-75">running...</span>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="size-3" />
            done
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="size-3 ml-0.5 opacity-60" />
        ) : (
          <ChevronDown className="size-3 ml-0.5 opacity-60" />
        )}
      </button>

      {/* Expanded details tray */}
      {isExpanded && (
        <div className="mt-1.5 p-2.5 rounded-xl border border-border/80 bg-muted/60 text-xs space-y-2 text-foreground font-mono text-[11px] overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between text-muted-foreground pb-1 border-b border-border/50 text-[10px] font-sans font-medium">
            <span className="flex items-center gap-1">
              <Layers className="size-3" />
              Tool Inspector
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
              Verified MCP Call
            </span>
          </div>

          {args && Object.keys(args).length > 0 && (
            <div>
              <span className="text-[10px] font-sans font-semibold text-muted-foreground uppercase">
                Input Arguments:
              </span>
              <pre className="mt-0.5 p-1.5 rounded-md bg-background/80 border border-border/50 text-[10.5px] overflow-x-auto max-h-32 text-foreground/90">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}

          {formattedResult && (
            <div>
              <span className="text-[10px] font-sans font-semibold text-muted-foreground uppercase">
                Returned Data:
              </span>
              <pre className="mt-0.5 p-1.5 rounded-md bg-background/80 border border-border/50 text-[10.5px] overflow-x-auto max-h-44 text-foreground/90 whitespace-pre-wrap break-all">
                {formattedResult}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
