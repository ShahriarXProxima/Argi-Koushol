import { Suspense } from "react";
import { getDashboardKpis } from "@/lib/data/kpis";
import { getFields } from "@/lib/data/fields";
import { getAlerts } from "@/lib/data/alerts";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { MapFieldItem } from "@/components/dashboard/field-map-inner";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[440px] flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-2xl" />
          </Card>
          <Card className="h-32">
            <CardContent className="p-4">
              <Skeleton className="h-full w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="h-[580px]">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-32" />
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function DashboardDataLoader() {
  const [kpis, rawFields, rawAlerts] = await Promise.all([
    getDashboardKpis(),
    getFields(),
    getAlerts({ limit: 8 }),
  ]);

  const fields: MapFieldItem[] = rawFields.map((f) => ({
    id: f.id,
    name: f.name,
    crop: f.crop,
    growthStage: f.growthStage,
    lat: f.lat,
    lng: f.lng,
    areaHa: f.areaHa,
    polygon: f.polygon,
    soilMoistureThreshold: f.soilMoistureThreshold,
    latestReading: f.latestReading
      ? {
          soilMoisture: f.latestReading.soilMoisture,
          temperature: f.latestReading.temperature,
          humidity: f.latestReading.humidity,
        }
      : null,
    latestWeatherLog: f.latestWeatherLog
      ? {
          rainProbability6h: f.latestWeatherLog.rainProbability6h,
          rainMm48h: f.latestWeatherLog.rainMm48h,
          tempMax: f.latestWeatherLog.tempMax,
          forecast: f.latestWeatherLog.forecast as { condition?: string; advisory?: string } | undefined,
        }
      : null,
    detections: f.detections.map((d) => ({
      id: d.id,
      label: d.label,
      confidence: d.confidence,
      lat: d.lat,
      lng: d.lng,
    })),
  }));

  const initialAlerts = rawAlerts.map((a) => ({
    id: a.id,
    fieldId: a.fieldId,
    severity: a.severity,
    title: a.title,
    message: a.message,
    messageBn: a.messageBn,
    source: a.source,
    read: a.read,
    createdAt: a.createdAt.toISOString(),
    field: a.field ? { id: a.field.id, name: a.field.name, crop: a.field.crop } : null,
  }));

  return (
    <DashboardClient
      initialKpis={kpis}
      fields={fields}
      initialAlerts={initialAlerts}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataLoader />
    </Suspense>
  );
}
