import { Suspense } from "react";
import { getYieldOverview } from "@/lib/data/yield";
import { YieldClient } from "@/components/yield/yield-client";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ফলন অপ্টিমাইজার (YieldMax) | Agri-Koushol কৃষি কৌশল",
  description: "AI-driven precision crop yield forecasting, agronomic waterfall factor analytics, and harvest planning.",
};

async function YieldMaxContent() {
  const overviewData = await getYieldOverview();
  return <YieldClient overviewData={overviewData} />;
}

export default function YieldMaxPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              ফলন অপ্টিমাইজার (YieldMax)
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs gap-1 select-none"
            >
              <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
              Projected estimate
            </Badge>
            <SimulatedBadge label="ML Engine" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI Crop Yield Prediction, Agronomic Factor Waterfall &amp; Harvest Planner
          </p>
        </div>
      </div>

      <Suspense fallback={<YieldMaxSkeleton />}>
        <YieldMaxContent />
      </Suspense>
    </div>
  );
}

function YieldMaxSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-20 w-full rounded-2xl" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-96 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
