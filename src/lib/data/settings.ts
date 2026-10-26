import "server-only";
import { prisma } from "@/lib/prisma";

export type DemoScenario = "NORMAL" | "HEAVY_RAIN_4H" | "HEATWAVE";

export interface DemoScenarioValue {
  scenario: DemoScenario;
  description?: string;
  updatedAt: string;
}

const DEFAULT_SCENARIO: DemoScenarioValue = {
  scenario: "NORMAL",
  description: "Standard farm telemetry and automated monitoring.",
  updatedAt: new Date().toISOString(),
};

/**
 * Retrieve the current demo scenario
 */
export async function getDemoScenario(): Promise<DemoScenarioValue> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "demo-scenario" },
  });

  if (!setting || !setting.value || typeof setting.value !== "object") {
    return DEFAULT_SCENARIO;
  }

  const val = setting.value as Record<string, unknown>;
  const scenario = (val.scenario as DemoScenario) || "NORMAL";

  return {
    scenario,
    description: (val.description as string) || undefined,
    updatedAt: (val.updatedAt as string) || setting.updatedAt.toISOString(),
  };
}

/**
 * Update the active demo scenario
 */
export async function setDemoScenario(scenario: DemoScenario): Promise<DemoScenarioValue> {
  const descriptions: Record<DemoScenario, string> = {
    NORMAL: "Standard farm telemetry with routine sensor cycles.",
    HEAVY_RAIN_4H: "Simulated approaching storm: Rain probability 75%, sprays locked.",
    HEATWAVE: "Simulated high temperature heatwave: canopy stress and rapid soil depletion.",
  };

  const payload: DemoScenarioValue = {
    scenario,
    description: descriptions[scenario] || "Custom scenario mode",
    updatedAt: new Date().toISOString(),
  };

  const updated = await prisma.appSetting.upsert({
    where: { key: "demo-scenario" },
    create: {
      key: "demo-scenario",
      value: payload as object,
    },
    update: {
      value: payload as object,
    },
  });

  return updated.value as unknown as DemoScenarioValue;
}
