"use client";

import * as React from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Popup,
  Circle,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimulatedBadge } from "@/components/simulated-badge";
import { ExternalLink, Droplets, Sprout, AlertCircle, ShieldAlert } from "lucide-react";
import type { LatLngExpression } from "leaflet";

export interface MapFieldItem {
  id: string;
  name: string;
  crop: string;
  growthStage: string;
  lat: number;
  lng: number;
  areaHa: number;
  polygon: unknown;
  soilMoistureThreshold: number;
  latestReading?: {
    soilMoisture: number;
    temperature: number;
    humidity: number;
  } | null;
  detections?: Array<{
    id: string;
    label: string;
    confidence: number;
    lat?: number | null;
    lng?: number | null;
  }>;
}

interface FieldMapInnerProps {
  fields: MapFieldItem[];
  selectedFieldId?: string;
  onSelectField?: (field: MapFieldItem) => void;
}

export default function FieldMapInner({
  fields,
  selectedFieldId,
  onSelectField,
}: FieldMapInnerProps) {
  // Center of Mymensingh farm cluster
  const defaultCenter: LatLngExpression = [24.7585, 90.4190];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full z-0 min-h-[380px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Field Polygons */}
        {fields.map((field) => {
          const isSelected = selectedFieldId === field.id;
          const currentMoisture = field.latestReading?.soilMoisture ?? 45;
          const hasBlightAlert = field.name.includes("Sector 4") || (field.detections && field.detections.length > 0);
          const isDry = currentMoisture < field.soilMoistureThreshold;

          // Health-based styling:
          // Red alert: Blight / disease detection
          // Amber watch: Dry soil beneath threshold
          // Green ok: Normal / healthy
          let strokeColor = "#16a34a"; // green
          let fillColor = "#22c55e";
          let statusText = "স্বাভাবিক (Healthy)";
          let statusVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

          if (hasBlightAlert) {
            strokeColor = "#dc2626"; // red
            fillColor = "#ef4444";
            statusText = "রোগ সতর্কতা (Blight Alert)";
            statusVariant = "destructive";
          } else if (isDry) {
            strokeColor = "#d97706"; // amber
            fillColor = "#f59e0b";
            statusText = "শুষ্ক মাটি (Moisture Deficit)";
            statusVariant = "secondary";
          }

          // Extract coordinates from polygon JSON
          const polyObj = field.polygon as { coordinates?: number[][][] } | null;
          const rawCoords = polyObj?.coordinates?.[0] || [];
          const positions: LatLngExpression[] = rawCoords.map((pt) => [pt[0], pt[1]]);

          if (positions.length < 3) return null;

          return (
            <React.Fragment key={field.id}>
              <Polygon
                positions={positions}
                eventHandlers={{
                  click: () => {
                    onSelectField?.(field);
                  },
                }}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: isSelected ? 0.55 : 0.35,
                  weight: isSelected ? 3.5 : 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <div className="font-sans text-xs">
                    <span className="font-bold">{field.name}</span> • {field.crop}
                  </div>
                </Tooltip>

                <Popup className="agri-map-popup">
                  <div className="p-1 space-y-3 min-w-[220px]">
                    <div className="flex items-start justify-between gap-2 border-b pb-2">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{field.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Sprout className="size-3 text-primary" />
                          <span>{field.crop}</span>
                        </p>
                      </div>
                      <Badge variant={statusVariant} className="text-[10px] shrink-0">
                        {statusText}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Droplets className="size-3 text-sky-600" />
                          মাটির আর্দ্রতা:
                        </span>
                        <span className="font-bold font-mono">
                          {currentMoisture}%
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {" "}(থ্রেশহোল্ড: {field.soilMoistureThreshold}%)
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">জমি পরিমাপ:</span>
                        <span className="font-medium">{field.areaHa} হেক্টর ({Math.round(field.areaHa * 7.47)} বিঘা)</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t">
                      <SimulatedBadge label="IoT Active" />
                      <Link href={`/fields`} className="inline-flex">
                        <Button size="xs" variant="outline" className="h-7 text-[11px] gap-1 rounded-lg">
                          <span>প্লট ডিটেইলস</span>
                          <ExternalLink className="size-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Polygon>

              {/* Render Detections and 15m Spray Radius Circles for this field */}
              {field.detections?.map((det) => {
                if (det.lat == null || det.lng == null) return null;
                const center: LatLngExpression = [det.lat, det.lng];

                return (
                  <React.Fragment key={det.id}>
                    {/* 15m Precision Spray Treatment Radius Circle */}
                    <Circle
                      center={center}
                      radius={15}
                      pathOptions={{
                        color: "#dc2626",
                        fillColor: "#ef4444",
                        fillOpacity: 0.22,
                        dashArray: "5, 5",
                        weight: 2,
                      }}
                    >
                      <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9}>
                        <span className="text-[11px] font-sans font-medium">
                          ১৫ মিটার প্রিসিশন স্প্রে জোন (15m Spot Radius)
                        </span>
                      </Tooltip>
                    </Circle>

                    {/* Center Pulsing Marker for Detection */}
                    <CircleMarker
                      center={center}
                      radius={7}
                      pathOptions={{
                        color: "#ffffff",
                        fillColor: "#dc2626",
                        fillOpacity: 1,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-2 min-w-[200px]">
                          <div className="flex items-center gap-1.5 text-destructive font-bold text-xs">
                            <AlertCircle className="size-4" />
                            <span>ড্রোন শনাক্তকরণ (Drone Vision)</span>
                          </div>
                          <p className="text-xs font-semibold">{det.label}</p>
                          <div className="text-[11px] text-muted-foreground">
                            আত্মবিশ্বাস: <span className="font-mono font-bold text-foreground">{Math.round(det.confidence * 100)}%</span>
                          </div>
                          <div className="text-[10px] bg-destructive/10 text-destructive p-1.5 rounded-md">
                            🎯 ১৫ মিটার প্রিসিশন স্প্রে রেডিয়াস নির্ধারিত
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Map Legend Floating Card */}
      <div className="absolute bottom-3 left-3 z-10 rounded-xl bg-background/90 p-2.5 shadow-md backdrop-blur-md border border-border/80 text-[11px] space-y-1.5 pointer-events-auto">
        <div className="flex items-center gap-1.5 font-bold text-foreground text-xs pb-1 border-b border-border/60">
          <ShieldAlert className="size-3.5 text-primary" />
          <span>প্লট স্বাস্থ্য নির্দেশক</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-emerald-500/80 border border-emerald-600" />
          <span className="text-muted-foreground">স্বাভাবিক (Healthy)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-amber-500/80 border border-amber-600" />
          <span className="text-muted-foreground">পর্যবেক্ষণ (Dry &lt; 35%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-destructive/80 border border-destructive" />
          <span className="text-muted-foreground">ঝুঁকি (Blight Alert)</span>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="size-3 rounded-full border-2 border-dashed border-destructive bg-destructive/20" />
          <span className="text-muted-foreground">১৫ মি. স্প্রে রেডিয়াস</span>
        </div>
      </div>
    </div>
  );
}
