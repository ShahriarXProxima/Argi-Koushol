import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export interface HourlyForecastItem {
  time: string; // ISO string
  temp: number;
  rainProbability: number; // 0 - 100%
  rainMm: number;
  condition: string;
  humidity?: number;
  windSpeedKmh?: number;
}

export interface WeatherForecastSummary {
  fieldId: string;
  rainProbability6h: number; // 0 - 100%
  rainMm48h: number;
  tempMax: number;
  hourly: HourlyForecastItem[];
  riskBadges: string[];
  source: "openweathermap" | "demo_scenario";
  stale: boolean;
  fetchedAt: Date | string;
  condition?: string;
  advisory?: string;
}

interface OpenWeatherMapListItem {
  dt: number;
  dt_txt?: string;
  main?: {
    temp?: number;
    humidity?: number;
  };
  rain?: {
    "3h"?: number;
  };
  pop?: number;
  weather?: Array<{
    main?: string;
    description?: string;
  }>;
  wind?: {
    speed?: number;
  };
}

interface OpenWeatherMapResponse {
  list?: OpenWeatherMapListItem[];
}

/**
 * Calculates risk badges based on 48h weather summary & thresholds.
 */
export function calculateRiskBadges(summary: {
  rainProbability6h: number;
  rainMm48h: number;
  tempMax: number;
  soilMoisture?: number | null;
  soilMoistureThreshold?: number | null;
}): string[] {
  const badges: string[] = [];

  if (summary.rainProbability6h > 50 || summary.rainMm48h >= 20) {
    badges.push("Heavy rain");
  }

  if (summary.tempMax >= 35) {
    badges.push("Heat stress");
  }

  if (summary.tempMax <= 5) {
    badges.push("Frost");
  }

  if (
    summary.soilMoisture !== undefined &&
    summary.soilMoisture !== null &&
    summary.soilMoistureThreshold !== undefined &&
    summary.soilMoistureThreshold !== null
  ) {
    if (
      summary.soilMoisture < summary.soilMoistureThreshold &&
      summary.rainMm48h < 5
    ) {
      badges.push("Drought");
    }
  } else if (summary.rainMm48h < 2 && summary.tempMax > 30) {
    badges.push("Drought");
  }

  if (badges.length === 0) {
    badges.push("Clear");
  }

  return badges;
}

/**
 * Generates synthetic forecast for the HEAVY_RAIN_4H scenario:
 * Heavy rain (probability 0.9, 20+ mm) starts in about 4 hours.
 */
function generateHeavyRain4hForecast(
  fieldId: string,
  now: Date
): WeatherForecastSummary {
  const hourly: HourlyForecastItem[] = [];
  let rainMm48h = 0;
  const tempMax = 29.0;

  // Generate 16 intervals of 3 hours (48h total)
  for (let i = 0; i < 16; i++) {
    const time = new Date(now.getTime() + i * 3 * 3600 * 1000).toISOString();
    const hoursFromNow = i * 3;

    if (hoursFromNow < 3) {
      // Hours 0-3: Clear to partly cloudy before storm
      hourly.push({
        time,
        temp: 29.0,
        rainProbability: 25,
        rainMm: 0.0,
        condition: "Partly Cloudy",
        humidity: 68,
        windSpeedKmh: 12.0,
      });
    } else if (hoursFromNow >= 3 && hoursFromNow < 15) {
      // Hours ~4-15: Torrential rain / monsoon storm
      const rain = i === 1 ? 8.5 : i === 2 ? 11.2 : 5.8;
      rainMm48h += rain;
      hourly.push({
        time,
        temp: 24.5,
        rainProbability: 95,
        rainMm: rain,
        condition: "Thunderstorm with Heavy Rain",
        humidity: 94,
        windSpeedKmh: 28.5,
      });
    } else {
      // Remaining hours: Scattered showers & cloudy
      const rain = i % 2 === 0 ? 0.8 : 0.0;
      rainMm48h += rain;
      hourly.push({
        time,
        temp: 26.0,
        rainProbability: 40,
        rainMm: rain,
        condition: "Overcast / Light Showers",
        humidity: 82,
        windSpeedKmh: 14.0,
      });
    }
  }

  rainMm48h = Math.round(rainMm48h * 10) / 10;
  const rainProbability6h = 90.0; // 0.9 probability in next 6h

  return {
    fieldId,
    rainProbability6h,
    rainMm48h,
    tempMax,
    hourly,
    riskBadges: ["Heavy rain"],
    source: "demo_scenario",
    stale: false,
    fetchedAt: now,
    condition: "Thunderstorm Warning",
    advisory:
      "Demo Scenario Active: Heavy rain (90% prob, 25+ mm) starting in ~4 hours. Chemical spraying prohibited by AI Safety Rules.",
  };
}

/**
 * Generates synthetic forecast for HEATWAVE scenario:
 * 40C+ temperatures, zero precipitation, severe evapotranspiration.
 */
function generateHeatwaveForecast(
  fieldId: string,
  now: Date
): WeatherForecastSummary {
  const hourly: HourlyForecastItem[] = [];
  const tempMax = 41.8;
  const rainProbability6h = 5.0;
  const rainMm48h = 0.0;

  for (let i = 0; i < 16; i++) {
    const time = new Date(now.getTime() + i * 3 * 3600 * 1000).toISOString();
    const cycle = Math.sin((i / 8) * Math.PI); // peak midday
    const temp = Math.round((34.0 + cycle * 7.8) * 10) / 10;

    hourly.push({
      time,
      temp,
      rainProbability: 5,
      rainMm: 0.0,
      condition: "Extreme Heat / Clear Sky",
      humidity: 32,
      windSpeedKmh: 16.0,
    });
  }

  return {
    fieldId,
    rainProbability6h,
    rainMm48h,
    tempMax,
    hourly,
    riskBadges: ["Heat stress"],
    source: "demo_scenario",
    stale: false,
    fetchedAt: now,
    condition: "Heatwave Alert",
    advisory:
      "Demo Scenario Active: Extreme heat (>40°C). Accelerated soil moisture depletion. Prioritize irrigation schedule.",
  };
}

/**
 * Fetches OpenWeatherMap 5-day / 3-hour forecast for given coordinates.
 */
async function fetchOpenWeatherMapForecast(
  lat: number,
  lng: number,
  apiKey: string
): Promise<OpenWeatherMapResponse> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) {
    throw new Error(
      `OpenWeatherMap request failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Processes OpenWeatherMap raw response into WeatherForecastSummary
 */
function parseOpenWeatherMapResponse(
  fieldId: string,
  data: OpenWeatherMapResponse,
  soilMoistureThreshold?: number | null
): WeatherForecastSummary {
  const list = Array.isArray(data.list) ? data.list : [];
  // Next 16 intervals of 3 hours = 48 hours
  const items48h = list.slice(0, 16);
  // Next 2 intervals = 6 hours
  const items6h = list.slice(0, 2);

  let rainMm48h = 0;
  let tempMax = -999;
  let maxPop6h = 0;

  for (const item of items6h) {
    const pop = typeof item.pop === "number" ? item.pop : 0;
    if (pop > maxPop6h) maxPop6h = pop;
  }

  const hourly: HourlyForecastItem[] = items48h.map((item: OpenWeatherMapListItem) => {
    const temp = item.main?.temp ?? 25.0;
    if (temp > tempMax) tempMax = temp;

    const rain3h = item.rain?.["3h"] ?? 0;
    rainMm48h += rain3h;

    const pop = item.pop ?? 0;
    const weatherDesc = item.weather?.[0]?.main ?? "Clear";

    return {
      time: item.dt_txt || new Date(item.dt * 1000).toISOString(),
      temp: Math.round(temp * 10) / 10,
      rainProbability: Math.round(pop * 100),
      rainMm: Math.round(rain3h * 10) / 10,
      condition: weatherDesc,
      humidity: item.main?.humidity,
      windSpeedKmh: item.wind?.speed
        ? Math.round(item.wind.speed * 3.6 * 10) / 10
        : undefined,
    };
  });

  if (tempMax === -999) tempMax = 28.0;
  rainMm48h = Math.round(rainMm48h * 10) / 10;
  tempMax = Math.round(tempMax * 10) / 10;
  const rainProbability6h = Math.round(maxPop6h * 100);

  const riskBadges = calculateRiskBadges({
    rainProbability6h,
    rainMm48h,
    tempMax,
    soilMoistureThreshold,
  });

  const condition = items48h[0]?.weather?.[0]?.description ?? "Clear sky";

  return {
    fieldId,
    rainProbability6h,
    rainMm48h,
    tempMax,
    hourly,
    riskBadges,
    source: "openweathermap",
    stale: false,
    fetchedAt: new Date(),
    condition: condition.charAt(0).toUpperCase() + condition.slice(1),
    advisory:
      rainProbability6h > 50
        ? "Rain probability > 50% in next 6h. Chemical spraying prohibited."
        : "Favorable conditions for routine crop management.",
  };
}

/**
 * Primary function to get or fetch weather for a field.
 * - Reads field coordinates
 * - Honours AppSetting demo scenario (HEAVY_RAIN_4H, HEATWAVE, NORMAL)
 * - Fetches OpenWeatherMap if NORMAL and API key available
 * - Stores a WeatherLog row in the database
 * - If API fails or key missing, falls back to latest WeatherLog with stale: true
 */
export async function getOrFetchWeather(
  fieldId: string
): Promise<WeatherForecastSummary> {
  const field = await prisma.field.findUnique({
    where: { id: fieldId },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      soilMoistureThreshold: true,
    },
  });

  if (!field) {
    throw new Error(`Field not found with ID: ${fieldId}`);
  }

  // 1. Check Demo Scenario AppSetting
  let demoScenario = "NORMAL";
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "demo-scenario" },
    });
    if (setting?.value) {
      if (typeof setting.value === "string") {
        demoScenario = setting.value;
      } else if (
        typeof setting.value === "object" &&
        setting.value !== null &&
        "scenario" in setting.value &&
        typeof (setting.value as { scenario?: unknown }).scenario === "string"
      ) {
        demoScenario = (setting.value as { scenario: string }).scenario;
      }
    }
  } catch (err) {
    console.warn("Could not read demo-scenario setting:", err);
  }

  const now = new Date();

  // 2. Handle Demo Scenarios
  if (demoScenario === "HEAVY_RAIN_4H") {
    const summary = generateHeavyRain4hForecast(field.id, now);
    try {
      await prisma.weatherLog.create({
        data: {
          fieldId: field.id,
          rainProbability6h: summary.rainProbability6h,
          rainMm48h: summary.rainMm48h,
          tempMax: summary.tempMax,
          fetchedAt: now,
          forecast: {
            source: summary.source,
            scenario: "HEAVY_RAIN_4H",
            condition: summary.condition,
            advisory: summary.advisory,
            riskBadges: summary.riskBadges,
            hourly: summary.hourly,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (saveErr) {
      console.error("Failed to store WeatherLog for HEAVY_RAIN_4H:", saveErr);
    }
    return summary;
  }

  if (demoScenario === "HEATWAVE") {
    const summary = generateHeatwaveForecast(field.id, now);
    try {
      await prisma.weatherLog.create({
        data: {
          fieldId: field.id,
          rainProbability6h: summary.rainProbability6h,
          rainMm48h: summary.rainMm48h,
          tempMax: summary.tempMax,
          fetchedAt: now,
          forecast: {
            source: summary.source,
            scenario: "HEATWAVE",
            condition: summary.condition,
            advisory: summary.advisory,
            riskBadges: summary.riskBadges,
            hourly: summary.hourly,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (saveErr) {
      console.error("Failed to store WeatherLog for HEATWAVE:", saveErr);
    }
    return summary;
  }

  // 3. Scenario NORMAL: Try OpenWeatherMap API
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
  if (apiKey && apiKey.length > 5) {
    try {
      const rawData = await fetchOpenWeatherMapForecast(
        field.lat,
        field.lng,
        apiKey
      );
      const summary = parseOpenWeatherMapResponse(
        field.id,
        rawData,
        field.soilMoistureThreshold
      );

      // Store new WeatherLog
      try {
        await prisma.weatherLog.create({
          data: {
            fieldId: field.id,
            rainProbability6h: summary.rainProbability6h,
            rainMm48h: summary.rainMm48h,
            tempMax: summary.tempMax,
            fetchedAt: now,
            forecast: {
              source: summary.source,
              condition: summary.condition,
              advisory: summary.advisory,
              riskBadges: summary.riskBadges,
              hourly: summary.hourly,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      } catch (saveErr) {
        console.error("Failed to store WeatherLog from OpenWeatherMap:", saveErr);
      }

      return summary;
    } catch (fetchErr) {
      console.warn(
        "OpenWeatherMap fetch failed, falling back to latest WeatherLog:",
        fetchErr
      );
    }
  }

  // 4. Fallback: Retrieve latest WeatherLog for this field and set stale: true
  const latestLog = await prisma.weatherLog.findFirst({
    where: { fieldId: field.id },
    orderBy: { fetchedAt: "desc" },
  });

  if (latestLog) {
    const forecastObj =
      typeof latestLog.forecast === "object" && latestLog.forecast !== null
        ? (latestLog.forecast as Record<string, unknown>)
        : {};
    const riskBadges =
      Array.isArray(forecastObj.riskBadges) &&
      forecastObj.riskBadges.every((b) => typeof b === "string")
        ? (forecastObj.riskBadges as string[])
        : calculateRiskBadges({
            rainProbability6h: latestLog.rainProbability6h,
            rainMm48h: latestLog.rainMm48h,
            tempMax: latestLog.tempMax,
            soilMoistureThreshold: field.soilMoistureThreshold,
          });

    return {
      fieldId: field.id,
      rainProbability6h: latestLog.rainProbability6h,
      rainMm48h: latestLog.rainMm48h,
      tempMax: latestLog.tempMax,
      hourly: Array.isArray(forecastObj.hourly)
        ? (forecastObj.hourly as HourlyForecastItem[])
        : [],
      riskBadges,
      source: forecastObj.source === "demo_scenario" ? "demo_scenario" : "openweathermap",
      stale: true,
      fetchedAt: latestLog.fetchedAt,
      condition:
        typeof forecastObj.condition === "string"
          ? forecastObj.condition
          : "Partly Cloudy",
      advisory:
        typeof forecastObj.advisory === "string"
          ? forecastObj.advisory
          : "Showing cached weather data (offline fallback).",
    };
  }

  // 5. Ultimate fallback if field has no records at all
  return {
    fieldId: field.id,
    rainProbability6h: 20.0,
    rainMm48h: 1.5,
    tempMax: 30.0,
    hourly: [],
    riskBadges: ["Clear"],
    source: "openweathermap",
    stale: true,
    fetchedAt: now,
    condition: "Sunny / Clear",
    advisory: "Default simulated reading (no cached weather log available).",
  };
}
