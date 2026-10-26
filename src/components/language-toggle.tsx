"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const [lang, setLang] = React.useState<"EN" | "BN">("BN");

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang((prev) => (prev === "EN" ? "BN" : "EN"))}
      className="h-9 px-2.5 rounded-xl border-border/80 bg-background/80 hover:bg-secondary/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
      aria-label="Toggle language between English and Bangla"
    >
      <Globe className="size-3.5 text-primary" />
      <span className="font-mono text-[11px] tracking-wide text-foreground">
        {lang === "BN" ? "বাংলা" : "EN"}
      </span>
      <span className="text-[10px] text-muted-foreground">
        / {lang === "BN" ? "EN" : "বাংলা"}
      </span>
    </Button>
  );
}
