import Link from "next/link";
import { Suspense } from "react";
import { getFields } from "@/lib/data/fields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SimulatedBadge } from "@/components/simulated-badge";
import {
  Sprout,
  Droplets,
  Layers,
  MapPin,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Plus,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "মাঠ ও ফসল ব্যবস্থাপনা (Fields) | Agri-Koushol কৃষি কৌশল",
  description: "Comprehensive agricultural field plots, crop health monitoring, and precision telemetry.",
};

async function getProcessedFields() {
  const fields = await getFields();
  const currentTime = Date.now();

  const processed = fields.map((field) => {
    const plantedTime = new Date(field.plantedOn).getTime();
    const daysElapsed = Math.max(0, Math.floor((currentTime - plantedTime) / (1000 * 60 * 60 * 24)));
    const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / field.cropDurationDays) * 100)));

    return {
      ...field,
      daysElapsed,
      progressPercent,
    };
  });

  return processed;
}

async function FieldsListContent() {
  const fields = await getProcessedFields();

  const totalAreaHa = fields.reduce((acc, f) => acc + f.areaHa, 0);
  const totalBigha = (totalAreaHa * 7.47).toFixed(1);
  const flaggedFieldsCount = fields.filter((f) =>
    f.detections.some((d) => d.status === "FLAGGED")
  ).length;
  const dryFieldsCount = fields.filter((f) =>
    f.latestReading && f.latestReading.soilMoisture < f.soilMoistureThreshold
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/70 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              মোট আবাদি জমি (Total Area)
            </CardTitle>
            <Layers className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {totalAreaHa.toFixed(1)} <span className="text-sm font-sans font-medium text-muted-foreground">হেক্টর</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              প্রায় {totalBigha} বিঘা জমি সমন্বিত
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              সক্রিয় প্লট (Active Plots)
            </CardTitle>
            <Sprout className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {fields.length} <span className="text-sm font-sans font-medium text-muted-foreground">টি সেক্টর</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ধান, আলু ও টমেটো ফসলে আচ্ছাদিত
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              সেচ পর্যবেক্ষণ (Irrigation Watch)
            </CardTitle>
            <Droplets className="size-4 text-sky-600 dark:text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {dryFieldsCount} <span className="text-sm font-sans font-medium text-muted-foreground">টি প্লটে ঘাটতি</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              মাটির আর্দ্রতা থ্রেশহোল্ডের নিচে
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              রোগ সতর্কবার্তা (Disease Alert)
            </CardTitle>
            <Bug className="size-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {flaggedFieldsCount} <span className="text-sm font-sans font-medium text-muted-foreground">টি শনাক্ত</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ড্রোন ভিশন দ্বারা লেট ব্লাইট ট্র্যাকড
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid of Field Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map((field) => {
          const latestMoisture = field.latestReading?.soilMoisture ?? null;
          const isMoistureDry = latestMoisture !== null && latestMoisture < field.soilMoistureThreshold;
          const hasFlaggedDetections = field.detections.some((d) => d.status === "FLAGGED");

          // Health determination
          let healthLabel = "অনুকূল অবস্থা (Optimal)";
          let healthBadgeClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
          let HealthIcon = CheckCircle2;

          if (hasFlaggedDetections) {
            healthLabel = "রোগের ঝুঁকি (Disease Alert)";
            healthBadgeClass = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
            HealthIcon = AlertTriangle;
          } else if (isMoistureDry) {
            healthLabel = "সেচ প্রয়োজন (Irrigation Watch)";
            healthBadgeClass = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
            HealthIcon = Droplets;
          }

          // Growth stage progress
          const { daysElapsed, progressPercent } = field;

          return (
            <Card
              key={field.id}
              className="rounded-2xl border-border/80 shadow-sm bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/15">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {field.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/90">{field.crop}</span>
                        <span>•</span>
                        <span>{field.growthStage}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`font-semibold text-xs shrink-0 ${healthBadgeClass}`}>
                      <HealthIcon className="size-3 mr-1" />
                      {healthLabel}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Metadata Row: Area & Location */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-border/60 p-2.5 bg-muted/20">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                        জমির আয়তন (Area)
                      </span>
                      <span className="text-sm font-bold font-mono text-foreground">
                        {field.areaHa} ha{" "}
                        <span className="text-[11px] font-normal text-muted-foreground">
                          (~{(field.areaHa * 7.47).toFixed(1)} বিঘা)
                        </span>
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/60 p-2.5 bg-muted/20">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                        <MapPin className="size-3 text-rose-500" /> অবস্থান (GPS)
                      </span>
                      <span className="text-xs font-mono font-medium text-foreground">
                        {field.lat.toFixed(4)}, {field.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Soil Moisture Meter */}
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <Droplets className="size-3.5 text-sky-600 dark:text-sky-400" />
                        মাটির আর্দ্রতা (Soil Moisture):
                      </span>
                      <span className="font-mono font-bold">
                        {latestMoisture !== null ? (
                          <span className={isMoistureDry ? "text-amber-600 dark:text-amber-400" : "text-foreground"}>
                            {latestMoisture.toFixed(1)}%
                          </span>
                        ) : (
                          "N/A"
                        )}
                        <span className="text-[11px] font-normal text-muted-foreground ml-1">
                          (লক্ষ্যমাত্রা: {field.soilMoistureThreshold}%)
                        </span>
                      </span>
                    </div>

                    {/* Visual Moisture Bar */}
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isMoistureDry ? "bg-amber-500" : "bg-sky-500"
                        }`}
                        style={{ width: `${Math.min(100, (latestMoisture ?? 0))}%` }}
                      />
                      {/* Threshold indicator line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                        style={{ left: `${field.soilMoistureThreshold}%` }}
                        title={`Threshold: ${field.soilMoistureThreshold}%`}
                      />
                    </div>
                  </div>

                  {/* Growth Stage Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="size-3 text-primary" /> বৃদ্ধির অগ্রগতি (Cycle Progress):
                      </span>
                      <span className="font-mono font-semibold text-xs text-primary">
                        {daysElapsed}/{field.cropDurationDays} দিন ({progressPercent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Action Footer */}
              <div className="p-4 pt-0">
                <Link href={`/fields/${field.id}`} className="block w-full">
                  <Button
                    className="w-full rounded-xl h-10 gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
                  >
                    <span>বিস্তারিত পর্যবেক্ষণ ও ব্যবস্থাপনা</span>
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function FieldsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              মাঠ ও ফসল ব্যবস্থাপনা
            </h1>
            <SimulatedBadge label="Simulated Farm" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fields &amp; Crop Zones • Precision Telemetry, Soil Hydrology &amp; Autonomous Decisions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-9 rounded-xl gap-1.5 text-xs font-semibold">
            <Plus className="size-3.5" />
            <span>নতুন প্লট যুক্ত করুন</span>
          </Button>
        </div>
      </div>

      <Suspense fallback={<FieldsListSkeleton />}>
        <FieldsListContent />
      </Suspense>
    </div>
  );
}

function FieldsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
