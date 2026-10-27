"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plane,
  Camera,
  ScanSearch,
  CloudSun,
  Scale,
  BellRing,
  CheckCircle2,
  Loader2,
  Upload,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export interface FieldItem {
  id: string;
  name: string;
  crop: string;
}

export interface DroneScanResultData {
  detection?: {
    id: string;
    fieldId: string;
    label: string;
    confidence: number;
    imageUrl: string;
  };
  classification?: {
    label: string;
    confidence: number;
    symptoms: string[];
    staged: boolean;
  };
  pipeline?: {
    decision?: {
      action: string;
      reasoning: string;
      scheduledFor?: string | null;
    };
    alert?: {
      id: string;
      title: string;
      whatsappStatus?: string | null;
    };
    weather?: {
      rainProbability6h: number;
      tempMax: number;
    };
  };
}

interface DroneScanDialogProps {
  defaultFieldId?: string;
  trigger?: React.ReactNode;
}

const STAGED_LEAF_SAMPLES = [
  {
    key: "late_blight",
    title: "Late Blight",
    titleBn: "আলুর নাবি ধসা",
    badge: "Critical",
    badgeVariant: "destructive" as const,
    src: "/demo-leaves/late_blight.png",
    description: "Phytophthora infestans (High humidity risk)",
  },
  {
    key: "early_blight",
    title: "Early Blight",
    titleBn: "আগাম ধসা",
    badge: "High",
    badgeVariant: "secondary" as const,
    src: "/demo-leaves/early_blight.png",
    description: "Alternaria solani (Concentric target rings)",
  },
  {
    key: "leaf_spot",
    title: "Bacterial Spot",
    titleBn: "পাতার দাগ রোগ",
    badge: "Medium",
    badgeVariant: "outline" as const,
    src: "/demo-leaves/leaf_spot.png",
    description: "Xanthomonas campestris (Angular water-soaked spots)",
  },
  {
    key: "healthy",
    title: "Healthy Leaf",
    titleBn: "সুস্থ ফসল",
    badge: "Optimal",
    badgeVariant: "default" as const,
    src: "/demo-leaves/healthy.png",
    description: "Control sample (Lush chlorophyll, zero lesions)",
  },
];

type StepperStep = "IDLE" | "CAPTURED" | "DETECTED" | "WEATHER" | "DECIDED" | "NOTIFIED";

export function DroneScanDialog({ defaultFieldId, trigger }: DroneScanDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [fields, setFields] = React.useState<FieldItem[]>([]);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string>(defaultFieldId || "");
  const [selectedLeafKey, setSelectedLeafKey] = React.useState<string>("late_blight");
  const [customFile, setCustomFile] = React.useState<File | null>(null);

  const [step, setStep] = React.useState<StepperStep>("IDLE");
  const [isScanning, setIsScanning] = React.useState(false);
  const [resultData, setResultData] = React.useState<DroneScanResultData | null>(null);

  // Fetch fields if not loaded
  React.useEffect(() => {
    async function loadFields() {
      try {
        const res = await fetch("/api/fields");
        if (res.ok) {
          const json = await res.json();
          const items = json?.data?.fields || json?.fields || [];
          setFields(items);
          if (!selectedFieldId && items.length > 0) {
            setSelectedFieldId(defaultFieldId || items[0].id);
          }
        }
      } catch (err) {
        console.warn("Failed to load fields for drone dialog:", err);
      }
    }
    if (open) {
      loadFields();
    }
  }, [open, defaultFieldId, selectedFieldId]);

  const handleReset = () => {
    setStep("IDLE");
    setIsScanning(false);
    setResultData(null);
    setCustomFile(null);
  };

  const handleStartScan = async () => {
    if (!selectedFieldId) {
      toast.error("Please select a target field");
      return;
    }

    setIsScanning(true);
    setResultData(null);

    // Step 1: Image Captured
    setStep("CAPTURED");
    await new Promise((r) => setTimeout(r, 600));

    // Step 2: Disease Detected
    setStep("DETECTED");

    try {
      let res: Response;

      if (customFile) {
        const formData = new FormData();
        formData.append("fieldId", selectedFieldId);
        formData.append("image", customFile);
        res = await fetch("/api/detect", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldId: selectedFieldId,
            stagedImage: selectedLeafKey,
          }),
        });
      }

      // Step 3: Weather Checked
      await new Promise((r) => setTimeout(r, 600));
      setStep("WEATHER");

      // Step 4: AI Decided
      await new Promise((r) => setTimeout(r, 700));
      setStep("DECIDED");

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Detection failed");
      }

      // Step 5: Farmer Notified
      await new Promise((r) => setTimeout(r, 600));
      setStep("NOTIFIED");

      setResultData(data?.data || data);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("agri-alert-created"));
      }
      toast.success("Autonomous Drone Scan & Pipeline Completed!");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[DroneScanDialog] Scan failed:", err);
      toast.error(message || "Drone scan pipeline failed");
      setStep("IDLE");
    } finally {
      setIsScanning(false);
    }
  };

  const currentStepIndex = React.useMemo(() => {
    switch (step) {
      case "CAPTURED":
        return 1;
      case "DETECTED":
        return 2;
      case "WEATHER":
        return 3;
      case "DECIDED":
        return 4;
      case "NOTIFIED":
        return 5;
      default:
        return 0;
    }
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) handleReset(); }}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button
              size="sm"
              className="gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md cursor-pointer text-xs font-semibold"
            >
              <Plane className="size-3.5" />
              <span>ড্রোন স্ক্যান সিমুলেট (Simulate Drone)</span>
            </Button>
          )
        }
      />

      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto sm:rounded-2xl border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Plane className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                ড্রোন স্ক্যান ও AI পাইপলাইন (Crop Guardian)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Simulate autonomous drone leaf inspection, Gemini vision diagnosis &amp; response pipeline
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1. Field Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              লক্ষ্যযুক্ত মাঠ (Select Target Field)
            </Label>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              disabled={isScanning || step === "NOTIFIED"}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm font-medium outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.crop}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Leaf Sample Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                পাতার নমুনা নির্বাচন করুন (Staged Leaf Sample)
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">4 Staged Leaves</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {STAGED_LEAF_SAMPLES.map((sample) => {
                const isSelected = selectedLeafKey === sample.key && !customFile;
                return (
                  <button
                    key={sample.key}
                    type="button"
                    disabled={isScanning || step === "NOTIFIED"}
                    onClick={() => {
                      setSelectedLeafKey(sample.key);
                      setCustomFile(null);
                    }}
                    className={cn(
                      "flex flex-col text-left p-2 rounded-xl border transition-all cursor-pointer relative overflow-hidden group",
                      isSelected
                        ? "border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                        : "border-border bg-background hover:border-emerald-500/40 hover:bg-muted/30"
                    )}
                  >
                    <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-stone-900 mb-1.5 border border-border/50">
                      <Image
                        src={sample.src}
                        alt={sample.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <Badge
                        variant={sample.badgeVariant}
                        className="absolute top-1 right-1 text-[9px] px-1 py-0 h-4"
                      >
                        {sample.badge}
                      </Badge>
                    </div>

                    <div className="text-xs font-bold truncate text-foreground">
                      {sample.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {sample.titleBn}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom File Upload Option */}
            <div className="flex items-center gap-2 pt-1">
              <Label
                htmlFor="custom-leaf-upload"
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors",
                  customFile
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-dashed border-border hover:bg-muted text-muted-foreground"
                )}
              >
                <Upload className="size-3.5" />
                <span>{customFile ? `Uploaded: ${customFile.name}` : "বা নিজের ছবি আপলোড করুন (Upload File)"}</span>
              </Label>
              <input
                id="custom-leaf-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isScanning || step === "NOTIFIED"}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCustomFile(e.target.files[0]);
                  }
                }}
              />
              {customFile && (
                <button
                  type="button"
                  onClick={() => setCustomFile(null)}
                  className="text-[11px] text-destructive hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 3. Progress Stepper */}
          {step !== "IDLE" && (
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  {isScanning ? (
                    <Loader2 className="size-4 animate-spin text-emerald-600" />
                  ) : (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  )}
                  অটোনোমাস পাইপলাইন প্রগ্রেস (Pipeline Execution)
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Step {currentStepIndex} of 5
                </span>
              </div>

              {/* Visual Step Bar */}
              <div className="space-y-2">
                {[
                  { id: 1, key: "CAPTURED", icon: Camera, title: "Image captured", desc: "Drone camera snapshot & GPS tagged inside polygon" },
                  { id: 2, key: "DETECTED", icon: ScanSearch, title: "Disease detected", desc: "Gemini vision classification & symptom analysis" },
                  { id: 3, key: "WEATHER", icon: CloudSun, title: "Weather checked", desc: "OpenWeatherMap 6h rain probability & risk flags" },
                  { id: 4, key: "DECIDED", icon: Scale, title: "AI decided", desc: "Safety rules validated (Rain > 50% forbids spraying)" },
                  { id: 5, key: "NOTIFIED", icon: BellRing, title: "Farmer notified", desc: "Alert recorded, WhatsApp sent & yield recomputed" },
                ].map((s) => {
                  const isDone = currentStepIndex > s.id || step === "NOTIFIED";
                  const isCurrent = currentStepIndex === s.id && isScanning;
                  const Icon = s.icon;

                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "flex items-start gap-2.5 p-2 rounded-lg transition-all",
                        isCurrent
                          ? "bg-emerald-500/10 border border-emerald-500/30"
                          : isDone
                          ? "text-foreground opacity-90"
                          : "text-muted-foreground opacity-40"
                      )}
                    >
                      <div
                        className={cn(
                          "size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold",
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500 animate-pulse"
                            : "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {isDone ? <CheckCircle2 className="size-3.5" /> : s.id}
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <Icon className="size-3.5 shrink-0" />
                          <span>{s.title}</span>
                          {isCurrent && <span className="text-[10px] text-emerald-600 font-mono animate-pulse font-normal">(processing...)</span>}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight">
                          {s.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Results Card on Completion */}
          {resultData && step === "NOTIFIED" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="text-xs font-bold text-foreground">
                    সিদ্ধান্ত কার্যকর হয়েছে (Decision Executed)
                  </span>
                </div>
                <Badge
                  variant={
                    resultData.pipeline?.decision?.action === "DELAY_SPRAY"
                      ? "secondary"
                      : resultData.pipeline?.decision?.action === "SPRAY_NOW"
                      ? "destructive"
                      : "outline"
                  }
                  className="font-mono text-xs"
                >
                  {resultData.pipeline?.decision?.action || "PROCESSED"}
                </Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-xs space-y-1">
                <div className="font-semibold text-foreground">
                  {resultData.classification?.label}
                  <span className="text-muted-foreground font-normal ml-1">
                    ({Math.round((resultData.classification?.confidence ?? 0) * 100)}% confidence)
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {resultData.pipeline?.decision?.reasoning}
                </p>
                {resultData.pipeline?.weather && (
                  <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-2 border-t border-border/40 mt-1">
                    <span>🌦️ Rain 6h: <strong>{resultData.pipeline.weather.rainProbability6h}%</strong></span>
                    <span>🌡️ Temp: <strong>{resultData.pipeline.weather.tempMax}°C</strong></span>
                    <span>📡 WhatsApp: <strong>{resultData.pipeline?.alert?.whatsappStatus || "SENT"}</strong></span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs rounded-lg gap-1"
                  onClick={() => {
                    setOpen(false);
                    router.push("/alerts");
                  }}
                >
                  <span>সতর্কবার্তা দেখুন (View Alert)</span>
                  <ExternalLink className="size-3" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs rounded-lg gap-1"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/fields/${selectedFieldId}`);
                  }}
                >
                  <span>মাঠের বিস্তারিত (Field Detail)</span>
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          {step === "NOTIFIED" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="rounded-xl text-xs"
            >
              আরেকটি স্ক্যান করুন (New Scan)
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isScanning}
              className="rounded-xl text-xs"
            >
              বাতিল (Cancel)
            </Button>
          )}

          {step !== "NOTIFIED" && (
            <Button
              size="sm"
              onClick={handleStartScan}
              disabled={isScanning || !selectedFieldId}
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              {isScanning ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>স্ক্যান চলছে (Scanning...)...</span>
                </>
              ) : (
                <>
                  <Plane className="size-3.5" />
                  <span>ড্রোন স্ক্যান শুরু করুন (Start Drone Scan)</span>
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
