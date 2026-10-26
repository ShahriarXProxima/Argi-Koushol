import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudRain, ShieldCheck, Bug, CheckCheck } from "lucide-react";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              সতর্কবার্তা ও নিরাপত্তা
            </h1>
            <SimulatedBadge />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Farm Alerts, AI Safety Guards &amp; Action Log
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-xl gap-1.5 text-xs">
            <CheckCheck className="size-3.5" />
            <span>সব পড়া চিহ্নিত করুন</span>
          </Button>
        </div>
      </div>

      {/* Tabs Filter */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="rounded-xl bg-secondary/60 p-1">
          <TabsTrigger value="all" className="rounded-lg text-xs">
            সবগুলো (All)
          </TabsTrigger>
          <TabsTrigger value="weather" className="rounded-lg text-xs">
            আবহাওয়া ও স্প্রে নীতি
          </TabsTrigger>
          <TabsTrigger value="pest" className="rounded-lg text-xs">
            কীটপতঙ্গ ও রোগ
          </TabsTrigger>
          <TabsTrigger value="irrigation" className="rounded-lg text-xs">
            সেচ ও ভালভ
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Alert Event Cards */}
      <div className="space-y-4">
        {/* Rain Safety Guard Alert */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <CloudRain className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold">
                      বৃষ্টির নিরাপত্তা সতর্কতা: স্প্রে স্থগিত
                    </CardTitle>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600 text-[10px]">
                      AI Safety Guard
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    আগামী ৬ ঘণ্টার মধ্যে বৃষ্টির সম্ভাবনা &gt; ৬০% • স্প্রেয়ার বন্ধ রাখা হয়েছে
                  </CardDescription>
                </div>
              </div>
              <SimulatedBadge />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="rounded-xl bg-secondary/30 p-3 space-y-2 border border-border/40">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pest Low Confidence Alert */}
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <Bug className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold">
                      কীটপতঙ্গ শনাক্তকরণ: সরেজমিনে পরিদর্শনের সুপারিশ (INSPECT)
                    </CardTitle>
                    <Badge variant="destructive" className="text-[10px]">
                      Confidence &lt; 0.6
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    প্লট #২ সরিষা ক্ষেত • ড্রোন ফটো বিশ্লেষণ আত্মবিশ্বাস ৫৭%
                  </CardDescription>
                </div>
              </div>
              <SimulatedBadge />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="rounded-xl bg-secondary/30 p-3 space-y-2 border border-border/40">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-28 rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regular Status Skeleton Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">সেচ চ্যানেল স্বাভাবিক</CardTitle>
                  <CardDescription className="text-xs">
                    প্লট #১ সেচ সম্পন্ন • মাটির আর্দ্রতা অপ্টিমাল স্তরে পৌঁছেছে
                  </CardDescription>
                </div>
              </div>
              <SimulatedBadge label="IoT" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
