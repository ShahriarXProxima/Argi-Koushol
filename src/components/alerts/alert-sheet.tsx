"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Bot,
  Brain,
  Bug,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  MessageSquare,
  MessageSquareText,
  Phone,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { AlertWithDetails } from "@/lib/data/alerts";

export type AlertDecision = NonNullable<AlertWithDetails["decision"]>;

interface AlertSheetProps {
  alert: AlertWithDetails | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDecisionUpdated?: (alertId: string, updatedDecision: AlertDecision) => void;
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return (
        <Badge variant="destructive" className="font-bold text-xs gap-1">
          <ShieldAlert className="size-3.5" />
          সংকটজনক (CRITICAL)
        </Badge>
      );
    case "HIGH":
      return (
        <Badge className="bg-rose-600 text-white font-bold text-xs gap-1 hover:bg-rose-700">
          <AlertTriangle className="size-3.5" />
          উচ্চ ঝুঁকি (HIGH)
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge variant="secondary" className="border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs gap-1">
          <Info className="size-3.5" />
          মাঝারি (MEDIUM)
        </Badge>
      );
    case "LOW":
    default:
      return (
        <Badge variant="outline" className="text-sky-700 dark:text-sky-300 font-semibold text-xs gap-1">
          <CheckCircle2 className="size-3.5" />
          সাধারণ (LOW)
        </Badge>
      );
  }
}

function getActionBadge(action: string) {
  switch (action) {
    case "IRRIGATE":
      return <Badge className="bg-sky-600 text-white font-bold text-xs hover:bg-sky-700">সেচ প্রদান (IRRIGATE)</Badge>;
    case "PAUSE_IRRIGATION":
      return <Badge variant="secondary" className="font-bold text-xs text-sky-700 dark:text-sky-300">সেচ বিরতি (PAUSE)</Badge>;
    case "SPRAY_NOW":
      return <Badge className="bg-rose-600 text-white font-bold text-xs hover:bg-rose-700">স্প্রে চালনা (SPRAY_NOW)</Badge>;
    case "DELAY_SPRAY":
      return <Badge variant="secondary" className="font-bold text-xs border-amber-500/30 text-amber-700 dark:text-amber-300">স্প্রে স্থগিত (DELAY_SPRAY)</Badge>;
    case "INSPECT":
      return <Badge variant="destructive" className="font-bold text-xs">পরিদর্শন প্রয়োজন (INSPECT)</Badge>;
    case "NO_ACTION":
    default:
      return <Badge variant="outline" className="font-medium text-xs">কোনো পদক্ষেপ নেই (NO_ACTION)</Badge>;
  }
}

function getDecisionStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40 text-xs">অপেক্ষমাণ (PENDING)</Badge>;
    case "SCHEDULED":
      return <Badge className="bg-sky-600 text-white text-xs hover:bg-sky-700">নির্ধারিত (SCHEDULED)</Badge>;
    case "COMPLETED":
      return <Badge className="bg-emerald-600 text-white text-xs hover:bg-emerald-700">সম্পন্ন (COMPLETED)</Badge>;
    case "OVERRIDDEN":
      return <Badge variant="destructive" className="text-xs">বাতিলকৃত (OVERRIDDEN)</Badge>;
    case "CANCELLED":
      return <Badge variant="secondary" className="text-xs">প্রত্যাহারকৃত (CANCELLED)</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function getWhatsAppStatusBadge(status?: string | null) {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
      return (
        <Badge className="bg-emerald-600 text-white text-xs font-semibold gap-1 hover:bg-emerald-700">
          <CheckCheck className="size-3.5" /> ডেলিভারড (Delivered)
        </Badge>
      );
    case "SENT":
      return (
        <Badge className="bg-sky-600 text-white text-xs font-semibold gap-1 hover:bg-sky-700">
          <CheckCircle2 className="size-3.5" /> প্রেরিত (Sent)
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="text-amber-600 text-xs font-semibold gap-1">
          <Clock className="size-3.5" /> অপেক্ষমাণ (Pending)
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" className="text-xs font-semibold gap-1">
          <XCircle className="size-3.5" /> ব্যর্থ (Failed)
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs font-semibold gap-1">
          <MessageSquare className="size-3.5" /> লগ করা হয়েছে (Logged)
        </Badge>
      );
  }
}

export function AlertSheet({
  alert,
  isOpen,
  onOpenChange,
  onDecisionUpdated,
}: AlertSheetProps) {
  const router = useRouter();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = React.useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = React.useState(false);
  const [isOverriding, setIsOverriding] = React.useState(false);
  const [rescheduleDate, setRescheduleDate] = React.useState("");

  if (!alert) return null;

  const decision = alert.decision;
  const detection = decision?.detection || alert.field.detections?.[0] || null;

  const openRescheduleModal = () => {
    const defaultDate = decision?.scheduledFor
      ? new Date(decision.scheduledFor)
      : new Date(Date.now() + 6 * 60 * 60 * 1000);
    setRescheduleDate(defaultDate.toISOString().slice(0, 16));
    setIsRescheduleOpen(true);
  };

  const applyPresetHours = (hours: number) => {
    const d = new Date(Date.now() + hours * 60 * 60 * 1000);
    setRescheduleDate(d.toISOString().slice(0, 16));
  };

  // 1. Handle Cancel Action
  const handleCancelDecision = async () => {
    if (!decision) return;
    setIsOverriding(true);
    try {
      const res = await fetch("/api/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionId: decision.id,
          action: "cancel",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to cancel decision");
      }

      toast.success("সিদ্ধান্ত বাতিল সম্পন্ন হয়েছে", {
        description: `কৃষক কর্তৃক ${decision.action} সিদ্ধান্তটি বাতিল (OVERRIDDEN) করা হয়েছে।`,
      });

      const updated: AlertDecision = {
        ...decision,
        status: "OVERRIDDEN",
        reasoning: `${decision.reasoning} [Manually cancelled by farmer]`,
      };
      onDecisionUpdated?.(alert.id, updated);

      mutate("/api/alerts");
      mutate("/api/alerts?unreadOnly=true");
      mutate("/api/alerts?limit=8");
      router.refresh();
      setIsCancelConfirmOpen(false);
    } catch (err) {
      toast.error("সিদ্ধান্ত বাতিলে ব্যর্থ", {
        description: err instanceof Error ? err.message : "অপ্রত্যাশিত ত্রুটি ঘটেছে।",
      });
    } finally {
      setIsOverriding(false);
    }
  };

  // 2. Handle Reschedule Action
  const handleRescheduleDecision = async () => {
    if (!decision || !rescheduleDate) return;
    setIsOverriding(true);
    try {
      const scheduledIso = new Date(rescheduleDate).toISOString();
      const res = await fetch("/api/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionId: decision.id,
          action: "reschedule",
          newTime: scheduledIso,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to reschedule decision");
      }

      const formattedTime = new Date(scheduledIso).toLocaleString("bn-BD", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      toast.success("সিদ্ধান্তের সময় পরিবর্তন সফল হয়েছে", {
        description: `নতুন সময় নির্ধারণ: ${formattedTime}`,
      });

      const updated: AlertDecision = {
        ...decision,
        status: "SCHEDULED",
        scheduledFor: new Date(scheduledIso),
        reasoning: `${decision.reasoning} [Rescheduled by farmer to ${scheduledIso}]`,
      };
      onDecisionUpdated?.(alert.id, updated);

      mutate("/api/alerts");
      mutate("/api/alerts?unreadOnly=true");
      mutate("/api/alerts?limit=8");
      router.refresh();
      setIsRescheduleOpen(false);
    } catch (err) {
      toast.error("সময় পরিবর্তনে ব্যর্থ", {
        description: err instanceof Error ? err.message : "অপ্রত্যাশিত ত্রুটি ঘটেছে।",
      });
    } finally {
      setIsOverriding(false);
    }
  };

  const formattedAlertTime = new Date(alert.createdAt).toLocaleString("bn-BD", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="sm:max-w-xl w-full overflow-y-auto p-0 flex flex-col bg-background"
        >
          {/* Header */}
          <SheetHeader className="p-5 border-b border-border/60 bg-muted/20 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                {getSeverityBadge(alert.severity)}
                <Badge variant="outline" className="text-xs font-mono">
                  {alert.source}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="size-3" />
                {formattedAlertTime}
              </span>
            </div>

            <SheetTitle className="text-xl font-bold tracking-tight text-foreground text-left leading-snug">
              {alert.title}
            </SheetTitle>

            <SheetDescription className="text-left text-xs text-muted-foreground flex items-center gap-1.5">
              <span>প্লট:</span>
              <Link
                href={`/fields/${alert.field.id}`}
                className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
              >
                <span>{alert.field.name}</span>
                <span className="text-muted-foreground font-normal">({alert.field.crop})</span>
                <ExternalLink className="size-3 ml-0.5" />
              </Link>
            </SheetDescription>
          </SheetHeader>

          {/* Body */}
          <div className="p-5 space-y-5 flex-1 text-left">
            {/* 1. Full Alert Message */}
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 p-3.5 bg-card space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  সতর্কবার্তা বিবরণ (English Message)
                </span>
                <p className="text-sm text-foreground leading-relaxed">
                  {alert.message}
                </p>
              </div>

              {alert.messageBn && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5">
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block flex items-center gap-1">
                    <MessageSquareText className="size-3.5" /> বাংলা সারসংক্ষেপ
                  </span>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {alert.messageBn}
                  </p>
                </div>
              )}
            </div>

            {/* 2. WhatsApp Delivery Status */}
            <div className="rounded-xl border border-border/70 p-3.5 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  হোয়াটসঅ্যাপ নোটিফিকেশন (WhatsApp Delivery)
                </span>
                {getWhatsAppStatusBadge(alert.whatsappStatus)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span>প্রাপক: মোঃ রফিকুল ইসলাম (+880 1711-234567)</span>
                <span className="font-mono text-[11px]">Twilio Gateway</span>
              </div>
            </div>

            {/* 3. Linked Decision Card */}
            {decision ? (
              <div className="rounded-2xl border border-border/80 p-4 bg-muted/10 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        স্বয়ংক্রিয় সিদ্ধান্ত (Linked Decision)
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        ID: #{decision.id.slice(-8)} • Source: {decision.source}
                      </span>
                    </div>
                  </div>
                  <div>{getDecisionStatusBadge(decision.status)}</div>
                </div>

                {/* Simulated Equipment Banner */}
                {decision.simulated && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
                    <Sparkles className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold tracking-tight">
                        Simulated action - no real equipment was triggered
                      </p>
                      <p className="text-[11px] text-muted-foreground dark:text-amber-300/80 leading-relaxed">
                        সফটওয়্যার প্রোটোটাইপ সিমুলেশন: স্প্রেয়ার এবং সেচ পাম্প ভার্চুয়াল নোডে নিয়ন্ত্রিত হচ্ছে।
                      </p>
                    </div>
                  </div>
                )}

                {/* Action details */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">গৃহীত পদক্ষেপ:</span>
                    {getActionBadge(decision.action)}
                  </div>

                  {decision.scheduledFor && (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                      <Calendar className="size-3.5 text-primary" />
                      <span>
                        নির্ধারিত সময়: {new Date(decision.scheduledFor).toLocaleString("bn-BD")}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Reasoning */}
                <div className="rounded-xl border border-border/70 p-3 bg-background space-y-1.5">
                  <span className="text-[11px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
                    <Brain className="size-3.5" /> AI সিদ্ধান্তের যৌক্তিক কারণ (AI Reasoning)
                  </span>
                  <p className="text-xs text-foreground leading-relaxed italic bg-muted/30 p-2.5 rounded-lg border border-border/40">
                    &quot;{decision.reasoning}&quot;
                  </p>
                </div>

                {/* Detection Image if available */}
                {detection && (
                  <div className="rounded-xl border border-border/70 p-3 bg-background space-y-2">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 uppercase tracking-wider">
                      <Bug className="size-3.5" /> সম্পর্কিত ড্রোন ও ভিশন শনাক্তকরণ
                    </span>

                    <div className="flex items-center gap-3">
                      {detection.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={detection.imageUrl}
                          alt={detection.label}
                          className="size-16 rounded-xl object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="flex size-16 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <Bug className="size-6" />
                        </div>
                      )}

                      <div className="space-y-1 text-xs min-w-0">
                        <p className="font-bold text-foreground truncate">
                          {detection.label}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>আত্মবিশ্বাস:</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {Math.round(detection.confidence * 100)}%
                          </span>
                        </div>
                        {detection.lat && detection.lng && (
                          <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-2.5 text-rose-500" />
                            {detection.lat.toFixed(4)}, {detection.lng.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Override Controls */}
                <div className="rounded-xl border border-border/70 p-3.5 bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <SlidersHorizontal className="size-3.5 text-primary" />
                      কৃষক ম্যানুয়াল নিয়ন্ত্রণ (Farmer Override)
                    </span>
                    {decision.status === "OVERRIDDEN" && (
                      <span className="text-[11px] font-medium text-destructive flex items-center gap-1">
                        <CheckCheck className="size-3" /> বাতিল সম্পন্ন
                      </span>
                    )}
                  </div>

                  {decision.status === "OVERRIDDEN" ? (
                    <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground border border-border/50">
                      এই সিদ্ধান্তটি কৃষক কর্তৃক ম্যানুয়ালি বাতিল করা হয়েছে। কোনো অতিরিক্ত পদক্ষেপ কার্যকর নয়।
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        স্বয়ংক্রিয় এআই সিদ্ধান্তটি কৃষক হিসেবে আপনার পছন্দ অনুযায়ী বাতিল বা সময় পরিবর্তন করতে পারেন:
                      </p>

                      <div className="grid grid-cols-2 gap-2.5">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isOverriding}
                          onClick={() => setIsCancelConfirmOpen(true)}
                          className="rounded-xl h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                        >
                          <XCircle className="size-3.5" />
                          <span>পদক্ষেপ বাতিল করুন</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isOverriding}
                          onClick={openRescheduleModal}
                          className="rounded-xl h-9 text-xs font-semibold gap-1.5 hover:border-primary/50 cursor-pointer"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>সময় পরিবর্তন (Reschedule)</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground space-y-1">
                <Info className="size-5 mx-auto text-muted-foreground/60 mb-1" />
                <p className="font-semibold text-foreground">
                  কোনো সরাসরি স্বয়ংক্রিয় পদক্ষেপ যুক্ত নেই
                </p>
                <p>এটি একটি তথ্যমূলক সতর্কবার্তা (Informational Notice)।</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 1. Cancel Confirmation Dialog */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-1">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              সিদ্ধান্ত বাতিল নিশ্চিতকরণ (Confirm Cancel)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              আপনি কি নিশ্চিতভাবে{" "}
              <strong className="text-foreground">{decision?.action}</strong> সিদ্ধান্তটি (ID: #
              {decision?.id.slice(-6)}) বাতিল করতে চান?
              <br />
              <br />
              বাতিল করার সাথে সাথে সিদ্ধান্তটি <span className="font-mono font-semibold text-destructive">OVERRIDDEN</span> হিসেবে
              চিহ্নিত হবে এবং একটি অডিট লগ সংরক্ষিত হবে।
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={isOverriding}
              onClick={() => setIsCancelConfirmOpen(false)}
              className="rounded-xl"
            >
              ফিরে যান (Go Back)
            </Button>
            <Button
              variant="destructive"
              disabled={isOverriding}
              onClick={handleCancelDecision}
              className="rounded-xl gap-1.5"
            >
              {isOverriding && <Loader2 className="size-3.5 animate-spin" />}
              <span>হ্যাঁ, সিদ্ধান্ত বাতিল করুন</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
              <Calendar className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              সিদ্ধান্তের সময় পরিবর্তন (Reschedule Decision)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{decision?.action}</strong> পদক্ষেপটি কার্যকরের জন্য নতুন সময়
              নির্ধারণ করুন:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground mr-1">দ্রুত পছন্দ:</span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => applyPresetHours(2)}
                className="h-6 text-[10px] rounded-lg"
              >
                +২ ঘণ্টা
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => applyPresetHours(6)}
                className="h-6 text-[10px] rounded-lg"
              >
                +৬ ঘণ্টা
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => applyPresetHours(12)}
                className="h-6 text-[10px] rounded-lg"
              >
                +১২ ঘণ্টা
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => applyPresetHours(24)}
                className="h-6 text-[10px] rounded-lg"
              >
                +১ দিন (আগামীকাল)
              </Button>
            </div>

            {/* Datetime Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">
                নতুন তারিখ ও সময় (Date &amp; Time):
              </label>
              <Input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-10 rounded-xl font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={isOverriding}
              onClick={() => setIsRescheduleOpen(false)}
              className="rounded-xl"
            >
              বাতিল (Cancel)
            </Button>
            <Button
              variant="default"
              disabled={isOverriding || !rescheduleDate}
              onClick={handleRescheduleDecision}
              className="rounded-xl gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95"
            >
              {isOverriding && <Loader2 className="size-3.5 animate-spin" />}
              <span>সময় পুনঃনির্ধারণ নিশ্চিত করুন</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
