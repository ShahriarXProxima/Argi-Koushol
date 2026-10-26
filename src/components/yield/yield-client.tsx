"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulatedBadge } from "@/components/simulated-badge";
import { YieldCard } from "./yield-card";
import {
  TrendingUp,
  Sprout,
  BarChart3,
  Calendar,
  Info,
} from "lucide-react";
import type { YieldOverviewItem } from "@/lib/data/yield";

interface YieldClientProps {
  overviewData: YieldOverviewItem[];
}

export function YieldClient({ overviewData }: YieldClientProps) {
  // Aggregate Top Statistics
  const totalProductionTons = overviewData.reduce((acc, curr) => {
    const tonsPerHa = curr.latestPrediction?.tonsPerHa || 0;
    return acc + tonsPerHa * curr.field.areaHa;
  }, 0);

  const totalAreaHa = overviewData.reduce((acc, curr) => acc + curr.field.areaHa, 0);
  const avgYieldRate = totalAreaHa > 0 ? (totalProductionTons / totalAreaHa).toFixed(1) : "0";

  // Earliest upcoming harvest date
  const earliestHarvest = overviewData.reduce((earliest: Date | null, curr) => {
    if (!curr.latestPrediction?.harvestDate) return earliest;
    const d = new Date(curr.latestPrediction.harvestDate);
    if (!earliest || d < earliest) return d;
    return earliest;
  }, null);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Agricultural KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/70 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              খামারের মোট প্রত্যাশিত ফলন
            </CardTitle>
            <BarChart3 className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {totalProductionTons.toFixed(1)}{" "}
              <span className="text-xs font-sans font-medium text-muted-foreground">মেট্রিক টন</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overviewData.length}টি সক্রিয় প্লটের সমন্বিত উৎপাদন
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              গড় ফলন ঘনত্ব (Mean Yield)
            </CardTitle>
            <Sprout className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {avgYieldRate}{" "}
              <span className="text-xs font-sans font-medium text-muted-foreground">টন/হেক্টর</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              জাতীয় আদর্শের চেয়ে +১২.৪% বেশি প্রক্ষেপণ
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              প্রথম ফসল কর্তনের সময়
            </CardTitle>
            <Calendar className="size-4 text-sky-600 dark:text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold text-foreground">
              {earliestHarvest
                ? earliestHarvest.toLocaleDateString("bn-BD", { month: "short", day: "numeric", year: "numeric" })
                : "প্রস্তুত হচ্ছে"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              আলুর নাবী ধসা demo প্লট (সেক্টর ৪)
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              সুরক্ষিত সম্ভাব্য ফলন
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +১৮.২% <span className="text-xs font-sans font-medium text-muted-foreground">সংরক্ষিত</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              স্বয়ংক্রিয় সেচ ও সুরক্ষা নীতি প্রয়োগের মাধ্যমে
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Model Transparency Advisory Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-start gap-2.5">
          <Info className="size-4.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">
              কৃষি প্রক্ষেপণ নীতি নির্দেশিকা (Agronomic Projection Disclaimer)
            </p>
            <p className="text-muted-foreground dark:text-amber-300/80 leading-relaxed">
              YieldMax-এর প্রাক্কলনগুলো আনুমানিক কৃত্রিম বুদ্ধিমত্তা প্রক্ষেপণ (Projected estimates), কোনো নিশ্চিত শারীরিক পরিমাপ নয়।
              মাটির আর্দ্রতা প্রোব, ড্রোন ভিশন বালাই স্ক্যান এবং ওপেন-ওয়েদার তথ্যের ওপর ভিত্তি করে প্রতি সিদ্ধান্তে এটি হালনাগাদ হয়।
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <SimulatedBadge label="Telemetry Simulated" />
        </div>
      </div>

      {/* Per-Field Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {overviewData.map((fieldData) => (
          <YieldCard key={fieldData.field.id} fieldData={fieldData} />
        ))}
      </div>
    </div>
  );
}
