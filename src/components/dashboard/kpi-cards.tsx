"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Droplets, ShieldCheck, Bell, TrendingUp, ArrowUpRight } from "lucide-react";
import type { DashboardKpis } from "@/lib/data/kpis";

interface KpiCardsProps {
  kpis: DashboardKpis;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  // Format water saved in liters with commas (e.g. 900,000 L)
  const formattedWater = new Intl.NumberFormat("bn-BD").format(kpis.waterSavedLiters);
  const formattedWaterEn = new Intl.NumberFormat("en-US").format(kpis.waterSavedLiters);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Water Saved */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span>পানি সাশ্রয় (Water Saved)</span>
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Droplets className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formattedWater} <span className="text-sm font-medium text-muted-foreground">লিটার</span>
            </div>
            <SimulatedBadge label="Simulated" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              +১৮%
            </span>
            <span className="text-muted-foreground truncate">
              ({formattedWaterEn} L) সেচ অপ্টিমাইজেশন
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Chemicals Saved */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            কীটনাশক হ্রাস (Chemicals Saved)
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {kpis.chemicalsSavedPercent}%
            </div>
            <SimulatedBadge label="Precision" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              ১৫মি. স্পট
            </span>
            <span className="text-muted-foreground truncate">
              ড্রোন প্রিসিশন স্প্রে বনাম ব্ল্যাঙ্কেট
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Active Alerts */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            সক্রিয় সতর্কতা (Active Alerts)
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Bell className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {kpis.activeAlerts} <span className="text-sm font-medium text-muted-foreground">টি</span>
            </div>
            <span className="flex size-2.5 rounded-full bg-destructive animate-ping" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-destructive">১টি জরুরি</span>
            <span className="text-muted-foreground truncate">
              আলুর নাবী ধসা রোগ ও আর্দ্রতা ঘাটতি
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Predicted Yield */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            প্রত্যাশিত ফলন (Predicted Yield)
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <TrendingUp className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {kpis.predictedYield.averageTonsPerHa} <span className="text-sm font-medium text-muted-foreground">টন/হেক্টর</span>
            </div>
            <SimulatedBadge label="AI Forecast" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              +১২%
            </span>
            <span className="text-muted-foreground truncate">
              ৪টি প্লটের গড় মৌসুমী পূর্বাভাস
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
