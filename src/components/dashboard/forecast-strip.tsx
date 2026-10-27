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
    <Card className="rounded-[28px] border-border/80 bg-card shadow-xs overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Top Header: Field selector chips & Risk Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-muted-foreground mr-1 shrink-0 flex items-center gap-1.5">
              <CalendarDays className="size-4 text-primary" />
              <span>৪৮ ঘণ্টার পূর্বাভাস:</span>
            </span>
            {fields.map((f) => {
              const active = f.id === selectedField.id;
              return (
                <Button
                  key={f.id}
                  variant={active ? "default" : "outline"}
                  size="xs"
                  onClick={() => onSelectField(f)}
                  className={`h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer shadow-xs ${
                    active ? "pill-active-dark" : "bg-card text-foreground border-border/80 hover:bg-secondary"
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
                className="h-7 px-2.5 text-xs font-semibold rounded-full border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
              >
                Stale (Cached)
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`h-7 px-3 text-xs font-semibold rounded-full gap-1.5 shadow-xs ${riskBadge.colorClass}`}
            >
              <RiskIcon className="size-3.5" />
              <span>{riskBadge.label} ({riskBadge.labelBn})</span>
            </Badge>
            <SimulatedBadge label="Weather" />
          </div>
        </div>

        {/* 48-Hour Metrics Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
          {/* Rain Probability (6h) */}
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>বৃষ্টির সম্ভাবনা (৬ ঘণ্টা)</span>
              <CloudRain className="size-3.5 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
                {rainProb}%
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">সম্ভাবনা</span>
            </div>
          </div>

          {/* Rain Accumulation (48h) */}
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>বৃষ্টিপাত পরিমাণ (৪৮ ঘণ্টা)</span>
              <CloudLightning className="size-3.5 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
                {rainMm}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">মিমি (mm)</span>
            </div>
          </div>

          {/* Peak Temperature */}
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>সর্বোচ্চ তাপমাত্রা (Max)</span>
              <Sun className="size-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
                {tempMax}°C
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">দিনের পিক</span>
            </div>
          </div>

          {/* Autonomous Spray Safety Status */}
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>AI স্প্রে নিরাপত্তা নীতি</span>
              {isSpraySafe ? (
                <ShieldCheck className="size-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="size-4 text-destructive" />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-sm font-extrabold tracking-tight ${
                  isSpraySafe ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"
                }`}
              >
                {isSpraySafe ? "স্প্রে নিরাপদ (Safe)" : "স্প্রে স্থগিত (Hold)"}
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
