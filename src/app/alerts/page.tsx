import { Suspense } from "react";
import { getAlerts } from "@/lib/data/alerts";
import { getFields } from "@/lib/data/fields";
import { AlertsClient } from "@/components/alerts/alerts-client";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "সতর্কবার্তা ও নিরাপত্তা (Alerts) | Agri-Koushol কৃষি কৌশল",
  description: "Real-time precision farm alerts, AI safety guards, decision logs and farmer override controls.",
};

async function AlertsPageContent() {
  const [alerts, fields] = await Promise.all([
    getAlerts({ limit: 100 }),
    getFields(),
  ]);

  const simplifiedFields = fields.map((f) => ({
    id: f.id,
    name: f.name,
  }));

  return <AlertsClient initialAlerts={alerts} fields={simplifiedFields} />;
}

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              সতর্কবার্তা ও নিরাপত্তা ব্যবস্থাপনা
            </h1>
            <SimulatedBadge label="Safety Telemetry" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Farm Alerts, WhatsApp Dispatch, AI Safety Guards &amp; Farmer Override Controls
          </p>
        </div>
      </div>

      <Suspense fallback={<AlertsPageSkeleton />}>
        <AlertsPageContent />
      </Suspense>
    </div>
  );
}

function AlertsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-28 w-full rounded-2xl" />

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
