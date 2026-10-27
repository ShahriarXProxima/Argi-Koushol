import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-52 rounded" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
