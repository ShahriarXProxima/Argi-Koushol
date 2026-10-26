"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Bot,
  UserCheck,
  MessageSquareText,
  Clock,
  SlidersHorizontal,
  Calendar,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface DecisionItem {
  id: string;
  fieldId: string;
  action: "SPRAY_NOW" | "DELAY_SPRAY" | "IRRIGATE" | "PAUSE_IRRIGATION" | "INSPECT" | "NO_ACTION";
  reasoning: string;
  scheduledFor?: Date | string | null;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "OVERRIDDEN" | "CANCELLED";
  source: "N8N" | "CHATBOT" | "MANUAL";
  simulated: boolean;
  createdAt: Date | string;
}

interface DecisionTimelineProps {
  decisions: DecisionItem[];
  fieldName: string;
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
      return <Badge variant="outline" className="font-bold text-xs">স্বাভাবিক (NO_ACTION)</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 text-[10px] gap-1">
          <CheckCircle2 className="size-3" />
          সম্পন্ন (COMPLETED)
        </Badge>
      );
    case "OVERRIDDEN":
      return (
        <Badge variant="outline" className="border-purple-500/40 text-purple-600 text-[10px] gap-1">
          <UserCheck className="size-3" />
          ম্যানুয়াল ওভাররাইড
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px] gap-1">
          <XCircle className="size-3" />
          বাতিল (CANCELLED)
        </Badge>
      );
    case "SCHEDULED":
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px] gap-1">
          <Clock className="size-3" />
          নির্ধারিত (SCHEDULED)
        </Badge>
      );
    case "PENDING":
    default:
      return (
        <Badge variant="outline" className="border-primary/40 text-primary text-[10px] gap-1">
          <Clock className="size-3 animate-spin" />
          অপেক্ষমান (PENDING)
        </Badge>
      );
  }
}

function getSourceIcon(source: string) {
  switch (source) {
    case "N8N":
      return { icon: Bot, label: "n8n অটোনোমাস ইঞ্জিন" };
    case "CHATBOT":
      return { icon: MessageSquareText, label: "শস্য-প্রহরী AI সহকারী" };
    case "MANUAL":
      return { icon: UserCheck, label: "কৃষক নিজে (Manual)" };
    default:
      return { icon: SlidersHorizontal, label: "সিস্টেম রুল" };
  }
}

export function DecisionTimeline({ decisions, fieldName }: DecisionTimelineProps) {
  const router = useRouter();
  const [selectedDecision, setSelectedDecision] = React.useState<DecisionItem | null>(null);
  const [overrideAction, setOverrideAction] = React.useState<"cancel" | "reschedule">("cancel");
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleOpenOverride = (decision: DecisionItem) => {
    setSelectedDecision(decision);
    setOverrideAction("cancel");
    // Default to tomorrow 9am for reschedule
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setRescheduleDate(tomorrow.toISOString().slice(0, 16));
  };

  const handleConfirmOverride = async () => {
    if (!selectedDecision) return;
    setLoading(true);

    try {
      const res = await fetch("/api/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionId: selectedDecision.id,
          action: overrideAction,
          newTime: overrideAction === "reschedule" ? new Date(rescheduleDate).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to override decision.");

      toast.success(
        overrideAction === "cancel"
          ? "সিদ্ধান্তটি সফলভাবে বাতিল করা হয়েছে।"
          : "সিদ্ধান্তের নতুন সময় সফলভাবে নির্ধারণ করা হয়েছে।"
      );

      setSelectedDecision(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ওভাররাইড সম্পন্ন করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">সিদ্ধান্ত টাইমলাইন (Decision Timeline)</CardTitle>
              <CardDescription className="text-xs">
                স্বয়ংক্রিয় কৃষি সিদ্ধান্ত ও কৃষক ম্যানুয়াল ওভাররাইড রেকর্ড (নতুন থেকে পুরাতন)
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {decisions.length}টি সিদ্ধান্ত
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {decisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 text-muted-foreground">
            <CheckCircle2 className="size-10 text-emerald-500/80" />
            <p className="text-sm font-semibold text-foreground">কোনো অপেক্ষমান বা অতীত সিদ্ধান্ত নেই</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              এই মাঠের জন্য সকল শর্ত সন্তোষজনক। নতুন সেন্সর রিডিং অনুযায়ী স্বয়ংক্রিয় সিদ্ধান্ত যোগ হবে।
            </p>
          </div>
        ) : (
          decisions.map((dec) => {
            const { icon: SourceIcon, label: sourceLabel } = getSourceIcon(dec.source);
            const isCompletedOrOverridden = dec.status === "COMPLETED" || dec.status === "OVERRIDDEN" || dec.status === "CANCELLED";

            return (
              <div
                key={dec.id}
                className="rounded-xl border border-border/80 bg-card p-4 space-y-3 hover:border-primary/40 transition-colors"
              >
                {/* Decision Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(dec.action)}
                    {getStatusBadge(dec.status)}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <SourceIcon className="size-3 text-primary" />
                      <span>{sourceLabel}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground font-mono">
                    {new Date(dec.createdAt).toLocaleString("bn-BD", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>

                {/* Reasoning text */}
                <div className="rounded-lg bg-secondary/30 p-3 text-xs text-foreground/90 leading-relaxed border border-border/40">
                  <span className="font-semibold text-foreground">যুক্তি ও প্রেক্ষাপট: </span>
                  {dec.reasoning}
                </div>

                {/* Scheduled time or actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    {dec.scheduledFor ? (
                      <>
                        <Clock className="size-3.5 text-amber-600" />
                        <span>
                          নির্ধারিত সময়:{" "}
                          <strong className="text-foreground">
                            {new Date(dec.scheduledFor).toLocaleString("bn-BD", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </strong>
                        </span>
                      </>
                    ) : (
                      <span>স্বয়ংক্রিয় সিদ্ধান্ত (ID: #{dec.id.slice(-6)})</span>
                    )}
                  </div>

                  {/* Override Button */}
                  <Button
                    size="xs"
                    variant={isCompletedOrOverridden ? "ghost" : "outline"}
                    disabled={isCompletedOrOverridden}
                    onClick={() => handleOpenOverride(dec)}
                    className="h-7 text-xs rounded-lg gap-1 border-border/80 text-foreground hover:bg-secondary self-start sm:self-auto cursor-pointer"
                  >
                    <SlidersHorizontal className="size-3 text-primary" />
                    <span>{isCompletedOrOverridden ? "ওভাররাইড বন্ধ" : "বাতিল বা পরিবর্তন করুন"}</span>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      {/* Override Dialog Modal */}
      {selectedDecision ? (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedDecision(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="size-4.5 text-amber-600" />
                <span>সিদ্ধান্ত পরিবর্তন (Override Decision)</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {fieldName} এর #{selectedDecision.id.slice(-6)} সিদ্ধান্তের জন্য কৃষক ম্যানুয়াল অ্যাকশন নির্বাচন করুন।
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl bg-secondary/40 p-3 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <span>বর্তমান অ্যাকশন:</span>
                  {getActionBadge(selectedDecision.action)}
                </div>
                <p className="text-muted-foreground line-clamp-2">{selectedDecision.reasoning}</p>
              </div>

              {/* Action options */}
              <div className="space-y-2">
                <label className="font-semibold text-foreground">পদক্ষেপ নির্বাচন করুন:</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={overrideAction === "cancel" ? "default" : "outline"}
                    onClick={() => setOverrideAction("cancel")}
                    className={`h-9 text-xs rounded-xl justify-center font-semibold ${
                      overrideAction === "cancel" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
                    }`}
                  >
                    সম্পূর্ণ বাতিল (Cancel)
                  </Button>
                  <Button
                    type="button"
                    variant={overrideAction === "reschedule" ? "default" : "outline"}
                    onClick={() => setOverrideAction("reschedule")}
                    className={`h-9 text-xs rounded-xl justify-center font-semibold ${
                      overrideAction === "reschedule" ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    সময় পুনর্নির্ধারণ (Reschedule)
                  </Button>
                </div>
              </div>

              {/* Date time picker if reschedule */}
              {overrideAction === "reschedule" ? (
                <div className="space-y-1.5 pt-1">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" />
                    <span>নতুন সময় নির্ধারণ করুন:</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDecision(null)}
                className="rounded-xl text-xs"
              >
                ফিরে যান
              </Button>
              <Button
                size="sm"
                disabled={loading}
                onClick={handleConfirmOverride}
                className="rounded-xl text-xs bg-primary text-primary-foreground font-semibold"
              >
                {loading ? "সংরক্ষণ হচ্ছে..." : "নিশ্চিত করুন"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}
