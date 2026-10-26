import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, Sprout, BarChart3, ArrowUpRight } from "lucide-react";

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
            <SimulatedBadge />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI Crop Yield Prediction, Soil Nutrient Balancing &amp; Harvest Planner
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 rounded-xl gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white">
            <Sparkles className="size-3.5" />
            <span>AI পূর্বাভাস চালনা করুন</span>
          </Button>
        </div>
      </div>

      {/* Yield Projection Highlights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              প্রত্যাশিত ফলন বৃদ্ধি (Projected Gain)
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-24" />
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 text-[10px] gap-0.5">
                <ArrowUpRight className="size-3" />
                +১৮%
              </Badge>
            </div>
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              পরবর্তী সার প্রয়োগ (Nutrient Timing)
            </CardTitle>
            <Sprout className="size-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-28" />
              <SimulatedBadge label="AI Advisory" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              পানি ব্যবহারের দক্ষতা (Water Efficiency)
            </CardTitle>
            <BarChart3 className="size-4 text-sky-600 dark:text-sky-400" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-20" />
              <Badge variant="secondary" className="text-[10px]">৯২% দক্ষ</Badge>
            </div>
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      </div>

      {/* Yield Analytics & Projection Charts Placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">মৌসুমী ফলন তুলনা (Yield Trend Chart)</CardTitle>
                <CardDescription>বিগত ৩ মৌসুমের তুলনায় চলতি প্রবৃদ্ধি পূর্বাভাস</CardDescription>
              </div>
              <SimulatedBadge />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64 rounded-xl border border-dashed border-border bg-secondary/30 flex items-center justify-center">
              <div className="text-center space-y-2 p-4">
                <BarChart3 className="size-10 text-muted-foreground/60 mx-auto" />
                <Skeleton className="h-4 w-44 mx-auto" />
                <Skeleton className="h-3 w-32 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">মাটির পুষ্টি উপাদান (NPK Balance)</CardTitle>
                <CardDescription>নাইট্রোজেন, ফসফরাস ও পটাশিয়াম ভারসাম্য সূচক</CardDescription>
              </div>
              <SimulatedBadge label="IoT Soil" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5 rounded-xl border border-border/60 p-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
