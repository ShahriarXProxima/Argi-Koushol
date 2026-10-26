import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulatedBadgeProps {
  className?: string;
  label?: string;
}

export function SimulatedBadge({ className, label = "Simulated" }: SimulatedBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 rounded-md select-none",
        className
      )}
    >
      <Sparkles className="size-2.5 text-amber-600 dark:text-amber-400" />
      <span>{label}</span>
    </Badge>
  );
}
