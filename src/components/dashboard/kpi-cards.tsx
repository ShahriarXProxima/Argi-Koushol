"use client";

import * as React from "react";
import { SimulatedBadge } from "@/components/simulated-badge";
import {
  Droplets,
  ShieldCheck,
  Bell,
  TrendingUp,
  ArrowUpRight,
  Star,
} from "lucide-react";
import type { DashboardKpis } from "@/lib/data/kpis";
import { useI18n } from "@/lib/i18n";
import { CountUp } from "@/components/ui/count-up";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  kpis: DashboardKpis;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const { isBangla, t } = useI18n();
  const locale = isBangla ? "bn-BD" : "en-US";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Water Saved - Soft Coral/Peach Pastel Bento Card */}
      <div className="card-pastel-peach relative flex flex-col justify-between rounded-[28px] p-5.5 border shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300">
        {/* Top Tag Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-black/25 px-3 py-1 shadow-xs backdrop-blur-xs text-xs font-semibold text-foreground">
            <Droplets className="size-3.5 text-sky-600 dark:text-sky-400" />
            <span>{isBangla ? "সেচ ও পানি" : "Irrigation & Water"}</span>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-black/25 px-2.5 py-1 shadow-xs text-xs font-bold text-foreground">
            <Star className="size-3 fill-amber-500 text-amber-500" />
            <span>{isBangla ? "+১৮%" : "+18%"}</span>
          </div>
        </div>

        {/* Middle Content */}
        <div className="my-5 space-y-1">
          <h3 className="text-sm font-semibold opacity-85 leading-snug">
            {t("kpi.waterSaved")}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              <CountUp value={kpis.waterSavedLiters} locale={locale} />
            </span>
            <span className="text-sm font-semibold opacity-75">
              {t("kpi.waterUnit")}
            </span>
          </div>
        </div>

        {/* Bottom Subtext & Micro Indicators */}
        <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium opacity-90 truncate">
            <ArrowUpRight className="size-3.5 stroke-[2.5]" />
            <span className="truncate">{t("kpi.waterSub")}</span>
          </div>
          <SimulatedBadge label={t("common.simulated")} />
        </div>
      </div>

      {/* 2. Chemicals Saved - Soft Warm Amber/Butter Pastel Bento Card */}
      <div className="card-pastel-amber relative flex flex-col justify-between rounded-[28px] p-5.5 border shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300">
        {/* Top Tag Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-black/25 px-3 py-1 shadow-xs backdrop-blur-xs text-xs font-semibold text-foreground">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isBangla ? "জৈব নিরাপত্তা" : "Bio-Security"}</span>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-black/25 px-2.5 py-1 shadow-xs text-xs font-bold text-foreground">
            <Star className="size-3 fill-amber-500 text-amber-500" />
            <span>{isBangla ? "৩.২x" : "3.2x"}</span>
          </div>
        </div>

        {/* Middle Content */}
        <div className="my-5 space-y-1">
          <h3 className="text-sm font-semibold opacity-85 leading-snug">
            {t("kpi.chemicalsSaved")}
          </h3>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              <CountUp value={kpis.chemicalsSavedPercent} suffix="%" locale={locale} />
            </span>
            <span className="text-xs font-semibold opacity-75">
              {isBangla ? "অপচয় রোধ" : "reduction"}
            </span>
          </div>
        </div>

        {/* Bottom Subtext & Micro Indicators */}
        <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium opacity-90 truncate">
            <ArrowUpRight className="size-3.5 stroke-[2.5]" />
            <span className="truncate">{t("kpi.chemicalsSpot")}</span>
          </div>
          <SimulatedBadge label={t("common.precision")} />
        </div>
      </div>

      {/* 3. Active Alerts - Soft Lavender/Periwinkle Pastel Bento Card */}
      <div className="card-pastel-lavender relative flex flex-col justify-between rounded-[28px] p-5.5 border shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300">
        {/* Top Tag Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-black/25 px-3 py-1 shadow-xs backdrop-blur-xs text-xs font-semibold text-foreground">
            <Bell className="size-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{isBangla ? "সতর্ক নজরদারি" : "Field Watch"}</span>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-black/25 px-2.5 py-1 shadow-xs text-xs font-bold text-foreground">
            <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{isBangla ? "লাইভ" : "Live"}</span>
          </div>
        </div>

        {/* Middle Content */}
        <div className="my-5 space-y-1">
          <h3 className="text-sm font-semibold opacity-85 leading-snug">
            {t("kpi.activeAlerts")}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              <CountUp value={kpis.activeAlerts} locale={locale} />
            </span>
            <span className="text-sm font-semibold opacity-75">
              {t("kpi.alertsUnit")}
            </span>
          </div>
        </div>

        {/* Bottom Subtext & Micro Indicators */}
        <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium opacity-90 truncate">
            <span className={cn("size-2 rounded-full", kpis.activeAlerts > 0 ? "bg-destructive" : "bg-emerald-500")} />
            <span className="truncate">{kpis.activeAlerts > 0 ? t("kpi.alertsCritical") : (isBangla ? "সব সুরক্ষিত" : "All Clear")}</span>
          </div>
          <div className="flex items-center -space-x-1">
            <span className="flex size-5 items-center justify-center rounded-full bg-white/80 dark:bg-black/40 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 ring-1 ring-background">
              AI
            </span>
            <span className="flex size-5 items-center justify-center rounded-full bg-white/80 dark:bg-black/40 text-[10px] font-bold text-sky-700 dark:text-sky-300 ring-1 ring-background">
              GIS
            </span>
          </div>
        </div>
      </div>

      {/* 4. Predicted Yield - Soft Sage/Mint Pastel Bento Card */}
      <div className="card-pastel-mint relative flex flex-col justify-between rounded-[28px] p-5.5 border shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300">
        {/* Top Tag Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-black/25 px-3 py-1 shadow-xs backdrop-blur-xs text-xs font-semibold text-foreground">
            <TrendingUp className="size-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>{isBangla ? "YieldMax ফলন" : "YieldMax AI"}</span>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-black/25 px-2.5 py-1 shadow-xs text-xs font-bold text-foreground">
            <Star className="size-3 fill-amber-500 text-amber-500" />
            <span>{isBangla ? "+১২%" : "+12%"}</span>
          </div>
        </div>

        {/* Middle Content */}
        <div className="my-5 space-y-1">
          <h3 className="text-sm font-semibold opacity-85 leading-snug">
            {t("kpi.predictedYield")}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              <CountUp
                value={kpis.predictedYield.averageTonsPerHa}
                decimals={1}
                locale={locale}
              />
            </span>
            <span className="text-sm font-semibold opacity-75">
              {t("kpi.yieldUnit")}
            </span>
          </div>
        </div>

        {/* Bottom Subtext & Micro Indicators */}
        <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium opacity-90 truncate">
            <ArrowUpRight className="size-3.5 stroke-[2.5]" />
            <span className="truncate">{t("kpi.yieldSub")}</span>
          </div>
          <SimulatedBadge label={t("common.simulated")} />
        </div>
      </div>
    </div>
  );
}
