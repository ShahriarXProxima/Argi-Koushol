import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Sprout, MapPin, Layers } from "lucide-react";

export default function FieldsPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              মাঠ ও ফসল ব্যবস্থাপনা
            </h1>
            <SimulatedBadge />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fields &amp; Crop Zones • Precision Monitoring &amp; Boundary Analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 rounded-xl gap-1.5 text-xs">
            <Plus className="size-3.5" />
            <span>নতুন প্লট যুক্ত করুন</span>
          </Button>
        </div>
      </div>

      {/* Field Overview Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              মোট আবাদি জমি (Total Cultivated)
            </CardTitle>
            <Layers className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-24" />
              <Badge variant="secondary" className="text-[10px]">৩টি সক্রিয় প্লট</Badge>
            </div>
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              গড় ফসল স্বাস্থ্য (Mean NDVI)
            </CardTitle>
            <Sprout className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-20" />
              <SimulatedBadge label="Drone NDVI" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              স্বয়ংক্রিয় সেচ জোন (Irrigation Zones)
            </CardTitle>
            <MapPin className="size-4 text-sky-600 dark:text-sky-400" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-16" />
              <SimulatedBadge label="Valves" />
            </div>
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      </div>

      {/* Field Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((id) => (
          <Card key={id} className="overflow-hidden">
            <div className="h-36 bg-secondary/50 flex items-center justify-center border-b border-border/60 relative">
              <Skeleton className="h-full w-full absolute inset-0 opacity-40" />
              <div className="z-10 flex flex-col items-center gap-1">
                <Sprout className="size-8 text-primary/60" />
                <span className="text-xs font-medium text-muted-foreground">
                  প্লট #{id} এর মানচিত্র ভিউ
                </span>
              </div>
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">প্লট #{id} - আমন ধান (Boro/Aman)</CardTitle>
                <SimulatedBadge />
              </div>
              <CardDescription>
                ময়মনসিংহ জোন • ৪.২ বিঘা
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>

              <div className="pt-2">
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
