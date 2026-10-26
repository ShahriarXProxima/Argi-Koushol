"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/simulated-badge";
import { estimateYield, type YieldEstimateResult } from "@/lib/yield";
import { getCropBaseline } from "@/lib/yield-constants";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Sliders,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface YieldCardProps {
  fieldData: {
    field: {
      id: string;
      name: string;
      crop: string;
      growthStage: string;
      plantedOn: Date | string;
      cropDurationDays: number;
      areaHa: number;
      soilMoistureThreshold: number;
    };
    latestPrediction: {
      id: string;
      tonsPerHa: number;
      harvestDate: Date | string;
      confidence: number;
      factors: unknown;
    } | null;
    previousPrediction: {
      id: string;
      tonsPerHa: number;
      harvestDate: Date | string;
      confidence: number;
    } | null;
    whatChanged: string;
    deltaYesterday: number;
    latestReading: {
      soilMoisture: number;
      temperature: number;
      ph?: number | null;
    } | null;
    latestWeather: {
      rainProbability6h: number;
      tempMax: number;
    } | null;
    activeDetection: {
      label: string;
      confidence: number;
      status: string;
    } | null;
    activeDecision: {
      action: string;
      status: string;
    } | null;
  };
}

export function YieldCard({ fieldData }: YieldCardProps) {
  const { field, latestReading, latestWeather, activeDetection, activeDecision, whatChanged, deltaYesterday } =
    fieldData;

  const cropConfig = getCropBaseline(field.crop);

  // 1. Calculate Initial Environmental and Disease Metrics
  const initialSoilHealth = React.useMemo(() => {
    if (!latestReading) return 0.85;
    const ratio = latestReading.soilMoisture / field.soilMoistureThreshold;
    if (ratio >= 1.0) {
      return Math.min(1.0, 0.85 + (ratio - 1.0) * 0.15);
    }
    return Math.max(0.15, ratio * 0.8);
  }, [latestReading, field.soilMoistureThreshold]);

  const initialDiseasePenalty = React.useMemo(() => {
    if (!activeDetection) return 0.0;
    const isLateBlight =
      activeDetection.label.toLowerCase().includes("blight") ||
      activeDetection.label.toLowerCase().includes("infestans");
    if (isLateBlight) {
      return Math.min(0.45, activeDetection.confidence * 0.42);
    }
    return Math.min(0.3, activeDetection.confidence * 0.25);
  }, [activeDetection]);

  const initialWeatherStress = React.useMemo(() => {
    if (!latestWeather) return 0.05;
    let stress = 0;
    if (latestWeather.rainProbability6h > 50) {
      stress += Math.min(0.15, (latestWeather.rainProbability6h / 100) * 0.2);
    }
    if (latestWeather.tempMax > 32) {
      stress += Math.min(0.15, (latestWeather.tempMax - 32) * 0.04);
    }
    return Math.min(0.3, stress);
  }, [latestWeather]);

  const weatherDelayDays = React.useMemo(() => {
    let delay = 0;
    if (activeDecision?.action === "DELAY_SPRAY") delay += 2;
    if (latestWeather && latestWeather.rainProbability6h > 60) delay += 2;
    return delay;
  }, [activeDecision, latestWeather]);

  // 2. What-If Untreated Blight Days State (0 to 14 days)
  const [untreatedDays, setUntreatedDays] = React.useState(0);

  // 3. Dynamic Real-time Client Estimation
  const estimate: YieldEstimateResult = React.useMemo(() => {
    return estimateYield({
      crop: field.crop,
      baselineTonsPerHa: cropConfig.baselineTonsPerHa,
      soilHealth: initialSoilHealth,
      activeDiseasePenalty: initialDiseasePenalty,
      weatherStress: initialWeatherStress,
      plantedOn: field.plantedOn,
      cropDurationDays: field.cropDurationDays,
      weatherDelayDays,
      untreatedBlightDays: untreatedDays,
    });
  }, [
    field.crop,
    cropConfig.baselineTonsPerHa,
    initialSoilHealth,
    initialDiseasePenalty,
    initialWeatherStress,
    field.plantedOn,
    field.cropDurationDays,
    weatherDelayDays,
    untreatedDays,
  ]);

  const totalPlotTons = Number((estimate.tonsPerHa * field.areaHa).toFixed(1));
  const isPositiveVariance = estimate.percentFromBaseline >= 0;

  // Format Dates for Harvest Window
  const formatDate = (date: Date) =>
    date.toLocaleDateString("bn-BD", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Card className="rounded-2xl border-border/80 shadow-sm bg-card hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden">
      <div>
        {/* Header */}
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/15">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-foreground">
                  {field.name}
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/90">{field.crop}</span>
                <span>•</span>
                <span>{field.growthStage}</span>
                <span>•</span>
                <span>
                  {field.areaHa} হেক্টর (~{(field.areaHa * 7.47).toFixed(1)} বিঘা)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] gap-1 select-none"
              >
                <Sparkles className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                Projected estimate
              </Badge>
              <SimulatedBadge label="Simulated ML" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Main Yield Projection Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Predicted Tons/Ha */}
            <div className="rounded-xl border border-border/70 p-3.5 bg-background space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                প্রত্যাশিত ফলন (Yield Rate)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-foreground">
                  {estimate.tonsPerHa}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">টন/হেক্টর</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium pt-0.5">
                <span className="text-[11px] text-muted-foreground">আদর্শ লক্ষ্যমাত্রা: {estimate.baselineTonsPerHa}</span>
                <span
                  className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-bold ${
                    isPositiveVariance
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isPositiveVariance ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {estimate.percentFromBaseline > 0 ? `+${estimate.percentFromBaseline}` : estimate.percentFromBaseline}%
                </span>
              </div>
            </div>

            {/* Total Plot Harvest & Confidence */}
            <div className="rounded-xl border border-border/70 p-3.5 bg-background space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                প্লটের মোট উৎপাদন (Total Harvest)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-primary">
                  {totalPlotTons}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">টন মোট</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                <span>মডেল আত্মবিশ্বাস:</span>
                <span className="font-mono font-bold text-foreground">
                  {Math.round(estimate.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* 'What changed since yesterday' line */}
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              <span>{whatChanged}</span>
            </span>
            {deltaYesterday !== 0 && (
              <span
                className={`font-mono font-bold shrink-0 ${
                  deltaYesterday > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {deltaYesterday > 0 ? `+${deltaYesterday}` : deltaYesterday} t/ha
              </span>
            )}
          </div>

          {/* Waterfall-style Factor Breakdown */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                ফলন প্রভাব বিশ্লেষণ (Waterfall Factor Impact):
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                নেট পরিবর্তন: {estimate.deltaFromBaseline > 0 ? `+${estimate.deltaFromBaseline}` : estimate.deltaFromBaseline} t/ha
              </span>
            </div>

            <div className="rounded-xl border border-border/70 p-3 bg-muted/10 space-y-2.5">
              {estimate.factors.map((factor, idx) => {
                const isBaseline = idx === 0;
                const isPositive = factor.impact > 0;
                const isZero = factor.impact === 0;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium text-foreground">
                        {factor.name}
                      </span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          isBaseline
                            ? "text-foreground"
                            : isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isZero
                            ? "text-muted-foreground"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isBaseline
                          ? `${factor.impact} t/ha`
                          : isPositive
                          ? `+${factor.impact} t/ha`
                          : `${factor.impact} t/ha`}
                      </span>
                    </div>

                    {/* Horizontal Visual Impact Bar */}
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isBaseline
                            ? "bg-slate-400 dark:bg-slate-500"
                            : isPositive
                            ? "bg-emerald-500"
                            : isZero
                            ? "bg-transparent"
                            : "bg-rose-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            isBaseline
                              ? 100
                              : (Math.abs(factor.impact) / estimate.baselineTonsPerHa) * 200
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="text-[10px] text-muted-foreground leading-normal">
                      {factor.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Harvest Window Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                ফসল কর্তন সময়সীমা (Harvest Window Timeline):
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                চক্রের অগ্রগতি: {estimate.growthProgressPercent}%
              </span>
            </div>

            <div className="rounded-xl border border-border/70 p-3 bg-background space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted/30 p-2 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">আগম কর্তন (Earliest)</span>
                  <span className="font-medium text-foreground text-xs mt-0.5 block">
                    {formatDate(estimate.harvestWindow.earliest)}
                  </span>
                </div>

                <div className="rounded-lg bg-primary/10 p-2 border border-primary/30">
                  <span className="text-[10px] text-primary font-bold block">অনুকূল সময় (Optimal)</span>
                  <span className="font-bold text-primary text-xs mt-0.5 block">
                    {formatDate(estimate.harvestWindow.optimal)}
                  </span>
                </div>

                <div className="rounded-lg bg-muted/30 p-2 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">নাবী কর্তন (Latest)</span>
                  <span className="font-medium text-foreground text-xs mt-0.5 block">
                    {formatDate(estimate.harvestWindow.latest)}
                  </span>
                </div>
              </div>

              {/* Cycle timeline bar */}
              <div className="pt-1">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>রোপণ: {new Date(field.plantedOn).toLocaleDateString("bn-BD")}</span>
                  <span>মেয়াদ: {field.cropDurationDays} দিন</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-primary transition-all"
                    style={{ width: `${estimate.growthProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* What-If Untreated Blight Slider */}
          <div className="rounded-xl border border-border/80 p-3.5 bg-muted/15 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sliders className="size-3.5 text-primary" />
                হোয়াট-ইফ সিমুলেশন: রোগ প্রতিকারহীন থাকলে (Untreated Blight Slider)
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                {untreatedDays === 0 ? "০ দিন (অবিলম্বে চিকিৎসা)" : `${untreatedDays} দিন চিকিৎসাবিহীন`}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-normal">
              যদি জমিতে আলুর নাবী ধসা বা ব্লাইট বালাই N দিন চিকিৎসাবিহীন থাকে, তবে সম্ভাব্য ফলন ক্ষতি দেখুন:
            </p>

            {/* Slider Input */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={untreatedDays}
                onChange={(e) => setUntreatedDays(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />

              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>০ দিন (স্প্রে চালনা)</span>
                <span>৩ দিন</span>
                <span>৭ দিন (ঝুঁকি)</span>
                <span>১৪ দিন (মারাত্মক ক্ষতি)</span>
              </div>
            </div>

            {/* What-If Feedback Alert */}
            {untreatedDays > 0 ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {untreatedDays} দিন বিলম্বে আনুমানিক ফলন ক্ষতি:{" "}
                    {(
                      ((cropConfig.baselineTonsPerHa - estimate.tonsPerHa) / cropConfig.baselineTonsPerHa) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                  <p className="text-[11px] text-rose-600/90 dark:text-rose-300/80 mt-0.5">
                    মোট প্লট উৎপাদনে ক্ষতি প্রায়{" "}
                    {((cropConfig.baselineTonsPerHa - estimate.tonsPerHa) * field.areaHa).toFixed(1)} টন।
                    স্বয়ংক্রিয় স্প্রে সুপারিশ অবিলম্বে কার্যকর করার অনুরোধ করা হচ্ছে।
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-[11px]">
                <CheckCircle2 className="size-3.5" />
                <span>ব্লাইট বালাই সময়মতো নিয়ন্ত্রিত থাকলে ফলন সুরক্ষা সর্বোচ্চ পর্যায়ে থাকবে।</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        <Link href={`/fields/${field.id}`} className="block w-full">
          <Button
            variant="outline"
            className="w-full rounded-xl h-9 text-xs font-semibold hover:border-primary/50 gap-1.5 cursor-pointer"
          >
            <span>প্লটের পূর্ণাঙ্গ টেলিমেট্রি দেখুন</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
