"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global uncaught error:", error);
  }, [error]);

  return (
    <html lang="bn">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-card p-6 shadow-xl space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">
              সিস্টেম ত্রুটি (Critical System Error)
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              অ্যাপ্লিকেশনের রুট স্তরে ত্রুটি দেখা দিয়েছে। দয়া করে পৃষ্ঠাটি রিফ্রেশ বা পুনরায় চেষ্টা করুন।
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl h-11 px-4 font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
          >
            <RefreshCw className="size-4" />
            <span>পৃষ্ঠাটি রিলোড করুন (Reload App)</span>
          </button>
        </div>
      </body>
    </html>
  );
}
