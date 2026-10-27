"use client";

import * as React from "react";
import {
  Sprout,
  Shield,
  Trash2,
  X,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface FieldOption {
  id: string;
  name: string;
  crop: string;
}

interface ChatHeaderProps {
  fields: FieldOption[];
  selectedFieldId: string;
  onSelectField: (fieldId: string) => void;
  language: "en" | "bn";
  onToggleLanguage: () => void;
  onClearChat: () => void;
  onClose: () => void;
}

export function ChatHeader({
  fields,
  selectedFieldId,
  onSelectField,
  language,
  onToggleLanguage,
  onClearChat,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/80 bg-card/90 backdrop-blur-md rounded-t-2xl select-none shrink-0 shadow-xs">
      {/* Left: Avatar & Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative size-9 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-sm shrink-0 border border-emerald-500/30">
          <Sprout className="size-5" />
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-900 rounded-full p-0.5 shadow-xs">
            <Shield className="size-2.5 fill-current" />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm tracking-tight truncate font-bengali">
              {language === "bn" ? "শস্য-প্রহরী" : "Shoshsho-Prohori"}
            </h3>
            <span
              className="flex size-2 rounded-full bg-emerald-500 animate-pulse"
              title={language === "bn" ? "সক্রিয়" : "Online"}
            />
          </div>
          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
            <Sparkles className="size-2.5 text-amber-500" />
            <span>{language === "bn" ? "AI কৃষি সহকারী" : "AI Agronomist"}</span>
          </p>
        </div>
      </div>

      {/* Right: Controls (Field selector, Language toggle, Clear, Close) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Field Selector */}
        <div className="relative">
          <label htmlFor="chat-field-selector" className="sr-only">
            Select Field
          </label>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/70 bg-muted/50 text-xs font-medium hover:bg-muted transition-colors">
            <MapPin className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              id="chat-field-selector"
              value={selectedFieldId}
              onChange={(e) => onSelectField(e.target.value)}
              className="bg-transparent text-xs text-foreground font-medium outline-hidden cursor-pointer max-w-[105px] truncate"
            >
              <option value="all">
                {language === "bn" ? "সব মাঠ" : "All fields"}
              </option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Language Toggle Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onToggleLanguage}
                className="size-7 rounded-lg text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={`Switch language to ${language === "en" ? "Bangla" : "English"}`}
              />
            }
          >
            <span className="text-[11px] font-bold uppercase">
              {language === "en" ? "EN" : "বাং"}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[11px]">
            {language === "en" ? "Switch to বাংলা" : "Switch to English"}
          </TooltipContent>
        </Tooltip>

        {/* Clear Chat Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onClearChat}
                className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                aria-label="Clear chat conversation"
              />
            }
          >
            <Trash2 className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[11px]">
            {language === "bn" ? "কথোপকথন মুছে ফেলুন" : "Clear conversation"}
          </TooltipContent>
        </Tooltip>

        {/* Minimize / Close Button */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer ml-0.5"
          aria-label="Close chat dock"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
