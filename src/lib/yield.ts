import { getCropBaseline } from "./yield-constants";

export interface EstimateYieldInput {
  crop: string;
  baselineTonsPerHa?: number;
  soilHealth: number;            // 0.0 to 1.0 (1 = optimal hydrology and pH, 0 = severe deficit)
  activeDiseasePenalty: number;  // 0.0 to 0.5 (e.g. late blight or leaf blast infection fraction)
  weatherStress: number;         // 0.0 to 0.3 (heat stress, excessive rainfall, or dry wind factor)
  plantedOn: Date | string;
  cropDurationDays: number;
  weatherDelayDays?: number;     // delay in crop cycle due to weather/spray delays
  untreatedBlightDays?: number;  // what-if parameter: untreated disease progression (0 to 14 days)
  asOfDate?: Date | string;      // reference date for pure deterministic calculations
}

export interface YieldFactor {
  name: string;
  impact: number;      // tons/ha delta (positive adds to yield, negative reduces yield)
  explanation: string;
}

export interface HarvestWindow {
  earliest: Date;
  optimal: Date;
  latest: Date;
}

export interface YieldEstimateResult {
  tonsPerHa: number;
  confidence: number;
  harvestWindow: HarvestWindow;
  factors: YieldFactor[];
  baselineTonsPerHa: number;
  deltaFromBaseline: number;
  percentFromBaseline: number;
  growthProgressPercent: number;
  daysElapsed: number;
}

/**
 * Pure function to estimate crop harvest yield, predictive confidence,
 * dynamic harvest window, and contributing agronomic factors.
 */
export function estimateYield(input: EstimateYieldInput): YieldEstimateResult {
  const cropConfig = getCropBaseline(input.crop);
  const baseline = input.baselineTonsPerHa ?? cropConfig.baselineTonsPerHa;

  // 1. Clamp input metrics to valid physical domains
  const soilHealth = Math.max(0, Math.min(1, input.soilHealth));
  const activeDisease = Math.max(0, Math.min(0.5, input.activeDiseasePenalty));
  const weatherStress = Math.max(0, Math.min(0.3, input.weatherStress));
  const weatherDelayDays = Math.max(0, input.weatherDelayDays || 0);
  const untreatedBlightDays = Math.max(0, input.untreatedBlightDays || 0);

  // 2. Growth stage and timing calculation
  const plantedTime = new Date(input.plantedOn).getTime();
  const refTime = input.asOfDate ? new Date(input.asOfDate).getTime() : Date.now();
  const daysElapsed = Math.max(0, Math.floor((refTime - plantedTime) / (1000 * 60 * 60 * 24)));
  const progressFraction = Math.min(1, Math.max(0, daysElapsed / input.cropDurationDays));
  const growthProgressPercent = Math.round(progressFraction * 100);

  // 3. Harvest Window Calculation
  // Base maturity = plantedOn + cropDurationDays
  const maturityTime = plantedTime + (input.cropDurationDays + weatherDelayDays) * (1000 * 60 * 60 * 24);
  const optimalHarvest = new Date(maturityTime);
  const earliestHarvest = new Date(maturityTime - 5 * 24 * 60 * 60 * 1000); // 5 days window before
  const latestHarvest = new Date(maturityTime + 7 * 24 * 60 * 60 * 1000);   // 7 days window after

  // 4. Predictive Confidence Calculation
  // At very early stages (first 15%), high biological and weather uncertainty exists.
  // Confidence scales as the crop approaches maturity, penalised by high stress.
  let baseConfidence = 0.58 + progressFraction * 0.36; // Range: 0.58 (day 0) to 0.94 (maturity)
  if (weatherStress > 0.15) baseConfidence -= 0.05;
  if (activeDisease > 0.2) baseConfidence -= 0.04;
  const confidence = Number(Math.max(0.5, Math.min(0.95, baseConfidence)).toFixed(2));

  // 5. Individual Factor Impacts (in tons/ha delta)
  const factors: YieldFactor[] = [];

  // Factor A: Baseline Potential
  factors.push({
    name: "মৌলিক ফলন সম্ভাবনা (Base Potential)",
    impact: Number(baseline.toFixed(2)),
    explanation: `${cropConfig.names.bn}-এর জন্য আদর্শ কৃষি-পরিবেশীয় নির্দেশক ফলন (${baseline} টন/হেক্টর)।`,
  });

  // Factor B: Soil Health Impact
  // Benchmark is 0.75. Above 0.75 gives up to +8% bonus; below 0.75 creates deficit.
  const soilDelta = Number(((soilHealth - 0.75) * 0.32 * baseline).toFixed(2));
  factors.push({
    name: "মাটির আর্দ্রতা ও স্বাস্থ্য (Soil Hydrology)",
    impact: soilDelta,
    explanation:
      soilHealth >= 0.75
        ? `পর্যাপ্ত মাটির আর্দ্রতা ও সন্তোষজনক পিএইচ মাত্রা (+${Math.abs(soilDelta)} টন/হে)।`
        : `মাটির আর্দ্রতার ঘাটতি ও পানির চাপ (${soilDelta} টন/হে)।`,
  });

  // Factor C: Active Disease Pressure
  let whatIfDiseaseDelta = 0;

  if (untreatedBlightDays > 0) {
    // Untreated disease progression scales per day
    const additionalLoss = Math.min(0.45, untreatedBlightDays * cropConfig.diseaseLossRatePerDay);
    whatIfDiseaseDelta = Number((-additionalLoss * baseline).toFixed(2));
  }

  const diseaseDelta = Number((-activeDisease * baseline).toFixed(2));
  factors.push({
    name: "রোগ ও বালাই চাপ (Disease Pressure)",
    impact: diseaseDelta,
    explanation:
      activeDisease > 0
        ? `শনাক্তকৃত ছত্রাক/রোগের কারণে আনুমানিক ${Math.round(activeDisease * 100)}% ফলন হ্রাস (${diseaseDelta} টন/হে)।`
        : "কোনো ক্ষতিকর রোগের উপস্থিতি নেই। ফসল সুরক্ষিত।",
  });

  // Factor C2: Untreated What-If Progression (if present)
  if (untreatedBlightDays > 0) {
    factors.push({
      name: `চিকিৎসাহীন ব্লাইট (${untreatedBlightDays} দিন)`,
      impact: whatIfDiseaseDelta,
      explanation: `ব্লাইট বালাই ${untreatedBlightDays} দিন চিকিৎসাবিহীন থাকলে অতিরিক্ত ক্ষয়ক্ষতি (${whatIfDiseaseDelta} টন/হে)।`,
    });
  }

  // Factor D: Weather & Climate Stress
  const weatherDelta = Number((-weatherStress * baseline).toFixed(2));
  factors.push({
    name: "আবহাওয়া ও জলবায়ু চাপ (Weather Stress)",
    impact: weatherDelta,
    explanation:
      weatherStress > 0
        ? `প্রতিকূল বৃষ্টিপাত বা তাপমাত্রার কারণে ${Math.round(weatherStress * 100)}% হ্রাস (${weatherDelta} টন/হে)।`
        : "অনুকূল আবহাওয়া ও পরিমিত তাপমাত্রা বজায় রয়েছে।",
  });

  // 6. Net Output Yield
  const rawYield = baseline + soilDelta + diseaseDelta + whatIfDiseaseDelta + weatherDelta;
  const tonsPerHa = Number(Math.max(0.5, rawYield).toFixed(2));
  const deltaFromBaseline = Number((tonsPerHa - baseline).toFixed(2));
  const percentFromBaseline = Number(((deltaFromBaseline / baseline) * 100).toFixed(1));

  return {
    tonsPerHa,
    confidence,
    harvestWindow: {
      earliest: earliestHarvest,
      optimal: optimalHarvest,
      latest: latestHarvest,
    },
    factors,
    baselineTonsPerHa: baseline,
    deltaFromBaseline,
    percentFromBaseline,
    growthProgressPercent,
    daysElapsed,
  };
}
