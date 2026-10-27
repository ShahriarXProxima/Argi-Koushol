"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Droplets, ShieldCheck, Bell, TrendingUp, ArrowUpRight } from "lucide-react";
import type { DashboardKpis } from "@/lib/data/kpis";
import { useI18n } from "@/lib/i18n";

interface KpiCardsProps {
  kpis: DashboardKpis;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const { isBangla, t } = useI18n();

  // Format water saved in liters
  const formattedWater = new Intl.NumberFormat(isBangla ? "bn-BD" : "en-US").format(
    kpis.waterSavedLiters
  );
  const formattedYield = new Intl.NumberFormat(isBangla ? "bn-BD" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(kpis.predictedYield.averageTonsPerHa);

  const formattedAlerts = isBangla
    ? new Intl.NumberFormat("bn-BD").format(kpis.activeAlerts)
    : kpis.activeAlerts.toString();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Water Saved */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span>{t("kpi.waterSaved")}</span>
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Droplets className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formattedWater}{" "}
              <span className="text-sm font-medium text-muted-foreground">
                {t("kpi.waterUnit")}
              </span>
            </div>
            <SimulatedBadge label={t("common.simulated")} />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              {isBangla ? "+১৮%" : "+18%"}
            </span>
            <span className="text-muted-foreground truncate">
              {t("kpi.waterSub")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Chemicals Saved */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("kpi.chemicalsSaved")}
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {isBangla
                ? `${new Intl.NumberFormat("bn-BD").format(kpis.chemicalsSavedPercent)}%`
                : `${kpis.chemicalsSavedPercent}%`}
            </div>
            <SimulatedBadge label={t("common.precision")} />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              {t("kpi.chemicalsSpot")}
            </span>
            <span className="text-muted-foreground truncate">
              {t("kpi.chemicalsSub")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Active Alerts */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("kpi.activeAlerts")}
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Bell className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formattedAlerts}{" "}
              <span className="text-sm font-medium text-muted-foreground">
                {t("kpi.alertsUnit")}
              </span>
            </div>
            {kpis.activeAlerts > 0 && (
              <span className="flex size-2.5 rounded-full bg-destructive animate-ping" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-destructive">
              {t("kpi.alertsCritical")}
            </span>
            <span className="text-muted-foreground truncate">
              {t("kpi.alertsSub")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Predicted Yield */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("kpi.predictedYield")}
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <TrendingUp className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formattedYield}{" "}
              <span className="text-sm font-medium text-muted-foreground">
                {t("kpi.yieldUnit")}
              </span>
            </div>
            <SimulatedBadge label={t("common.simulated")} />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              {isBangla ? "+১২%" : "+12%"}
            </span>
            <span className="text-muted-foreground truncate">
              {t("kpi.yieldSub")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
