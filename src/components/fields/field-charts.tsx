"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Droplets, Thermometer, Info } from "lucide-react";

export interface ChartReading {
  soilMoisture: number;
  temperature: number;
  humidity: number;
  ph?: number | null;
  recordedAt: string | Date;
}

export interface ChartDecisionMarker {
  id: string;
  action: string;
  status: string;
  reasoning: string;
  createdAt: string | Date;
}

interface FieldChartsProps {
  readings: ChartReading[];
  threshold: number;
  decisions: ChartDecisionMarker[];
}

const emptySubscribe = () => () => {};

export function FieldCharts({ readings, threshold, decisions }: FieldChartsProps) {
  const [timeRange, setTimeRange] = React.useState<"24h" | "7d">("24h");
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Filter readings based on 24h or 7d
  const activeReadings = React.useMemo(() => {
    if (readings.length === 0) return [];
    if (timeRange === "24h") {
      return readings.slice(-24);
    }
    // For 7d, show every 2nd or 3rd point if needed or all
    return readings;
  }, [readings, timeRange]);

  // Format data for Recharts
  const chartData = React.useMemo(() => {
    return activeReadings.map((r) => {
      const d = new Date(r.recordedAt);
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      const dayStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
      return {
        timestamp: d.getTime(),
        displayTime: timeRange === "24h" ? timeStr : `${dayStr} ${timeStr}`,
        soilMoisture: r.soilMoisture,
        temperature: r.temperature,
        humidity: r.humidity,
        ph: r.ph,
      };
    });
  }, [activeReadings, timeRange]);

  // Find decisions that fall within the current chart time window
  const activeDecisionMarkers = React.useMemo(() => {
    if (chartData.length === 0 || decisions.length === 0) return [];
    const minTime = chartData[0]?.timestamp || 0;
    const maxTime = chartData[chartData.length - 1]?.timestamp || Infinity;

    return decisions
      .filter((dec) => {
        const decTime = new Date(dec.createdAt).getTime();
        return decTime >= minTime && decTime <= maxTime;
      })
      .map((dec) => {
        const decTime = new Date(dec.createdAt).getTime();
        // Find closest reading point in chartData to attach dot
        let closest = chartData[0];
        let minDiff = Math.abs(closest.timestamp - decTime);
        for (const pt of chartData) {
          const diff = Math.abs(pt.timestamp - decTime);
          if (diff < minDiff) {
            minDiff = diff;
            closest = pt;
          }
        }
        return {
          id: dec.id,
          x: closest.displayTime,
          y: closest.soilMoisture,
          action: dec.action,
          status: dec.status,
          reasoning: dec.reasoning,
        };
      });
  }, [chartData, decisions]);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-72 rounded-2xl border border-dashed border-border bg-secondary/20 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">চার্ট লোড হচ্ছে... (Loading charts)</span>
        </div>
        <div className="h-64 rounded-2xl border border-dashed border-border bg-secondary/20 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">জলবায়ু ডাটা প্রস্তুত হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Soil Moisture Line Chart */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Droplets className="size-4.5 text-primary" />
                  <span>মাটির আর্দ্রতা প্রোফাইল (Soil Moisture % v/v)</span>
                </CardTitle>
                <SimulatedBadge label="IoT Telemetry" />
              </div>
              <CardDescription className="text-xs mt-0.5">
                সেচ থ্রেশহোল্ড ({threshold}%) ড্যাশ লাইন এবং AI সিদ্ধান্ত মার্কার প্রদর্শিত
              </CardDescription>
            </div>

            {/* 24h vs 7d toggle */}
            <div className="flex items-center gap-1 rounded-xl bg-secondary/80 p-1 border border-border/70 self-start sm:self-auto">
              <Button
                size="xs"
                variant={timeRange === "24h" ? "default" : "ghost"}
                onClick={() => setTimeRange("24h")}
                className={`h-7 px-2.5 rounded-lg text-xs font-semibold ${
                  timeRange === "24h" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                ২৪ ঘণ্টা (24h)
              </Button>
              <Button
                size="xs"
                variant={timeRange === "7d" ? "default" : "ghost"}
                onClick={() => setTimeRange("7d")}
                className={`h-7 px-2.5 rounded-lg text-xs font-semibold ${
                  timeRange === "7d" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                ৭ দিন (7d)
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 px-2 sm:px-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayTime"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={timeRange === "24h" ? 25 : 45}
                />
                <YAxis
                  domain={[20, 60]}
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isDry = data.soilMoisture < threshold;
                      return (
                        <div className="rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-lg backdrop-blur-md text-xs space-y-1">
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {data.displayTime}
                          </div>
                          <div className="flex items-center justify-between gap-3 font-semibold">
                            <span>মাটির আর্দ্রতা:</span>
                            <span className={isDry ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                              {data.soilMoisture}%
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            সেচ সীমা: {threshold}% ({isDry ? "ঘাটতি রয়েছে" : "পর্যাপ্ত"})
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Irrigation threshold reference line */}
                <ReferenceLine
                  y={threshold}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `সেচ থ্রেশহোল্ড: ${threshold}%`,
                    position: "insideTopRight",
                    fill: "#d97706",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />

                {/* Main soil moisture curve - animation false to prevent flicker on new points */}
                <Line
                  type="monotone"
                  dataKey="soilMoisture"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ r: 5, fill: "#059669", stroke: "#ffffff", strokeWidth: 2 }}
                />

                {/* Decision markers */}
                {activeDecisionMarkers.map((marker) => (
                  <ReferenceDot
                    key={marker.id}
                    x={marker.x}
                    y={marker.y}
                    r={6}
                    fill="#9333ea"
                    stroke="#ffffff"
                    strokeWidth={2}
                    label={{
                      value: `⚡ ${marker.action}`,
                      position: "top",
                      fill: "#9333ea",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick legend & insight note */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-600" />
                <span>আর্দ্রতা শতকরা হার</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-amber-500 border-dashed" />
                <span>সেচ সীমা ({threshold}%)</span>
              </div>
              {activeDecisionMarkers.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-purple-600" />
                  <span>AI সিদ্ধান্ত মার্কার</span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/90">
              <Info className="size-3 text-primary" />
              <span>FDR ক্যাপাসিটিভ সেন্সর দ্বারা প্রতি ঘণ্টায় সংগৃহীত</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Temperature & Humidity Dual-Axis Line Chart */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Thermometer className="size-4.5 text-amber-600" />
                <span>ক্যানোপি তাপমাত্রা ও আর্দ্রতা (Microclimate)</span>
              </CardTitle>
              <SimulatedBadge label="Weather" />
            </div>
            <Badge variant="outline" className="text-[11px]">
              দ্বিমুখী স্কেল (Dual Y-Axis)
            </Badge>
          </div>
          <CardDescription className="text-xs">
            তাপমাত্রা (°C - বাম অক্ষ) এবং আপেক্ষিক আর্দ্রতা (% RH - ডান অক্ষ)
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 px-2 sm:px-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: -15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayTime"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={timeRange === "24h" ? 25 : 45}
                />
                {/* Left Y Axis for Temperature */}
                <YAxis
                  yAxisId="temp"
                  domain={[15, 38]}
                  stroke="#ea580c"
                  fontSize={10}
                  tickLine={false}
                  unit="°C"
                />
                {/* Right Y Axis for Humidity */}
                <YAxis
                  yAxisId="humidity"
                  orientation="right"
                  domain={[40, 100]}
                  stroke="#0284c7"
                  fontSize={10}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-lg backdrop-blur-md text-xs space-y-1">
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {data.displayTime}
                          </div>
                          <div className="flex items-center justify-between gap-3 text-amber-600 font-semibold">
                            <span>তাপমাত্রা:</span>
                            <span>{data.temperature}°C</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-sky-600 font-semibold">
                            <span>আপেক্ষিক আর্দ্রতা:</span>
                            <span>{data.humidity}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ea580c"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="humidity"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-600" />
                <span>তাপমাত্রা (°C)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-sky-600" />
                <span>আপেক্ষিক আর্দ্রতা (% RH)</span>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">
              দৈনিক ২৪ ঘণ্টার প্রাকৃতিক সাইকেল
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
