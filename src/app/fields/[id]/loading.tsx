import { Skeleton } from "@/components/ui/skeleton";

export default function FieldDetailLoading() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Back button & Title Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4 Sensor Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Telemetry Charts & Decisions Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-40 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border/60 p-3 space-y-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
