"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/simulated-badge";
import {
  CloudRain,
  CloudLightning,
  Sun,
  Flame,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { MapFieldItem } from "./field-map-inner";

interface ForecastStripProps {
  fields: MapFieldItem[];
  selectedField: MapFieldItem;
  onSelectField: (field: MapFieldItem) => void;
}

export function ForecastStrip({
  fields,
  selectedField,
  onSelectField,
}: ForecastStripProps) {
  // Extract weather metrics from selected field
  const weather = (selectedField as unknown as { latestWeatherLog?: {
    rainProbability6h: number;
    rainMm48h: number;
    tempMax: number;
    stale?: boolean;
    forecast?: { condition?: string; advisory?: string; stale?: boolean };
  } | null }).latestWeatherLog;

  const isStale = Boolean(weather?.stale || weather?.forecast?.stale);

  const rainProb = weather?.rainProbability6h ?? 20;
  const rainMm = weather?.rainMm48h ?? 2.0;
  const tempMax = weather?.tempMax ?? 31.0;
  const soilMoisture = selectedField.latestReading?.soilMoisture ?? 40;
  const threshold = selectedField.soilMoistureThreshold ?? 35;

  // Determine Risk Badge: Heavy rain, Heat stress, Frost, Drought, or Clear
  let riskBadge: {
    label: string;
    labelBn: string;
    variant: "default" | "destructive" | "secondary" | "outline";
    colorClass: string;
    icon: React.ElementType;
  } = {
    label: "Clear",
    labelBn: "অনুকূল আবহাওয়া",
    variant: "outline",
    colorClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  };

  if (rainProb > 50 || rainMm >= 20) {
    riskBadge = {
      label: "Heavy rain",
      labelBn: "ভারী বৃষ্টির ঝুঁকি",
      variant: "outline",
      colorClass: "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200 font-semibold",
      icon: CloudLightning,
    };
  } else if (tempMax >= 35) {
    riskBadge = {
      label: "Heat stress",
      labelBn: "তাপপ্রবাহ সতর্কতা",
      variant: "outline",
      colorClass: "border-amber-600/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 font-semibold",
      icon: Flame,
    };
  } else if (tempMax <= 5) {
    riskBadge = {
      label: "Frost",
      labelBn: "তুষারপাত ঝুঁকি",
      variant: "outline",
      colorClass: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200 font-semibold",
      icon: CloudRain,
    };
  } else if (soilMoisture < threshold && rainMm < 5) {
    riskBadge = {
      label: "Drought",
      labelBn: "খরা ও পানির ঘাটতি",
      variant: "outline",
      colorClass: "border-amber-600/40 bg-amber-600/10 text-amber-800 dark:text-amber-200 font-semibold",
      icon: Sun,
    };
  }

  const RiskIcon = riskBadge.icon;
  const isSpraySafe = rainProb <= 50;

  return (
    <Card className="border-border/80 bg-card shadow-sm">
      <CardContent className="p-4 space-y-3.5">
        {/* Top Header: Field selector chips & Risk Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
              <CalendarDays className="size-3.5 text-primary" />
              ৪৮ ঘণ্টার পূর্বাভাস:
            </span>
            {fields.map((f) => {
              const active = f.id === selectedField.id;
              return (
                <Button
                  key={f.id}
                  variant={active ? "default" : "outline"}
                  size="xs"
                  onClick={() => onSelectField(f)}
                  className={`h-7 px-2.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                    active ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.name.split(" ")[0]} ({f.name.split("(")[1]?.replace(")", "") || f.crop.split(" ")[0]})
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isStale && (
              <Badge
                variant="outline"
                className="h-6 px-2 text-xs font-semibold rounded-md border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
              >
                Stale (Cached)
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`h-6 px-2 text-xs font-semibold rounded-md gap-1 ${riskBadge.colorClass}`}
            >
              <RiskIcon className="size-3" />
              <span>{riskBadge.label} ({riskBadge.labelBn})</span>
            </Badge>
            <SimulatedBadge label="Weather" />
          </div>
        </div>

        {/* 48-Hour Metrics Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
          {/* Rain Probability (6h) */}
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>বৃষ্টির সম্ভাবনা (৬ ঘণ্টা)</span>
              <CloudRain className="size-3 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono tracking-tight text-foreground">
                {rainProb}%
              </span>
              <span className="text-[10px] text-muted-foreground">সম্ভাবনা</span>
            </div>
          </div>

          {/* Rain Accumulation (48h) */}
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>বৃষ্টিপাত পরিমাণ (৪৮ ঘণ্টা)</span>
              <CloudLightning className="size-3 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono tracking-tight text-foreground">
                {rainMm}
              </span>
              <span className="text-[10px] text-muted-foreground">মিলিমিটার (mm)</span>
            </div>
          </div>

          {/* Peak Temperature */}
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>সর্বোচ্চ তাপমাত্রা (Max Temp)</span>
              <Sun className="size-3 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono tracking-tight text-foreground">
                {tempMax}°C
              </span>
              <span className="text-[10px] text-muted-foreground">দিনের পিক</span>
            </div>
          </div>

          {/* Autonomous Spray Safety Status */}
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>AI স্প্রে নিরাপত্তা নীতি</span>
              {isSpraySafe ? (
                <ShieldCheck className="size-3.5 text-emerald-600" />
              ) : (
                <ShieldAlert className="size-3.5 text-destructive" />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-sm font-bold tracking-tight ${
                  isSpraySafe ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                }`}
              >
                {isSpraySafe ? "স্প্রে নিরাপদ" : "স্প্রে স্থগিত"}
              </span>
            </div>
          </div>
        </div>

        {/* Advisory footer */}
        {weather?.forecast?.advisory ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
            <span className="font-semibold text-foreground">কৃষি পরামর্শ:</span>
            <span className="truncate">{weather.forecast.advisory}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
