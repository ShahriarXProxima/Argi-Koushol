"use client";

import * as React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Info } from "lucide-react";

export function Footer() {
  const { isBangla } = useI18n();

  return (
    <footer className="w-full border-t border-border/60 bg-card/60 backdrop-blur-xs py-6 px-4 md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        {/* Simulated Telemetry Banner Notice */}
        <div className="flex items-start md:items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2 text-foreground/90 max-w-2xl">
          <Info className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 md:mt-0" />
          <p className="text-[11px] leading-relaxed">
            {isBangla ? (
              <span>
                <strong className="font-semibold text-amber-700 dark:text-amber-400">সিমুলেটেড ডেটা বিজ্ঞপ্তি:</strong> সেন্সর, ড্রোন ছবি, স্প্রেয়ার এবং সেচ ভালভ পরীক্ষামূলক উদ্দেশ্যে সিমুলেটেড। কোনো বাস্তব হার্ডওয়্যার সংযুক্ত নেই।
              </span>
            ) : (
              <span>
                <strong className="font-semibold text-amber-700 dark:text-amber-400">Simulated Data Notice:</strong> Sensors, drone aerial scans, precision sprayer valves, and irrigation equipment telemetry are simulated for demonstration. No physical actuators triggered.
              </span>
            )}
          </p>
        </div>

        {/* Brand & Project Info */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-right shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="flex size-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-foreground">Agri-Koushol কৃষি কৌশল</span>
            <span className="text-[10px] text-muted-foreground">v0.1.0</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <Link
              href="/settings"
              className="hover:text-primary transition-colors hover:underline"
            >
              {isBangla ? "কন্ট্রোল প্যানেল" : "Control Panel"}
            </Link>
            <span>•</span>
            <Link
              href="/yieldmax"
              className="hover:text-primary transition-colors hover:underline"
            >
              YieldMax
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
