/**
 * Documented baseline agricultural crop yield projections in Bangladesh.
 *
 * NOTE: These baseline metrics are approximate agronomic projections based on
 * published research from the Bangladesh Agricultural Research Institute (BARI)
 * and Bangladesh Rice Research Institute (BRRI), NOT direct physical field measurements.
 * Actual harvest yields may vary due to microclimate conditions, seed purity, and field management.
 */

export interface CropYieldBaseline {
  cropKey: string;
  names: {
    en: string;
    bn: string;
  };
  baselineTonsPerHa: number; // Documented standard average yield (metric tons per hectare)
  cropDurationDays: number;  // Standard growth cycle duration (days from sowing/transplanting)
  bighaYieldMaunds: number;  // Traditional Bangladesh equivalent (approx maunds/bigha, 1 maund ~ 40 kg)
  soilMoistureOptimal: number; // Target volumetric soil moisture (%)
  blightVulnerable: boolean; // Susceptible to Phytophthora infestans (Late Blight)
  diseaseLossRatePerDay: number; // Untreated yield degradation rate per day (% loss per day)
}

export const CROP_YIELD_BASELINES: Record<string, CropYieldBaseline> = {
  rice: {
    cropKey: "rice",
    names: {
      en: "Boro Rice (BRRI dhan28 / High Yield)",
      bn: "বোরো ধান (ব্রি ধান২৮)",
    },
    baselineTonsPerHa: 6.2, // ~6.2 metric tons/ha for irrigated high-yielding Boro
    cropDurationDays: 145,
    bighaYieldMaunds: 20.8,
    soilMoistureOptimal: 35.0,
    blightVulnerable: false,
    diseaseLossRatePerDay: 0.015, // 1.5% daily loss for untreated blast/sheath blight
  },
  potato: {
    cropKey: "potato",
    names: {
      en: "Potato (Diamant / Commercial Variety)",
      bn: "গোল আলু (ডায়মন্ড জাত)",
    },
    baselineTonsPerHa: 28.0, // ~28.0 metric tons/ha commercial average in Munshiganj/Bogra
    cropDurationDays: 90,
    bighaYieldMaunds: 93.8,
    soilMoistureOptimal: 40.0,
    blightVulnerable: true,
    diseaseLossRatePerDay: 0.045, // 4.5% daily loss if Late Blight is left untreated
  },
  tomato: {
    cropKey: "tomato",
    names: {
      en: "Winter Tomato (BARI Tomato / Hybrid)",
      bn: "শীতকালীন টমেটো (বারি টমেটো)",
    },
    baselineTonsPerHa: 42.0, // ~42.0 metric tons/ha for intensive winter horticulture
    cropDurationDays: 110,
    bighaYieldMaunds: 140.7,
    soilMoistureOptimal: 38.0,
    blightVulnerable: true,
    diseaseLossRatePerDay: 0.038, // 3.8% daily loss for early/late blight
  },
};

/**
 * Normalizes any crop string (e.g. "Boro Rice (BRRI dhan28)", "Potato (Diamant)") to a baseline configuration
 */
export function getCropBaseline(cropName: string): CropYieldBaseline {
  const normalized = (cropName || "").toLowerCase();
  if (normalized.includes("potato") || normalized.includes("আলু")) {
    return CROP_YIELD_BASELINES.potato;
  }
  if (normalized.includes("tomato") || normalized.includes("টমেটো")) {
    return CROP_YIELD_BASELINES.tomato;
  }
  // Default to rice
  return CROP_YIELD_BASELINES.rice;
}
