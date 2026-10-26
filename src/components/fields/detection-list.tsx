"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Bug, AlertTriangle, Eye, CheckCircle2, Crosshair, MapPin } from "lucide-react";
import { SimulatedBadge } from "@/components/simulated-badge";

export interface DetectionItem {
  id: string;
  fieldId: string;
  label: string;
  confidence: number;
  imageUrl: string;
  lat?: number | null;
  lng?: number | null;
  status: string;
  createdAt: Date | string;
}

interface DetectionListProps {
  detections: DetectionItem[];
  fieldName: string;
}

function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "FLAGGED":
      return (
        <Badge variant="destructive" className="font-semibold text-xs gap-1">
          <AlertTriangle className="size-3" />
          চিহ্নিত (Flagged)
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge className="bg-amber-600 text-white font-semibold text-xs gap-1 hover:bg-amber-700">
          <Eye className="size-3" />
          যাচাইকৃত (Confirmed)
        </Badge>
      );
    case "TREATED":
      return (
        <Badge className="bg-sky-600 text-white font-semibold text-xs gap-1 hover:bg-sky-700">
          <CheckCircle2 className="size-3" />
          চিকিৎসা প্রদান (Treated)
        </Badge>
      );
    case "RESOLVED":
      return (
        <Badge className="bg-emerald-600 text-white font-semibold text-xs gap-1 hover:bg-emerald-700">
          <ShieldCheck className="size-3" />
          নিরাময় সম্পন্ন (Resolved)
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function DetectionList({ detections, fieldName }: DetectionListProps) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Bug className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                বালাই ও রোগ শনাক্তকরণ (Disease &amp; Pest Detections)
              </CardTitle>
              <CardDescription className="text-xs">
                AI ভিশন মডেল ও ড্রোন ক্যামেরার স্বয়ংক্রিয় পর্যবেক্ষণ
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-semibold">
              শনাক্ত: {detections.length} টি ঘটনা
            </Badge>
            <SimulatedBadge label="Simulated Drone/Vision" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {detections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
              <ShieldCheck className="size-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              কোনো রোগ বা বালাই শনাক্ত হয়নি
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {fieldName} বর্তমানে রোগমুক্ত ও স্বাস্থ্যকর অবস্থায় রয়েছে। সাম্প্রতিক ড্রোন স্ক্যানে কোনো ক্ষতিকর ছত্রাক বা পোকা দেখা যায়নি।
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {detections.map((detection) => {
              const confidencePercent = Math.round(detection.confidence * 100);
              const isLowConfidence = detection.confidence < 0.6;
              const formattedDate = new Date(detection.createdAt).toLocaleDateString("bn-BD", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={detection.id}
                  className="flex flex-col sm:flex-row gap-3.5 rounded-xl border border-border/70 p-3.5 bg-background hover:border-primary/40 transition-all"
                >
                  {/* Image Thumbnail */}
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/50 self-center sm:self-start">
                    {detection.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={detection.imageUrl}
                        alt={detection.label}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <Bug className="size-6 opacity-40" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 rounded-md bg-black/75 px-1 py-0.5 text-[9px] font-mono font-medium text-white">
                      AI Vision
                    </span>
                  </div>

                  {/* Detection Info */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {detection.label}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          <span>{formattedDate}</span>
                          {detection.lat && detection.lng && (
                            <span className="inline-flex items-center gap-0.5 font-mono">
                              <MapPin className="size-2.5" />
                              {detection.lat.toFixed(4)}, {detection.lng.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>{getStatusBadge(detection.status)}</div>
                    </div>

                    {/* Confidence Meter */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                          <Crosshair className="size-3 text-primary" /> মডেলের আত্মবিশ্বাস (Confidence)
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isLowConfidence
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {confidencePercent}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLowConfidence
                              ? "bg-rose-500"
                              : confidencePercent >= 80
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>
                      {isLowConfidence && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                          ⚠️ নীতি নির্দেশিকা: কনফিডেন্স ৬০% এর নিচে থাকায় স্বয়ংক্রিয় স্প্রে নিষিদ্ধ (INSPECT বাধ্যতামূলক)।
                        </p>
                      )}
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
