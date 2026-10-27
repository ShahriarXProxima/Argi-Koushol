"use client";

import * as React from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimulatedBadge } from "@/components/simulated-badge";
import { FieldCharts } from "./field-charts";
import { SensorList } from "./sensor-list";
import { DetectionList } from "./detection-list";
import { DecisionTimeline } from "./decision-timeline";
import {
  ArrowLeft,
  MessageSquareText,
  Sprout,
  MapPin,
  Calendar,
  Layers,
  TrendingUp,
  BarChart2,
  Bug,
  History,
  AlertCircle,
  CheckCircle2,
  Plane,
} from "lucide-react";
import { DroneScanDialog } from "@/components/drone/drone-scan-dialog";
import { toast } from "sonner";
import type { FieldWithDetails } from "@/lib/data/fields";
import type { SensorReading, Decision } from "@prisma/client";
import { useI18n } from "@/lib/i18n";

interface FieldDetailClientProps {
  field: FieldWithDetails;
  readings: SensorReading[];
  decisions: Decision[];
}

export function FieldDetailClient({ field, readings, decisions }: FieldDetailClientProps) {
  const { isBangla, t } = useI18n();

  // 1. Calculate growth stage progress using state initializer to preserve purity
  const [now] = React.useState(() => Date.now());
  const plantedDate = new Date(field.plantedOn);
  const daysElapsed = Math.max(0, Math.floor((now - plantedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / field.cropDurationDays) * 100)));
  const daysRemaining = Math.max(0, field.cropDurationDays - daysElapsed);

  // 2. Health status determination
  const latestMoisture = field.latestReading?.soilMoisture ?? null;
  const isMoistureDry = latestMoisture !== null && latestMoisture < field.soilMoistureThreshold;
  const hasFlaggedDetections = field.detections.some((d) => d.status === "FLAGGED");
  
  let healthVariant: "healthy" | "watch" | "alert" = "healthy";
  let healthLabel = isBangla ? "সুস্থ (Optimal)" : "Optimal / Healthy";
  let healthClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";

  if (hasFlaggedDetections) {
    healthVariant = "alert";
    healthLabel = isBangla ? "রোগাক্রান্ত / জরুরি (Alert)" : "Disease Alert";
    healthClass = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
  } else if (isMoistureDry) {
    healthVariant = "watch";
    healthLabel = isBangla ? "সেচ প্রয়োজন (Watch)" : "Irrigation Watch";
    healthClass = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
  }

  // 3. Handle 'Ask Shoshsho-Prohori' interaction
  const handleAskShoshshoProhori = () => {
    toast.info(`শস্য-প্রহরী AI সহকারীর সাথে যুক্ত হচ্ছে: ${field.name}`, {
      description: `ফসল: ${field.crop} • বর্তমান আর্দ্রতা: ${latestMoisture ? `${latestMoisture.toFixed(1)}%` : "N/A"}`,
    });

    const dock = document.getElementById("chat-dock-container");
    if (dock) {
      dock.scrollIntoView({ behavior: "smooth", block: "center" });
      const button = dock.querySelector("button");
      if (button) {
        button.classList.add("ring-4", "ring-primary", "animate-bounce");
        setTimeout(() => {
          button.classList.remove("ring-4", "ring-primary", "animate-bounce");
        }, 2000);
        button.click();
      }
    }
  };

  // Convert decisions for charts markers
  const chartDecisions = decisions.map((d) => ({
    id: d.id,
    action: d.action,
    status: d.status,
    reasoning: d.reasoning,
    createdAt: d.createdAt,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation & Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/fields"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>সকল প্লটের তালিকা (All Fields)</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={healthClass}>
            {healthVariant === "healthy" ? (
              <CheckCircle2 className="size-3 mr-1" />
            ) : (
              <AlertCircle className="size-3 mr-1" />
            )}
            {healthLabel}
          </Badge>
          <SimulatedBadge label="Telemetry Simulated" />
        </div>
      </div>

      {/* Section 1: Detailed Field Header Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title and Metadata */}
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {field.name}
              </h1>
              <Badge variant="secondary" className="font-semibold text-xs text-primary border-primary/20">
                {field.crop}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Sprout className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-foreground">{field.growthStage}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Layers className="size-3.5 text-primary" />
                <span>
                  {field.areaHa} হেক্টর (~{(field.areaHa * 7.47).toFixed(1)} বিঘা)
                </span>
              </span>
              <span className="inline-flex items-center gap-1 font-mono">
                <MapPin className="size-3.5 text-rose-500" />
                <span>
                  {field.lat.toFixed(4)}° N, {field.lng.toFixed(4)}° E
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>রোপণ: {plantedDate.toLocaleDateString("bn-BD")}</span>
              </span>
            </div>

            {/* Growth Stage Progress Bar */}
            <div className="pt-2 max-w-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-primary" />
                  ফসল বৃদ্ধির চক্র (Crop Growth Progress):
                </span>
                <span className="font-mono font-bold text-primary">
                  {daysElapsed}/{field.cropDurationDays} দিন ({progressPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>রোপণের দিন (Day 0)</span>
                <span>
                  {daysRemaining > 0 ? `কাটার বাকি: প্রায় ${daysRemaining} দিন` : "ফসল কাটার উপযোগী"}
                </span>
                <span>মেয়াদ ({field.cropDurationDays} দিন)</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button: Ask Shoshsho-Prohori & Drone Scan */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <DroneScanDialog
              defaultFieldId={field.id}
              trigger={
                <Button
                  className="rounded-xl h-11 px-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold shadow-sm hover:shadow transition-all hover:from-emerald-700 hover:to-teal-800 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plane className="size-4" />
                  <span>{t("fields.simulateDrone")}</span>
                </Button>
              }
            />
            <Button
              onClick={handleAskShoshshoProhori}
              variant="outline"
              className="rounded-xl h-11 px-5 font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <MessageSquareText className="size-4 group-hover:scale-110 transition-transform text-primary" />
              <span>{t("fields.askShoshsho")}</span>
            </Button>
            <div className="text-[11px] text-muted-foreground text-center lg:text-right">
              AI সহায়ক আবহাওয়া, বালাই ও সেচ ব্যবস্থাপনা ব্যাখ্যা করবে
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tabs View (< md) */}
      <div className="md:hidden">
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl p-1 bg-muted/70 mb-4 h-11">
            <TabsTrigger value="charts" className="rounded-lg text-xs font-semibold gap-1.5 truncate">
              <BarChart2 className="size-3.5" />
              <span>{isBangla ? "চার্ট ও সেন্সর" : "Charts"}</span>
            </TabsTrigger>
            <TabsTrigger value="detections" className="rounded-lg text-xs font-semibold gap-1.5 truncate">
              <Bug className="size-3.5" />
              <span>{isBangla ? "শনাক্তকরণ" : "Detections"} ({field.detections.length})</span>
            </TabsTrigger>
            <TabsTrigger value="decisions" className="rounded-lg text-xs font-semibold gap-1.5 truncate">
              <History className="size-3.5" />
              <span>{isBangla ? "টাইমলাইন" : "Decisions"} ({decisions.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4 focus-visible:outline-none">
            <FieldCharts
              readings={readings}
              threshold={field.soilMoistureThreshold}
              decisions={chartDecisions}
            />
            <SensorList sensors={field.sensors} />
          </TabsContent>

          <TabsContent value="detections" className="space-y-4 focus-visible:outline-none">
            <DetectionList detections={field.detections} fieldName={field.name} />
          </TabsContent>

          <TabsContent value="decisions" className="space-y-4 focus-visible:outline-none">
            <DecisionTimeline decisions={decisions} fieldName={field.name} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout (>= md) */}
      <div className="hidden md:block space-y-6">
        {/* Section 2: Soil Moisture & Microclimate Charts */}
        <FieldCharts
          readings={readings}
          threshold={field.soilMoistureThreshold}
          decisions={chartDecisions}
        />

        {/* Section 3, 4, 5 in Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Sensors + Detections) */}
          <div className="lg:col-span-7 space-y-6">
            <SensorList sensors={field.sensors} />
            <DetectionList detections={field.detections} fieldName={field.name} />
          </div>

          {/* Right Column (Decision Timeline) */}
          <div className="lg:col-span-5">
            <DecisionTimeline decisions={decisions} fieldName={field.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
