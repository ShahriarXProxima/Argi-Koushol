import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Shield, Radio, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              সিস্টেম সেটিংস
            </h1>
            <SimulatedBadge label="Config" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Farm System Configurations, API Integrations &amp; Safety Thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 rounded-xl gap-1.5 text-xs">
            <Save className="size-3.5" />
            <span>পরিবর্তন সংরক্ষণ করুন</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* WhatsApp & Alerts Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Bell className="size-5 text-primary" />
              <div>
                <CardTitle className="text-base font-bold">হোয়াটসঅ্যাপ ও এসএমএস সতর্কতা</CardTitle>
                <CardDescription>Twilio WhatsApp Alert Integration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border/70 p-3.5">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">বৃষ্টি ও জরুরি স্প্রে সতর্কতা</div>
                  <div className="text-xs text-muted-foreground">কৃষকের হোয়াটসঅ্যাপে তাৎক্ষণিক বার্তা প্রেরণ</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/70 p-3.5">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">দৈনিক ফসল স্বাস্থ্য সামারি</div>
                  <div className="text-xs text-muted-foreground">প্রতিদিন সকালে ফিল্ড স্ট্যাটাস আপডেট</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* AI Farm Safety Thresholds */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Shield className="size-5 text-primary" />
              <div>
                <CardTitle className="text-base font-bold">AI নিরাপত্তা ও স্বয়ংক্রিয় নিয়ন্ত্রণ থ্রেশহোল্ড</CardTitle>
                <CardDescription>Rain Probability &amp; Confidence Guards</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 p-3.5 space-y-1.5 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">বৃষ্টির সেফটি গার্ড থ্রেশহোল্ড</span>
                  <span className="text-xs font-mono font-bold text-destructive">&gt; ৫০% সম্ভাবনা</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  বৃষ্টির সম্ভাবনা ৫০% অতিক্রম করলে স্বয়ংক্রিয় স্প্রেয়ার স্থগিত থাকবে।
                </p>
              </div>

              <div className="rounded-xl border border-border/70 p-3.5 space-y-1.5 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">কীটপতঙ্গ শনাক্তকরণ কনফিডেন্স কাট-অফ</span>
                  <span className="text-xs font-mono font-bold text-amber-600">&lt; ০.৬ (INSPECT)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  কনফিডেন্স ০.৬ এর নিচে হলে রাসায়নিক সুপারিশের বদলে সরেজমিনে পরিদর্শনের আদেশ দেওয়া হবে।
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* Automation & MCP / n8n Integration Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Radio className="size-5 text-primary" />
              <div>
                <CardTitle className="text-base font-bold">অটোমেশন ও সিস্টেম কানেক্টিভিটি</CardTitle>
                <CardDescription>n8n Workflows &amp; Model Context Protocol (MCP) Server</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 p-3 space-y-1">
                <div className="text-xs text-muted-foreground">MCP সার্ভার স্ট্যাটাস</div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold">কানেক্টেড (Port 3001)</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 p-3 space-y-1">
                <div className="text-xs text-muted-foreground">n8n অটোনোমাস ওয়েবহুক</div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-semibold">স্ট্যান্ডবাই (Simulated)</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 p-3 space-y-1">
                <div className="text-xs text-muted-foreground">Gemini 2.5 Flash LLM</div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold">সক্রিয় (Active)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
