import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getDemoScenario } from "@/lib/data/settings";
import { SettingsClient } from "@/components/settings/settings-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo Control Panel & Settings | Agri-Koushol কৃষি কৌশল",
  description: "Configure agronomic demo scenarios, simulate autonomous drone scans, and monitor system connectivity.",
};

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-8 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

async function SettingsDataLoader() {
  const [demoScenario, approvalSetting] = await Promise.all([
    getDemoScenario(),
    prisma.appSetting.findUnique({
      where: { key: "human-approval-required" },
    }),
  ]);

  let initialApproval = false;
  if (approvalSetting) {
    if (typeof approvalSetting.value === "boolean") {
      initialApproval = approvalSetting.value;
    } else if (typeof approvalSetting.value === "object" && approvalSetting.value !== null) {
      initialApproval = Boolean((approvalSetting.value as Record<string, unknown>).enabled);
    }
  }

  return (
    <SettingsClient
      initialScenario={demoScenario.scenario}
      initialApproval={initialApproval}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsDataLoader />
    </Suspense>
  );
}
