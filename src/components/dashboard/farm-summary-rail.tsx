"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Settings,
  MapPin,
  Sprout,
  CheckCircle2,
  ChevronRight,
  Plane,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SimulatedBadge } from "@/components/simulated-badge";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { MapFieldItem } from "./field-map-inner";

interface AlertItem {
  id: string;
  fieldId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  messageBn?: string | null;
  source: string;
  read: boolean;
  createdAt: string;
  field?: {
    id: string;
    name: string;
    crop: string;
  } | null;
}

interface FarmSummaryRailProps {
  fields: MapFieldItem[];
  selectedField: MapFieldItem;
  initialAlerts: AlertItem[];
  onSelectField?: (field: MapFieldItem) => void;
}

// 7-day activity data for the tactile stacked bar chart
const WEEKLY_ACTIVITY = [
  { dayBn: "সোম", dayEn: "Mon", soil: 35, water: 25, nutrient: 20, weather: 15 },
  { dayBn: "মঙ্গল", dayEn: "Tue", soil: 40, water: 20, nutrient: 15, weather: 20 },
  { dayBn: "বুধ", dayEn: "Wed", soil: 30, water: 30, nutrient: 25, weather: 10 },
  { dayBn: "বৃহঃ", dayEn: "Thu", soil: 45, water: 15, nutrient: 20, weather: 15 },
  { dayBn: "শুক্র", dayEn: "Fri", soil: 25, water: 20, nutrient: 30, weather: 20 },
  { dayBn: "শনি", dayEn: "Sat", soil: 35, water: 25, nutrient: 15, weather: 20 },
  { dayBn: "রবি", dayEn: "Sun", soil: 40, water: 25, nutrient: 20, weather: 15, isToday: true },
];

export function FarmSummaryRail({
  fields,
  selectedField,
  initialAlerts,
}: FarmSummaryRailProps) {
  const { isBangla } = useI18n();

  const unreadAlerts = initialAlerts.filter((a) => !a.read).slice(0, 3);
  const totalAreaHa = fields.reduce((acc, f) => acc + (f.areaHa || 2.5), 0).toFixed(1);

  return (
    <div className="card-soft-container rounded-[32px] p-6 border shadow-xs flex flex-col gap-6">
      {/* Top Header Row with Quick Icons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SimulatedBadge label="Telemetry Node" />
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/alerts" aria-label="Alerts">
            <Button
              variant="ghost"
              size="icon"
              className="size-8.5 rounded-full bg-card hover:bg-secondary border border-border/80 shadow-xs cursor-pointer"
            >
              <Bell className="size-4 text-foreground" />
            </Button>
          </Link>
          <Link href="/settings" aria-label="Settings">
            <Button
              variant="ghost"
              size="icon"
              className="size-8.5 rounded-full bg-card hover:bg-secondary border border-border/80 shadow-xs cursor-pointer"
            >
              <Settings className="size-4 text-foreground" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Farmer Profile Section (Centered like Annette Black in reference image) */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="relative">
          <div className="size-20 rounded-full p-1 bg-gradient-to-tr from-primary/30 via-emerald-400/20 to-amber-300/30 border border-primary/20 shadow-sm flex items-center justify-center">
            <Avatar className="size-full rounded-full bg-primary/10">
              <AvatarFallback className="text-xl font-extrabold text-primary rounded-full">
                {isBangla ? "র" : "RI"}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="absolute bottom-0 right-1 flex size-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-3.5 bg-emerald-500 ring-2 ring-card" />
          </span>
        </div>

        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-foreground font-heading">
            {isBangla ? "রফিকুল ইসলাম" : "Rafiqul Islam"}
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium">
            <MapPin className="size-3 text-primary" />
            <span>{isBangla ? "ময়মনসিংহ কৃষি অঞ্চল • সেক্টর ১-৪" : "Mymensingh Sector 1–4"}</span>
          </div>
        </div>
      </div>

      {/* Farm Stats / Plots Pill Card */}
      <div className="rounded-2xl bg-card p-3.5 border border-border/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sprout className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              {isBangla ? `${fields.length}টি সক্রিয় প্লট` : `${fields.length} Active Plots`}
            </span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[170px]">
              {selectedField?.name ? `${selectedField.name} • ` : ""}{isBangla ? `${totalAreaHa} হেক্টর` : `${totalAreaHa} Ha`}
            </span>
          </div>
        </div>

        <Link
          href="/fields"
          className="size-7 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="View all fields"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* Weekly Activity Section (Stacked Colorful Pastel Bar Chart) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isBangla ? "কার্যক্রম ও পুষ্টি মাত্রা" : "Weekly Activity"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-foreground">
                {isBangla ? "৭২ ঘণ্টা নিরবচ্ছিন্ন" : "72h Precision Flow"}
              </span>
              <span className="text-xs">👍</span>
            </div>
          </div>

          <div className="inline-flex items-center rounded-full bg-card px-2.5 py-1 border border-border/80 text-[11px] font-semibold text-muted-foreground">
            {isBangla ? "চলতি সপ্তাহ" : "This Week"}
          </div>
        </div>

        {/* Tactile Stacked Bar Chart */}
        <div className="rounded-2xl bg-card p-4 border border-border/80 shadow-xs">
          <div className="grid grid-cols-7 gap-2 items-end h-28 pt-2">
            {WEEKLY_ACTIVITY.map((item, idx) => {
              const label = isBangla ? item.dayBn : item.dayEn;
              const isToday = item.isToday;

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col items-center justify-end h-full relative transition-all group",
                    isToday ? "p-1 rounded-xl ring-2 ring-primary/40 bg-primary/5" : ""
                  )}
                >
                  {/* Segmented Stacked Bar */}
                  <div className="w-4 sm:w-5 flex flex-col-reverse rounded-full overflow-hidden bg-secondary/60 h-20 shadow-xs">
                    {/* Layer 1: Mint */}
                    <div
                      style={{ height: `${item.soil}%` }}
                      className="w-full bg-[#9FE1BE] dark:bg-emerald-600 transition-all"
                      title={`Soil: ${item.soil}%`}
                    />
                    {/* Layer 2: Lavender */}
                    <div
                      style={{ height: `${item.water}%` }}
                      className="w-full bg-[#B8C4F8] dark:bg-indigo-500 transition-all"
                      title={`Water: ${item.water}%`}
                    />
                    {/* Layer 3: Amber */}
                    <div
                      style={{ height: `${item.nutrient}%` }}
                      className="w-full bg-[#FCD8A5] dark:bg-amber-500 transition-all"
                      title={`Nutrient: ${item.nutrient}%`}
                    />
                    {/* Layer 4: Peach */}
                    <div
                      style={{ height: `${item.weather}%` }}
                      className="w-full bg-[#FBB2A7] dark:bg-rose-500 transition-all"
                      title={`Weather: ${item.weather}%`}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={cn(
                      "text-[10px] font-medium mt-1.5 transition-colors",
                      isToday
                        ? "font-bold text-primary underline underline-offset-2"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Micro Legend */}
          <div className="flex items-center justify-between border-t border-border/60 pt-2.5 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#9FE1BE]" /> {isBangla ? "মাটি" : "Soil"}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#B8C4F8]" /> {isBangla ? "পানি" : "Water"}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#FCD8A5]" /> {isBangla ? "সার" : "Nutrient"}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#FBB2A7]" /> {isBangla ? "আবহাওয়া" : "Weather"}
            </span>
          </div>
        </div>
      </div>

      {/* Active Alerts & Interventions Preview (Matching the 'My courses' list cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isBangla ? "জরুরি সংকেত ও অ্যাকশন" : "Active Alerts & Actions"}
          </h3>
          <Link
            href="/alerts"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            <span>{isBangla ? "সব দেখুন" : "View all"}</span>
            <ChevronRight className="size-3" />
          </Link>
        </div>

        {unreadAlerts.length === 0 ? (
          <div className="rounded-2xl bg-card p-4 border border-border/80 text-center space-y-1.5">
            <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-foreground">
              {isBangla ? "কোনো জরুরি সতর্কতা নেই" : "All Fields Nominal"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isBangla ? "খামারের সব সেন্সর স্বাভাবিক সীমার মধ্যে আছে" : "All sensor telemetry in safe bounds"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {unreadAlerts.map((alert) => {
              const isCritical = alert.severity === "CRITICAL" || alert.severity === "HIGH";

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-2xl p-3.5 border transition-all duration-200 shadow-xs space-y-2",
                    isCritical
                      ? "card-pastel-peach"
                      : "card-pastel-lavender"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 dark:bg-black/30 px-2 py-0.5 text-[10px] font-bold shadow-xs">
                      {alert.source === "N8N" ? (
                        <>
                          <Bot className="size-3" /> n8n Robot
                        </>
                      ) : alert.source === "DRONE_VISION" ? (
                        <>
                          <Plane className="size-3" /> Drone
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-3" /> AI Guard
                        </>
                      )}
                    </span>
                    <span className="text-[10px] font-semibold opacity-75">
                      {alert.field?.name || "Plot"}
                    </span>
                  </div>

                  <p className="text-xs font-bold leading-tight">
                    {alert.title}
                  </p>

                  <p className="text-[11px] opacity-85 line-clamp-2 leading-relaxed">
                    {isBangla && alert.messageBn ? alert.messageBn : alert.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
