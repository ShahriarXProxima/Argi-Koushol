"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapFieldItem } from "./field-map-inner";

interface FieldMapProps {
  fields: MapFieldItem[];
  selectedFieldId?: string;
  onSelectField?: (field: MapFieldItem) => void;
}

// Dynamically import the Leaflet map with ssr: false to prevent window/navigator hydration mismatch
const DynamicFieldMap = dynamic(() => import("./field-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[380px] w-full items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-3 w-32 rounded-md" />
      </div>
    </div>
  ),
});

export function FieldMap(props: FieldMapProps) {
  return <DynamicFieldMap {...props} />;
}
