"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Droplets, Thermometer, Activity, Radio, Cpu, Clock } from "lucide-react";

export interface SensorItem {
  id: string;
  type: string;
  label: string;
  lastValue: number | null;
  lastSeen: Date | string | null;
}

interface SensorListProps {
  sensors: SensorItem[];
}

function getSensorIcon(type: string) {
  switch (type.toUpperCase()) {
    case "SOIL_MOISTURE":
      return <Droplets className="size-4 text-sky-600 dark:text-sky-400" />;
    case "TEMPERATURE":
      return <Thermometer className="size-4 text-amber-600 dark:text-amber-400" />;
    case "SOIL_PH":
      return <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Radio className="size-4 text-primary" />;
  }
}

function formatSensorValue(type: string, value: number | null) {
  if (value === null || value === undefined) return "—";
  switch (type.toUpperCase()) {
    case "SOIL_MOISTURE":
      return `${value.toFixed(1)}%`;
    case "TEMPERATURE":
      return `${value.toFixed(1)}°C`;
    case "SOIL_PH":
      return `${value.toFixed(2)} pH`;
    default:
      return `${value}`;
  }
}

function getSensorTypeName(type: string) {
  switch (type.toUpperCase()) {
    case "SOIL_MOISTURE":
      return "মাটির আর্দ্রতা প্রোব";
    case "TEMPERATURE":
      return "আবহাওয়া স্টেশন";
    case "SOIL_PH":
      return "পিএইচ ও পুষ্টি সেন্সর";
    default:
      return type;
  }
}

function formatLastSeen(dateStr: Date | string | null) {
  if (!dateStr) return "কখনও নয় (Never)";
  const date = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return "এইমাত্র (Just now)";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} মিনিট আগে (${diffMin}m ago)`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে (${diffHours}h ago)`;
  return date.toLocaleDateString("bn-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SensorList({ sensors }: SensorListProps) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                ফিল্ড সেন্সর স্ট্যাটাস (Sensor Status)
              </CardTitle>
              <CardDescription className="text-xs">
                জমিতে স্থাপিত আইওটি টেলিমেট্রি নোড
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-semibold">
              মোট: {sensors.length} টি সেন্সর
            </Badge>
            <SimulatedBadge label="Simulated Hardware" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {sensors.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            এই প্লটে কোনো সেন্সর সংযুক্ত নেই।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sensors.map((sensor) => {
              const isOnline = !!sensor.lastSeen;
              return (
                <div
                  key={sensor.id}
                  className="rounded-xl border border-border/70 p-3.5 bg-background hover:border-primary/40 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {getSensorIcon(sensor.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {sensor.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {getSensorTypeName(sensor.type)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`size-2 shrink-0 rounded-full mt-1 ${
                        isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                      }`}
                      title={isOnline ? "Active telemetry" : "Offline"}
                    />
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-border/40">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                        সর্বশেষ মান (Value)
                      </span>
                      <span className="text-base font-bold font-mono text-foreground">
                        {formatSensorValue(sensor.type, sensor.lastValue)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block flex items-center justify-end gap-1">
                        <Clock className="size-2.5" /> শেষ প্রাপ্তি
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatLastSeen(sensor.lastSeen)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
