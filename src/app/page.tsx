import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CloudRain,
  Cpu,
  Droplets,
  Plane,
  RefreshCw,
  Thermometer,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              খামার ড্যাশবোর্ড
            </h1>
            <SimulatedBadge />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Agri-Koushol Autonomous Farm Control Center • Mymensingh Sector 3
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 gap-1.5 px-3 rounded-xl border-primary/20 bg-primary/5 text-primary">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold">AI প্রহর সচল (Active)</span>
          </Badge>
          <Button variant="outline" size="sm" className="h-8 rounded-xl gap-1.5 text-xs">
            <RefreshCw className="size-3.5" />
            <span>আপডেট করুন</span>
          </Button>
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Soil Moisture */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              মাটির আর্দ্রতা (Soil Moisture)
            </CardTitle>
            <Droplets className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <SimulatedBadge label="IoT" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </CardContent>
        </Card>

        {/* Weather & Rain Safety */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              বৃষ্টির পূর্বাভাস (Rain Guard)
            </CardTitle>
            <CloudRain className="size-4 text-sky-600 dark:text-sky-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 text-[10px] rounded-md">
                স্প্রে নিরাপদ
              </Badge>
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </CardContent>
        </Card>

        {/* Canopy Temperature */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              তাপমাত্রা ও বাতাস (Climate)
            </CardTitle>
            <Thermometer className="size-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <SimulatedBadge label="Station" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
          </CardContent>
        </Card>

        {/* Autonomous Sprayer & Drone */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ড্রোন ও স্প্রেয়ার (Drones)
            </CardTitle>
            <Plane className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <SimulatedBadge label="Simulated" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Farm Map Skeleton & Decision Logs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Farm Field Live Status / Map Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">মাঠ ও ফসলের মানচিত্র (Field Map View)</CardTitle>
                <CardDescription>
                  স্যাটেলাইট এবং এনডিভিআই ড্রোন বিশ্লেষণ জোন (NDVI &amp; Multispectral Zone)
                </CardDescription>
              </div>
              <SimulatedBadge label="GIS Simulated" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Interactive Leaflet Map Placeholder */}
            <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/30">
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <Skeleton className="size-14 rounded-2xl" />
                <p className="text-xs font-semibold text-muted-foreground">
                  লাইভ ফিল্ড ম্যাপ লোড হচ্ছে... (Interactive GIS Map Container)
                </p>
                <span className="text-[11px] text-muted-foreground/80">
                  React-Leaflet স্যাটেলাইট ভিউ ও স্প্রে সীমানা
                </span>
              </div>
            </div>

            {/* Quick Field Status Row */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Autonomous Decision Log Skeleton */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">AI সিদ্ধান্ত ও তদারকি</CardTitle>
              <Cpu className="size-4 text-primary" />
            </div>
            <CardDescription>
              Autonomous Action &amp; Safety Rule Engine
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="rounded-xl border border-border/80 bg-background/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>

            <div className="rounded-xl border border-border/80 bg-background/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>

            <div className="rounded-xl border border-border/80 bg-background/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>

            <div className="pt-2">
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
