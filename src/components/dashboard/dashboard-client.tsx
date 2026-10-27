"use client";

import * as React from "react";
import { KpiCards } from "./kpi-cards";
import { FieldMap } from "./field-map";
import { ForecastStrip } from "./forecast-strip";
import { LiveAlertFeed } from "./live-alert-feed";
import { FarmSummaryRail } from "./farm-summary-rail";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/simulated-badge";
import { RefreshCw, MapPin, LayoutGrid } from "lucide-react";
import { DroneScanDialog } from "@/components/drone/drone-scan-dialog";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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
  const { isBangla } = useI18n();

  // Selected field for the interactive map and 48-hour forecast strip
  const [selectedField, setSelectedField] = React.useState<MapFieldItem>(
    fields[0] || ({} as MapFieldItem)
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Top Page Header (Editorial Aesthetic matching inspiration) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground font-heading">
              {isBangla ? "স্মার্ট খামার ড্যাশবোর্ড" : "Smart Farm Operations"}
            </h1>
            <SimulatedBadge label="Live Telemetry" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Agri-Koushol Autonomous Precision Farm Platform • {isBangla ? "ময়মনসিংহ জোন (সেক্টর ১–৪)" : "Mymensingh Zone (Sector 1–4)"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DroneScanDialog defaultFieldId={selectedField?.id} />

          <Badge
            variant="outline"
            className="h-9 gap-1.5 px-3.5 rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs">{isBangla ? "AI প্রহর সচল" : "AI Guard Active"}</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-9 rounded-full gap-1.5 px-3.5 text-xs font-semibold hover:bg-secondary cursor-pointer shadow-xs"
          >
            <RefreshCw className="size-3.5" />
            <span>{isBangla ? "রিফ্রেশ" : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Horizontal Category Pill Filter Bar (Inspired directly by the reference image) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        {/* All Fields Pill */}
        <button
          onClick={() => setSelectedField(fields[0] || ({} as MapFieldItem))}
          className={cn(
            "h-10 px-4 rounded-full flex items-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs shrink-0",
            selectedField.id === fields[0]?.id
              ? "pill-active-dark"
              : "bg-card hover:bg-secondary text-foreground border border-border/80"
          )}
        >
          <LayoutGrid className="size-3.5" />
          <span>{isBangla ? "সকল প্লট (All)" : "All Plots"}</span>
        </button>

        {/* Dynamic Field Pills */}
        {fields.map((field) => {
          const isSelected = selectedField.id === field.id;

          return (
            <button
              key={field.id}
              onClick={() => setSelectedField(field)}
              className={cn(
                "h-10 px-4 rounded-full flex items-center gap-2 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs shrink-0",
                isSelected
                  ? "pill-active-dark"
                  : "bg-card hover:bg-secondary text-foreground border border-border/80"
              )}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{field.name}</span>
              <span className="opacity-70 text-[11px]">({field.crop})</span>
            </button>
          );
        })}
      </div>

      {/* 4 Bento Pastel KPI Cards */}
      <section aria-label="Key Performance Indicators">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isBangla ? "প্রধান সূচক ও পরিমাপ (Key Metrics)" : "Key Performance Indicators"}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            {isBangla ? "স্বয়ংক্রিয় সেন্সর আপডেট" : "Live Real-Time Telemetry"}
          </span>
        </div>
        <KpiCards kpis={initialKpis} />
      </section>

      {/* 2-Column Responsive Layout:
          Main Column (2/3 width on desktop): GIS Map, Forecast Strip, Live Alert Feed
          Right Rail (1/3 width on desktop): Profile, Weekly Stacked Bar Chart, Quick Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Map & Weather & Full Alerts) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive GIS Field Map Card */}
          <Card className="rounded-[28px] overflow-hidden border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60 bg-card/60 backdrop-blur-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 font-heading">
                    <MapPin className="size-4.5 text-primary" />
                    <span>{isBangla ? "মাঠ ও ফসলের লাইভ মানচিত্র (GIS Precision Map)" : "GIS Precision Field Map"}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    React-Leaflet • OpenStreetMap • {isBangla ? "প্লট স্বাস্থ্য ও ড্রোন শনাক্তকরণ এরিয়া" : "Crop health & drone scan boundaries"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">
                    {isBangla ? "নির্বাচিত:" : "Selected:"} <strong className="text-foreground">{selectedField.name}</strong>
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

          {/* 48-Hour Weather Forecast Strip */}
          <ForecastStrip
            fields={fields}
            selectedField={selectedField}
            onSelectField={(f) => setSelectedField(f)}
          />

          {/* Full Live Alert & Decision Feed */}
          <LiveAlertFeed initialAlerts={initialAlerts} />
        </div>

        {/* Right Column: Farm Summary Rail (Matching Annette Black reference widget) */}
        <div className="lg:col-span-1 sticky top-20">
          <FarmSummaryRail
            fields={fields}
            selectedField={selectedField}
            initialAlerts={initialAlerts}
            onSelectField={(f) => setSelectedField(f)}
          />
        </div>
      </div>
    </div>
  );
}
