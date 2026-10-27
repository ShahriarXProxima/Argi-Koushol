"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error for observability
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-6 shadow-lg space-y-5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            কিছু সমস্যা হয়েছে (Something went wrong)
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            সিস্টেমে একটি সাময়িক সমস্যা দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা ড্যাশবোর্ডে ফিরে যান।
          </p>
          <p className="text-xs text-muted-foreground/80">
            A temporary runtime error occurred while loading this page.
          </p>
        </div>

        {error.message && (
          <div className="rounded-xl bg-muted/60 p-3 text-left font-mono text-xs text-muted-foreground overflow-x-auto max-h-24">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 rounded-xl gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="size-4" />
            <span>আবার চেষ্টা করুন (Retry)</span>
          </Button>
          <Link href="/" className="flex-1">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 font-semibold border-border hover:bg-accent/40"
            >
              <Home className="size-4" />
              <span>ড্যাশবোর্ড (Home)</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
