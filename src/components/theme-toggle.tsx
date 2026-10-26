"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative size-9 rounded-xl border border-border/60 hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
            aria-label="Toggle theme"
          />
        }
      >
        <Sun className="size-4.5 text-amber-400 rotate-0 scale-100 transition-transform hidden dark:block" />
        <Moon className="size-4.5 text-emerald-800 rotate-0 scale-100 transition-transform dark:hidden" />
        <span className="sr-only">Toggle theme</span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs font-medium">
        থিম পরিবর্তন (Toggle Theme)
      </TooltipContent>
    </Tooltip>
  );
}
