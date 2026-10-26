import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { estimateYield } from "../src/lib/yield";

describe("YieldMax - estimateYield() Agronomic Engine", () => {
  const FIXED_NOW = new Date("2026-10-26T12:00:00Z");

  // Case 1: Healthy Plot (Optimal conditions)
  test("Case 1: Healthy condition yields above baseline with high confidence", () => {
    const plantedOn = new Date(FIXED_NOW.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days in
    const result = estimateYield({
      crop: "Potato (Diamant)",
      baselineTonsPerHa: 28.0,
      soilHealth: 1.0,           // Optimal FDR moisture & pH
      activeDiseasePenalty: 0.0, // Zero disease
      weatherStress: 0.0,        // Zero weather stress
      plantedOn,
      cropDurationDays: 90,
      asOfDate: FIXED_NOW,
    });

    assert.ok(result.tonsPerHa > 28.0, `Expected tons/ha > 28.0, got ${result.tonsPerHa}`);
    assert.ok(result.confidence >= 0.80, `Expected confidence >= 0.80, got ${result.confidence}`);
    assert.strictEqual(result.daysElapsed, 60);
    assert.strictEqual(result.growthProgressPercent, 67);

    // Verify positive soil factor
    const soilFactor = result.factors.find((f) => f.name.includes("মাটির"));
    assert.ok(soilFactor && soilFactor.impact > 0, "Soil factor should provide a positive bonus");

    // Verify disease penalty is 0
    const diseaseFactor = result.factors.find((f) => f.name.includes("রোগ"));
    assert.strictEqual(diseaseFactor?.impact, 0);
  });

  // Case 2: Blight Active (Severe Late Blight Infection)
  test("Case 2: Active blight infection applies disease penalty reducing yield", () => {
    const plantedOn = new Date(FIXED_NOW.getTime() - 40 * 24 * 60 * 60 * 1000);
    const result = estimateYield({
      crop: "Potato (Diamant)",
      baselineTonsPerHa: 28.0,
      soilHealth: 0.8,
      activeDiseasePenalty: 0.35, // 35% blight infection loss
      weatherStress: 0.05,
      plantedOn,
      cropDurationDays: 90,
      asOfDate: FIXED_NOW,
    });

    const expectedDiseaseLoss = -Number((0.35 * 28.0).toFixed(2)); // -9.8 tons
    const diseaseFactor = result.factors.find((f) => f.name.includes("রোগ"));
    assert.strictEqual(diseaseFactor?.impact, expectedDiseaseLoss);
    assert.ok(result.tonsPerHa < 20.0, `Expected significant yield drop < 20.0, got ${result.tonsPerHa}`);
    assert.ok(result.percentFromBaseline < -25, "Expected percent loss greater than 25%");
  });

  // Case 3: Drought Stress (Low Soil Moisture Deficit)
  test("Case 3: Drought stress with depleted soil moisture reduces yield below baseline", () => {
    const plantedOn = new Date(FIXED_NOW.getTime() - 50 * 24 * 60 * 60 * 1000);
    const result = estimateYield({
      crop: "Boro Rice (BRRI dhan28)",
      baselineTonsPerHa: 6.2,
      soilHealth: 0.25,          // Severe dry soil deficit
      activeDiseasePenalty: 0.0,
      weatherStress: 0.15,       // Elevated heat/drought stress
      plantedOn,
      cropDurationDays: 145,
      asOfDate: FIXED_NOW,
    });

    const soilFactor = result.factors.find((f) => f.name.includes("মাটির"));
    assert.ok(soilFactor && soilFactor.impact < 0, "Soil impact must be negative under drought");
    assert.ok(result.tonsPerHa < 6.2, `Expected yield below baseline 6.2, got ${result.tonsPerHa}`);
  });

  // Case 4: Heavy Rain Delay (Weather Delay Shifts Harvest Window)
  test("Case 4: Heavy rain delays shift the optimal harvest window into the future", () => {
    const plantedOn = new Date("2026-08-01T00:00:00Z");
    const cropDurationDays = 90;
    const weatherDelayDays = 14; // 2 weeks delay

    const result = estimateYield({
      crop: "Potato",
      baselineTonsPerHa: 28.0,
      soilHealth: 0.75,
      activeDiseasePenalty: 0.0,
      weatherStress: 0.2,
      plantedOn,
      cropDurationDays,
      weatherDelayDays,
      asOfDate: FIXED_NOW,
    });

    // Without delay: Aug 1 + 90 days = Oct 30, 2026
    // With 14 days delay: Oct 30 + 14 days = Nov 13, 2026
    const expectedOptimalTime = new Date(plantedOn.getTime() + (90 + 14) * 24 * 60 * 60 * 1000).getTime();
    assert.strictEqual(
      result.harvestWindow.optimal.getTime(),
      expectedOptimalTime,
      "Optimal harvest date must be shifted by weatherDelayDays"
    );

    assert.ok(
      result.harvestWindow.earliest.getTime() < result.harvestWindow.optimal.getTime(),
      "Earliest window must precede optimal date"
    );
    assert.ok(
      result.harvestWindow.latest.getTime() > result.harvestWindow.optimal.getTime(),
      "Latest window must follow optimal date"
    );
  });

  // Case 5: Very Early Stage (High Uncertainty & Low Confidence)
  test("Case 5: Very early growth stage exhibits lower predictive confidence", () => {
    const plantedOn = new Date(FIXED_NOW.getTime() - 4 * 24 * 60 * 60 * 1000); // Only 4 days old!
    const result = estimateYield({
      crop: "Boro Rice",
      baselineTonsPerHa: 6.2,
      soilHealth: 0.9,
      activeDiseasePenalty: 0.0,
      weatherStress: 0.0,
      plantedOn,
      cropDurationDays: 145,
      asOfDate: FIXED_NOW,
    });

    assert.strictEqual(result.daysElapsed, 4);
    assert.ok(result.growthProgressPercent <= 5, "Progress percent should be <= 5%");
    assert.ok(
      result.confidence <= 0.65,
      `Early stage confidence should be <= 0.65 reflecting germination uncertainty, got ${result.confidence}`
    );
  });

  // What-If Untreated Blight Slider Test
  test("What-If Untreated Slider: Increases yield deduction proportionally", () => {
    const plantedOn = new Date(FIXED_NOW.getTime() - 45 * 24 * 60 * 60 * 1000);
    const untreated0 = estimateYield({
      crop: "Potato",
      soilHealth: 0.8,
      activeDiseasePenalty: 0.1,
      weatherStress: 0.0,
      plantedOn,
      cropDurationDays: 90,
      untreatedBlightDays: 0,
      asOfDate: FIXED_NOW,
    });

    const untreated7 = estimateYield({
      crop: "Potato",
      soilHealth: 0.8,
      activeDiseasePenalty: 0.1,
      weatherStress: 0.0,
      plantedOn,
      cropDurationDays: 90,
      untreatedBlightDays: 7,
      asOfDate: FIXED_NOW,
    });

    assert.ok(
      untreated7.tonsPerHa < untreated0.tonsPerHa,
      `7 days untreated (${untreated7.tonsPerHa}) must be lower than 0 days (${untreated0.tonsPerHa})`
    );

    const whatIfFactor = untreated7.factors.find((f) => f.name.includes("চিকিৎসাহীন"));
    assert.ok(whatIfFactor && whatIfFactor.impact < 0, "Untreated factor must be present with negative impact");
  });
});
