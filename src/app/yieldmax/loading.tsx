import { Skeleton } from "@/components/ui/skeleton";

export default function YieldMaxLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Yield Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card p-5 space-y-5">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
