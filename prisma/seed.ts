import { PrismaClient, DecisionAction, DecisionStatus, DecisionSource, AlertSeverity } from "@prisma/client";

const prisma = new PrismaClient();

// Mymensingh Agricultural Zone polygon coordinates [lat, lng]
const FIELD_POLYGONS = {
  fieldA: {
    type: "Polygon",
    coordinates: [
      [
        [24.7570, 90.4110],
        [24.7590, 90.4115],
        [24.7588, 90.4135],
        [24.7568, 90.4130],
        [24.7570, 90.4110],
      ],
    ],
  },
  fieldB: {
    type: "Polygon",
    coordinates: [
      [
        [24.7610, 90.4170],
        [24.7628, 90.4175],
        [24.7625, 90.4195],
        [24.7607, 90.4190],
        [24.7610, 90.4170],
      ],
    ],
  },
  fieldC: {
    type: "Polygon",
    coordinates: [
      [
        [24.7540, 90.4210],
        [24.7558, 90.4215],
        [24.7555, 90.4235],
        [24.7537, 90.4230],
        [24.7540, 90.4210],
      ],
    ],
  },
  fieldD: {
    type: "Polygon",
    coordinates: [
      [
        [24.7595, 90.4250],
        [24.7615, 90.4255],
        [24.7612, 90.4278],
        [24.7592, 90.4272],
        [24.7595, 90.4250],
      ],
    ],
  },
};

async function main() {
  console.log("🌱 Starting Agri-Koushol database seed...");

  // 1. Clean existing records in dependency order for idempotency
  await prisma.chatMessage.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.decision.deleteMany({});
  await prisma.detection.deleteMany({});
  await prisma.weatherLog.deleteMany({});
  await prisma.sensorReading.deleteMany({});
  await prisma.sensor.deleteMany({});
  await prisma.yieldPrediction.deleteMany({});
  await prisma.appSetting.deleteMany({});
  await prisma.field.deleteMany({});

  const now = new Date();

  // 2. Upsert AppSetting
  await prisma.appSetting.create({
    data: {
      key: "demo-scenario",
      value: {
        scenario: "NORMAL",
        description: "Default farm telemetry mode with simulated sensors",
        updatedAt: now.toISOString(),
      },
    },
  });

  // 3. Create 4 Fields
  // Field A: Visibly DRY (Soil moisture hovering around 31-34%, below threshold 35%)
  const fieldA = await prisma.field.create({
    data: {
      name: "Field A (Sector 1)",
      crop: "Boro Rice (BRRI dhan28)",
      growthStage: "Tillering / vegetative",
      plantedOn: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      cropDurationDays: 145,
      lat: 24.7570,
      lng: 90.4120,
      areaHa: 1.8,
      polygon: FIELD_POLYGONS.fieldA,
      soilMoistureThreshold: 35.0,
    },
  });

  // Field B: Potato (Healthy)
  const fieldB = await prisma.field.create({
    data: {
      name: "Field B (Sector 2)",
      crop: "Potato (Diamant)",
      growthStage: "Tuber Initiation",
      plantedOn: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      cropDurationDays: 90,
      lat: 24.7610,
      lng: 90.4180,
      areaHa: 1.2,
      polygon: FIELD_POLYGONS.fieldB,
      soilMoistureThreshold: 40.0,
    },
  });

  // Field C: Tomato (Healthy)
  const fieldC = await prisma.field.create({
    data: {
      name: "Field C (Sector 3)",
      crop: "Tomato (BARI Tomato-14)",
      growthStage: "Flowering & Fruit Setting",
      plantedOn: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      cropDurationDays: 105,
      lat: 24.7540,
      lng: 90.4220,
      areaHa: 0.9,
      polygon: FIELD_POLYGONS.fieldC,
      soilMoistureThreshold: 38.0,
    },
  });

  // Field D: Potato (Blight Demo Field)
  const fieldD = await prisma.field.create({
    data: {
      name: "Field D (Sector 4)",
      crop: "Potato (Cardinal)",
      growthStage: "Vegetative / Canopy Dense",
      plantedOn: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
      cropDurationDays: 90,
      lat: 24.7595,
      lng: 90.4260,
      areaHa: 1.5,
      polygon: FIELD_POLYGONS.fieldD,
      soilMoistureThreshold: 40.0,
    },
  });

  const fields = [fieldA, fieldB, fieldC, fieldD];

  // 4. Create Sensors for each field
  for (const f of fields) {
    const isDry = f.id === fieldA.id;
    await prisma.sensor.createMany({
      data: [
        {
          fieldId: f.id,
          type: "SOIL_MOISTURE",
          label: `${f.name} - Soil Moisture Probe (FDR)`,
          lastValue: isDry ? 32.4 : 48.6,
          lastSeen: now,
        },
        {
          fieldId: f.id,
          type: "TEMPERATURE",
          label: `${f.name} - Ambient Temp & Humidity Station`,
          lastValue: 28.5,
          lastSeen: now,
        },
        {
          fieldId: f.id,
          type: "SOIL_PH",
          label: `${f.name} - Soil pH / Electrical Conductivity Sensor`,
          lastValue: 6.5,
          lastSeen: now,
        },
      ],
    });
  }

  // 5. Generate 7 Days of Hourly SensorReadings per Field (168 readings * 4 = 672 rows)
  const readingsData: Array<{
    fieldId: string;
    soilMoisture: number;
    temperature: number;
    humidity: number;
    ph: number;
    recordedAt: Date;
  }> = [];

  const totalHours = 7 * 24; // 168 hours
  for (const f of fields) {
    const isFieldA = f.id === fieldA.id;

    for (let i = totalHours - 1; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
      const hour = timestamp.getHours();

      // Diurnal cycle:
      // Temp peaks at 14:00 (hour 14), lowest at 05:00 (hour 5)
      const hourAngle = ((hour - 5) / 24) * 2 * Math.PI;
      const diurnalFactor = (Math.sin(hourAngle - Math.PI / 2) + 1) / 2; // 0 at 5am, 1 at 2pm

      const noise = (Math.random() - 0.5) * 1.2;
      const temperature = Number((20.0 + diurnalFactor * 11.5 + noise).toFixed(1)); // ~20°C to ~31.5°C
      const humidity = Number((90.0 - diurnalFactor * 32.0 - noise * 2).toFixed(1)); // ~58% to ~90%
      const ph = Number((6.4 + (Math.random() - 0.5) * 0.3).toFixed(2)); // ~6.25 - ~6.55

      // Soil moisture:
      // Field A: visibly DRY, hovering just under its 35% threshold (31.0% to 34.4%)
      // Other fields: healthy (46.0% to 54.0%)
      let soilMoisture: number;
      if (isFieldA) {
        // Subtle drying trend over the 7 days down to ~32%
        const dryingDrift = ((totalHours - i) / totalHours) * 1.5;
        soilMoisture = Number((34.2 - dryingDrift + (Math.random() - 0.5) * 0.8).toFixed(1));
        // Clamp strictly under threshold 35
        if (soilMoisture >= 34.8) soilMoisture = 34.4;
        if (soilMoisture <= 30.5) soilMoisture = 31.2;
      } else {
        soilMoisture = Number((49.5 + (Math.random() - 0.5) * 3.5).toFixed(1));
      }

      readingsData.push({
        fieldId: f.id,
        soilMoisture,
        temperature,
        humidity,
        ph,
        recordedAt: timestamp,
      });
    }
  }

  // Batch insert readings
  await prisma.sensorReading.createMany({
    data: readingsData,
  });

  // 6. Create WeatherLog for each field
  await prisma.weatherLog.create({
    data: {
      fieldId: fieldA.id,
      rainProbability6h: 18.0,
      rainMm48h: 1.5,
      tempMax: 32.5,
      fetchedAt: now,
      forecast: {
        condition: "Partly Cloudy",
        windSpeedKmh: 9.5,
        uvIndex: 7,
        advisory: "Favorable conditions. Moisture deficit needs irrigation.",
      },
    },
  });

  await prisma.weatherLog.create({
    data: {
      fieldId: fieldB.id,
      rainProbability6h: 68.0, // High rain probability triggers rain guard!
      rainMm48h: 24.5,
      tempMax: 29.0,
      fetchedAt: now,
      forecast: {
        condition: "Thunderstorm Warning",
        windSpeedKmh: 18.2,
        uvIndex: 4,
        advisory: "Rain probability > 50% in next 6h. Chemical spraying prohibited.",
      },
    },
  });

  await prisma.weatherLog.create({
    data: {
      fieldId: fieldC.id,
      rainProbability6h: 12.0,
      rainMm48h: 0.8,
      tempMax: 31.8,
      fetchedAt: now,
      forecast: {
        condition: "Sunny / Clear",
        windSpeedKmh: 8.0,
        uvIndex: 8,
        advisory: "Normal vegetative conditions.",
      },
    },
  });

  await prisma.weatherLog.create({
    data: {
      fieldId: fieldD.id,
      rainProbability6h: 22.0,
      rainMm48h: 3.5,
      tempMax: 30.0,
      fetchedAt: now,
      forecast: {
        condition: "Humid / Overcast",
        windSpeedKmh: 11.0,
        uvIndex: 5,
        advisory: "High relative humidity accelerates fungal sporulation.",
      },
    },
  });

  // 7. Create Detections (Field D Blight demo)
  await prisma.detection.create({
    data: {
      fieldId: fieldD.id,
      label: "Late Blight (Phytophthora infestans)",
      confidence: 0.84,
      imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910a451?auto=format&fit=crop&w=800&q=80",
      lat: 24.7602,
      lng: 90.4262,
      status: "FLAGGED",
    },
  });

  // 8. Create 2 Past Decisions (one overridden)
  // Decision 1 (Field B): DELAY_SPRAY because rain prob > 50% (COMPLETED)
  const decision1 = await prisma.decision.create({
    data: {
      fieldId: fieldB.id,
      action: DecisionAction.DELAY_SPRAY,
      status: DecisionStatus.COMPLETED,
      source: DecisionSource.N8N,
      reasoning: "Safety Rule Enforced: 6-hour rain forecast probability is 68% (>50% limit). Postponed preventive fungicide spray to prevent chemical runoff into watershed.",
      scheduledFor: new Date(Date.now() + 14 * 60 * 60 * 1000), // Rescheduled for tomorrow morning
      simulated: true,
    },
  });

  // Decision 2 (Field A): IRRIGATE overridden by farmer (OVERRIDDEN)
  const decision2 = await prisma.decision.create({
    data: {
      fieldId: fieldA.id,
      action: DecisionAction.IRRIGATE,
      status: DecisionStatus.OVERRIDDEN,
      source: DecisionSource.N8N,
      reasoning: "Soil moisture dropped to 32.1%, hovering beneath the 35% threshold. Automated pump command was scheduled, but farmer overrode to clear primary inlet canal before activating valve.",
      scheduledFor: new Date(Date.now() - 3 * 60 * 60 * 1000),
      simulated: true,
    },
  });

  // 9. Create 3 Past Alerts
  // Alert 1 (Field A): Dry soil alert linked to Decision 2
  await prisma.alert.create({
    data: {
      fieldId: fieldA.id,
      decisionId: decision2.id,
      severity: AlertSeverity.HIGH,
      title: "মাটির আর্দ্রতা সংকট (Low Soil Moisture Alert)",
      message: "Field A soil moisture has fallen to 32.4%, below the 35.0% threshold. Automated irrigation recommended.",
      messageBn: "প্লট এ-তে মাটির আর্দ্রতা ৩২.৪%-এ নেমে এসেছে, যা ৩৫.০% থ্রেশহোল্ডের নিচে। দ্রুত সেচ দেওয়া প্রয়োজন।",
      source: "SOIL_GUARD",
      read: false,
      whatsappStatus: "DELIVERED",
    },
  });

  // Alert 2 (Field D): Blight warning linked to Detection
  await prisma.alert.create({
    data: {
      fieldId: fieldD.id,
      severity: AlertSeverity.CRITICAL,
      title: "আলুর নাবী ধসা রোগ শনাক্ত (Late Blight Warning)",
      message: "Drone multispectral scan detected early Late Blight lesions with 84% confidence in Sector 4. Immediate field inspection recommended.",
      messageBn: "সেক্টর ৪-এ ড্রোন স্ক্যানে ৮৪% আত্মবিশ্বাসে আলুর নাবী ধসা রোগ শনাক্ত হয়েছে। তাৎক্ষণিক সরেজমিনে পরিদর্শন করুন।",
      source: "DRONE_VISION",
      read: false,
      whatsappStatus: "SENT",
    },
  });

  // Alert 3 (Field B): Rain guard spray delay linked to Decision 1
  await prisma.alert.create({
    data: {
      fieldId: fieldB.id,
      decisionId: decision1.id,
      severity: AlertSeverity.MEDIUM,
      title: "বৃষ্টির কারণে স্প্রে স্থগিত (Rain Guard Delay)",
      message: "Prophylactic spray delayed. OpenWeather forecast indicates 68% precipitation probability in next 6 hours. AI safety guard active.",
      messageBn: "আগামী ৬ ঘণ্টায় ৬৮% বৃষ্টির পূর্বাভাসের কারণে স্প্রে স্বয়ংক্রিয়ভাবে স্থগিত রাখা হয়েছে। কৃত্রিম বুদ্ধিমত্তা সুরক্ষা নীতি কার্যকর।",
      source: "RAIN_GUARD",
      read: true,
      whatsappStatus: "DELIVERED",
    },
  });

  // 10. YieldPrediction per Field
  await prisma.yieldPrediction.createMany({
    data: [
      {
        fieldId: fieldA.id,
        tonsPerHa: 5.85,
        harvestDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
        confidence: 0.88,
        factors: {
          vegetativeHealth: "Good",
          waterStress: "Moderate",
          fertilizerEfficiency: "High",
          projectedVariance: "+12%",
        },
      },
      {
        fieldId: fieldB.id,
        tonsPerHa: 24.8,
        harvestDate: new Date(Date.now() + 58 * 24 * 60 * 60 * 1000),
        confidence: 0.92,
        factors: {
          canopyDevelopment: "Optimal",
          soilMoistureStatus: "Well-balanced",
          pestPressure: "Negligible",
          projectedVariance: "+18%",
        },
      },
      {
        fieldId: fieldC.id,
        tonsPerHa: 38.4,
        harvestDate: new Date(Date.now() + 77 * 24 * 60 * 60 * 1000),
        confidence: 0.86,
        factors: {
          floweringRate: "High",
          pollinationIndex: 0.89,
          irrigationEfficiency: "Optimal",
          projectedVariance: "+15%",
        },
      },
      {
        fieldId: fieldD.id,
        tonsPerHa: 19.4, // Lower yield prediction due to blight demo impact
        harvestDate: new Date(Date.now() + 52 * 24 * 60 * 60 * 1000),
        confidence: 0.78,
        factors: {
          blightRiskDeduction: "-18%",
          foliarHealthIndex: 0.71,
          recommendation: "Targeted bio-fungicide treatment required to preserve yield",
        },
      },
    ],
  });

  // 11. Print row counts
  const [
    fieldsCount,
    sensorsCount,
    readingsCount,
    weatherLogsCount,
    detectionsCount,
    decisionsCount,
    alertsCount,
    yieldsCount,
    settingsCount,
  ] = await Promise.all([
    prisma.field.count(),
    prisma.sensor.count(),
    prisma.sensorReading.count(),
    prisma.weatherLog.count(),
    prisma.detection.count(),
    prisma.decision.count(),
    prisma.alert.count(),
    prisma.yieldPrediction.count(),
    prisma.appSetting.count(),
  ]);

  console.log("==========================================");
  console.log(" Agri-Koushol Database Seed Summary ");
  console.log("==========================================");
  console.log(`🌾 Fields:           ${fieldsCount}`);
  console.log(`📡 Sensors:          ${sensorsCount}`);
  console.log(`📈 Sensor Readings:  ${readingsCount}`);
  console.log(`🌦️ Weather Logs:     ${weatherLogsCount}`);
  console.log(`🔍 Detections:       ${detectionsCount}`);
  console.log(`⚖️ Decisions:        ${decisionsCount}`);
  console.log(`🚨 Alerts:           ${alertsCount}`);
  console.log(`📊 YieldPredictions: ${yieldsCount}`);
  console.log(`⚙️ App Settings:     ${settingsCount}`);
  console.log("==========================================");
  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
