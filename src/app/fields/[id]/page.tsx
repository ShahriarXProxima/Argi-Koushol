import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getField } from "@/lib/data/fields";
import { getReadings } from "@/lib/data/sensors";
import { getFieldDecisions } from "@/lib/data/decisions";
import { FieldDetailClient } from "@/components/fields/field-detail-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

interface FieldDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FieldDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const field = await getField(id);
  if (!field) {
    return {
      title: "Field Not Found | Agri-Koushol",
    };
  }

  return {
    title: `${field.name} (${field.crop}) | Agri-Koushol কৃষি কৌশল`,
    description: `Precision field telemetry, soil moisture analytics, and autonomous AI decisions for ${field.name}.`,
  };
}

async function FieldDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const field = await getField(id);
  if (!field) {
    notFound();
  }

  // Fetch 7 days (168 hours) of hourly readings & past autonomous decisions
  const [readings, decisions] = await Promise.all([
    getReadings(id, 168),
    getFieldDecisions(id),
  ]);

  return <FieldDetailClient field={field} readings={readings} decisions={decisions} />;
}

export default function FieldDetailPage({ params }: FieldDetailPageProps) {
  return (
    <Suspense fallback={<FieldDetailSkeleton />}>
      <FieldDetailContent params={params} />
    </Suspense>
  );
}

function FieldDetailSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
          <Skeleton className="h-11 w-48 rounded-xl" />
        </div>
        <Skeleton className="h-3 w-full max-w-md rounded-full mt-4" />
      </div>

      <Skeleton className="h-96 w-full rounded-2xl" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
