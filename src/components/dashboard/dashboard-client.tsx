"use client";

import * as React from "react";
import { KpiCards } from "./kpi-cards";
import { FieldMap } from "./field-map";
import { ForecastStrip } from "./forecast-strip";
import { LiveAlertFeed } from "./live-alert-feed";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/simulated-badge";
import { RefreshCw, MapPin } from "lucide-react";
import type { DashboardKpis } from "@/lib/data/kpis";
import type { MapFieldItem } from "./field-map-inner";

interface DashboardClientProps {
  initialKpis: DashboardKpis;
  fields: MapFieldItem[];
  initialAlerts: Array<{
    id: string;
    fieldId: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    title: string;
    message: string;
    messageBn?: string | null;
    source: string;
    read: boolean;
    createdAt: string;
    field?: { id: string; name: string; crop: string } | null;
  }>;
}

export function DashboardClient({
  initialKpis,
  fields,
  initialAlerts,
}: DashboardClientProps) {
  // Selected field for the interactive map and 48-hour forecast strip
  const [selectedField, setSelectedField] = React.useState<MapFieldItem>(
    fields[0] || ({} as MapFieldItem)
  );

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              খামার ড্যাশবোর্ড (Farm Dashboard)
            </h1>
            <SimulatedBadge label="Live Telemetry" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Agri-Koushol Autonomous Precision Farm Platform • ময়মনসিংহ জোন (Sector 1–4)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-8 gap-1.5 px-3 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold">AI প্রহর সচল (Active)</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-8 rounded-xl gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            <span>রিফ্রেশ</span>
          </Button>
        </div>
      </div>

      {/* Responsive layout container:
          On phones (< lg): Map & Forecast (order-1), Live Alert Feed (order-2), KPIs (order-3).
          On desktop (>= lg): KPIs top row (lg:order-1), Grid with Map+Forecast & Alerts (lg:order-2). */}
      <div className="flex flex-col gap-6">
        {/* KPI Cards: order-3 on mobile, order-1 on desktop */}
        <section className="order-3 lg:order-1" aria-label="Key Performance Indicators">
          <KpiCards kpis={initialKpis} />
        </section>

        {/* Main Grid: On mobile, Map is order-1; Alerts is order-2.
            On desktop (>= lg), this is a 2-column grid. */}
        <div className="order-1 lg:order-2 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column (lg:col-span-2): Field Map and Forecast Strip */}
          <div className="lg:col-span-2 space-y-4">
            {/* Field Map Card */}
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <MapPin className="size-4 text-primary" />
                      <span>মাঠ ও ফসলের লাইভ মানচিত্র (GIS Precision Field Map)</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      React-Leaflet • OpenStreetMap • প্লট স্বাস্থ্য ও ড্রোন শনাক্তকরণ এরিয়া
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">
                      নির্বাচিত: <strong className="text-foreground">{selectedField.name}</strong>
                    </span>
                    <SimulatedBadge label="GIS Active" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[380px] md:h-[440px] w-full">
                  <FieldMap
                    fields={fields}
                    selectedFieldId={selectedField.id}
                    onSelectField={(f) => setSelectedField(f)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 48-Hour Compact Weather & Risk Forecast Strip */}
            <ForecastStrip
              fields={fields}
              selectedField={selectedField}
              onSelectField={(f) => setSelectedField(f)}
            />
          </div>

          {/* Right Column (lg:col-span-1): Live Alert Feed
              On mobile (< lg), order-2 places alerts right below map and above KPIs! */}
          <div className="order-2 lg:order-2 lg:col-span-1">
            <LiveAlertFeed initialAlerts={initialAlerts} />
          </div>
        </div>
      </div>
    </div>
  );
}
