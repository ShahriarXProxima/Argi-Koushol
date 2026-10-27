"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, toggleLocale } = useI18n();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLocale}
      className="h-9 px-2.5 rounded-xl border-border/80 bg-background/80 hover:bg-secondary/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
      aria-label="Toggle language between English and Bangla"
      title={locale === "bn" ? "Switch to English" : "বাংলা ভাষায় দেখুন"}
    >
      <Globe className="size-3.5 text-primary" />
      <span className="font-mono text-[11px] font-bold tracking-wide text-foreground">
        {locale === "bn" ? "বাংলা" : "EN"}
      </span>
      <span className="text-[10px] text-muted-foreground">
        / {locale === "bn" ? "EN" : "বাংলা"}
      </span>
    </Button>
  );
}
