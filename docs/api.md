# Agri-Koushol Server Data Layer & REST API Documentation

This document describes the server data layer (`src/lib/data/*.ts`) and all HTTP REST API endpoints (`/api/*`) for the **Agri-Koushol** autonomous AI farm platform.

---

## 1. Authentication & Security Conventions

- **Internal Ingest & Automation Endpoints**: Require the `x-api-key` header with the secret value matching `INGEST_API_KEY` (e.g. used by n8n automation and IoT telemetry bridges).
- **Zod Validation**: Every request payload is strictly validated against a Zod schema.
- **Consistent Error Shape**: All API errors conform to the standard structure:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | AI_SAFETY_VIOLATION | INTERNAL_ERROR",
      "message": "Human-readable explanation of error.",
      "details": []
    }
  }
  ```

---

## 2. KPI Metrics Definitions

- **`waterSavedLiters`**: Sum of all paused, cancelled, or overridden irrigation decisions multiplied by the regional standard irrigation depth constant of **`250,000 Liters / hectare`** (equivalent to ~25mm flood/furrow irrigation pass in Bangladesh).
  $$\text{Water Saved (L)} = \sum_{\text{paused/skipped}} \left(\text{area}_{\text{ha}} \times 250{,}000\right)$$
- **`chemicalsSavedPercent`**: Precision spot spraying efficiency metric based on a targeted **`15 meter`** drone spray radius ($A_{\text{spot}} = \pi \times 15^2 \approx 706.86\text{ m}^2$) versus traditional 100% blanket field coverage ($A_{\text{field}} = \text{area}_{\text{ha}} \times 10{,}000\text{ m}^2$):
  $$\text{Chemicals Saved (\%)} = \left(1 - \frac{\text{Treated Area}_{\text{m}^2}}{\text{Total Field Area}_{\text{m}^2}}\right) \times 100\%$$
- **`activeAlerts`**: Count of all unread alerts (`read: false`).
- **`predictedYield`**: Average projected crop yield in tons/hectare across all cultivated fields.

---

## 3. Endpoints & Curl Examples

### 3.1 `GET /api/fields`
Retrieves all cultivated fields along with their latest sensor reading, weather log, and yield predictions.

**Curl Example:**
```bash
curl -s http://localhost:3000/api/fields
```

**Response (HTTP 200 OK):**
```json
{
  "fields": [
    {
      "id": "cmvpap35100019ep849ii6yh8",
      "name": "Field A (Sector 1)",
      "crop": "Boro Rice (BRRI dhan28)",
      "growthStage": "Tillering / vegetative",
      "areaHa": 1.8,
      "soilMoistureThreshold": 35,
      "latestReading": {
        "soilMoisture": 32.6,
        "temperature": 30.6,
        "humidity": 60.3,
        "ph": 6.47
      },
      "latestWeatherLog": {
        "rainProbability6h": 18,
        "rainMm48h": 1.5,
        "tempMax": 32.5
      },
      "yieldPrediction": {
        "tonsPerHa": 5.85,
        "confidence": 0.88
      }
    }
  ],
  "count": 4
}
```

---

### 3.2 `GET /api/fields/[id]`
Retrieves full details for a single field, including active decisions, sensors, and telemetry.

**Curl Example:**
```bash
curl -s http://localhost:3000/api/fields/cmvpap35100019ep849ii6yh8
```

**Response (HTTP 200 OK):**
```json
{
  "field": {
    "id": "cmvpap35100019ep849ii6yh8",
    "name": "Field A (Sector 1)",
    "crop": "Boro Rice (BRRI dhan28)",
    "growthStage": "Tillering / vegetative",
    "lat": 24.757,
    "lng": 90.412,
    "areaHa": 1.8,
    "soilMoistureThreshold": 35,
    "sensors": [
      {
        "id": "cmvpap64r00059ep8k8w5fwzw",
        "type": "SOIL_MOISTURE",
        "label": "Field A (Sector 1) - Soil Moisture Probe (FDR)",
        "lastValue": 32.4
      }
    ],
    "activeDecisions": []
  }
}
```

---

### 3.3 `GET /api/sensors`
Lists hardware sensors or retrieves historical readings when queried with `?fieldId=...&hours=...`.

**Curl Example (List Sensors):**
```bash
curl -s http://localhost:3000/api/sensors
```

**Curl Example (Filtered Readings):**
```bash
curl -s "http://localhost:3000/api/sensors?fieldId=cmvpap35100019ep849ii6yh8&hours=3"
```

**Response (HTTP 200 OK):**
```json
{
  "fieldId": "cmvpap35100019ep849ii6yh8",
  "hours": 3,
  "readings": [
    {
      "id": "cmvpap92a00529ep8zofhed6v",
      "soilMoisture": 33.1,
      "temperature": 31,
      "humidity": 59.1,
      "ph": 6.39,
      "recordedAt": "2026-10-26T11:31:31.214Z"
    }
  ],
  "count": 3
}
```

---

### 3.4 `POST /api/sensors` (Telemetry Ingestion)
Ingests telemetry data from IoT probes. Updates `SensorReading` table and latest sensor cache. Requires `x-api-key`.

**Curl Example:**
```bash
curl -s -X POST http://localhost:3000/api/sensors \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-ingest-key" \
  -d '{
    "fieldId": "cmvpap35100019ep849ii6yh8",
    "soilMoisture": 32.1,
    "temperature": 29.5,
    "humidity": 62.0,
    "ph": 6.45
  }'
```

**Response (HTTP 201 Created):**
```json
{
  "success": true,
  "reading": {
    "id": "cmvpbg86600019en2kdm0ehfn",
    "fieldId": "cmvpap35100019ep849ii6yh8",
    "soilMoisture": 32.1,
    "temperature": 29.5,
    "humidity": 62,
    "ph": 6.45,
    "recordedAt": "2026-10-26T13:52:29.567Z"
  }
}
```

---

### 3.5 `GET /api/alerts`
Retrieves farm safety alerts. Supports `?unreadOnly=true`.

**Curl Example:**
```bash
curl -s "http://localhost:3000/api/alerts?unreadOnly=true"
```

**Response (HTTP 200 OK):**
```json
{
  "alerts": [
    {
      "id": "cmvpapciv00jm9ep8m0l04bej",
      "fieldId": "cmvpap4sa00049ep8h1tm3ow6",
      "severity": "CRITICAL",
      "title": "আলুর নাবী ধসা রোগ শনাক্ত (Late Blight Warning)",
      "message": "Drone multispectral scan detected early Late Blight lesions with 84% confidence in Sector 4. Immediate field inspection recommended.",
      "read": false,
      "source": "DRONE_VISION"
    }
  ],
  "count": 1
}
```

---

### 3.6 `PATCH /api/alerts/[id]`
Marks an alert as read.

**Curl Example:**
```bash
curl -s -X PATCH http://localhost:3000/api/alerts/cmvpapc8800jk9ep8buaghfo4 \
  -H "Content-Type: application/json" \
  -d '{"read": true}'
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "alert": {
    "id": "cmvpapc8800jk9ep8buaghfo4",
    "read": true,
    "title": "মাটির আর্দ্রতা সংকট (Low Soil Moisture Alert)"
  }
}
```

---

### 3.7 `POST /api/decisions` (Used by n8n)
Creates an autonomous `Decision` and linked `Alert`. Enforces AI Safety Rules in code:
1. Rejects `SPRAY_NOW` when 6h rain probability > 50%.
2. Forces `INSPECT` when detection confidence < 0.60.

**Curl Example (Valid Decision):**
```bash
curl -s -X POST http://localhost:3000/api/decisions \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-ingest-key" \
  -d '{
    "fieldId": "cmvpap35100019ep849ii6yh8",
    "action": "IRRIGATE",
    "reasoning": "Soil moisture has dropped below 35% threshold to 32.1%. Activating canal pump.",
    "severity": "HIGH",
    "farmerMessage": "Automated irrigation initiated for Field A (Sector 1). Expected run time: 45 mins.",
    "farmerMessageBn": "প্লট এ-তে স্বয়ংক্রিয় সেচ চালু করা হয়েছে। সম্ভাব্য সময়কাল: ৪৫ মিনিট।",
    "source": "N8N"
  }'
```

**Response (HTTP 201 Created):**
```json
{
  "success": true,
  "decision": {
    "id": "cmvpbhdos00039en24d32ia59",
    "fieldId": "cmvpap35100019ep849ii6yh8",
    "action": "IRRIGATE",
    "status": "PENDING",
    "source": "N8N"
  },
  "alert": {
    "id": "cmvpbhext00059en21y7ph03y",
    "severity": "HIGH",
    "title": "Decision: IRRIGATE (Field A (Sector 1))",
    "message": "Automated irrigation initiated for Field A (Sector 1). Expected run time: 45 mins."
  }
}
```

**Curl Example (AI Safety Rule Violation Test):**
Attempting `SPRAY_NOW` on Field B where rain probability is 68%:
```bash
curl -s -i -X POST http://localhost:3000/api/decisions \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-ingest-key" \
  -d '{
    "fieldId": "cmvpap3m800029ep8wkukjed2",
    "action": "SPRAY_NOW",
    "reasoning": "Foliar fungicide routine application",
    "severity": "HIGH",
    "farmerMessage": "Executing spray on Field B",
    "source": "N8N"
  }'
```

**Response (HTTP 422 Unprocessable Entity):**
```json
{
  "error": {
    "code": "AI_SAFETY_VIOLATION",
    "message": "AI Safety Rule Violation: Cannot execute SPRAY_NOW when 6-hour rain probability (68%) exceeds the 50% safety guard threshold."
  }
}
```

---

### 3.8 `POST /api/override`
Allows the farmer to manually cancel or reschedule an autonomous decision, creating an audit alert.

**Curl Example:**
```bash
curl -s -X POST http://localhost:3000/api/override \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "cmvpbhdos00039en24d32ia59",
    "action": "cancel"
  }'
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "decision": {
    "id": "cmvpbhdos00039en24d32ia59",
    "status": "OVERRIDDEN",
    "reasoning": "Soil moisture has dropped below 35% threshold to 32.1%. Activating canal pump. [Manually cancelled by farmer]"
  },
  "alert": {
    "id": "cmvpbhncc00079en206bvo5o0",
    "title": "ম্যানুয়াল বাতিল: IRRIGATE",
    "source": "MANUAL",
    "severity": "MEDIUM"
  }
}
```

---

### 3.9 `GET & PUT /api/settings/demo-scenario`
Reads or alters the platform's simulated demo scenario (`NORMAL | HEAVY_RAIN_4H | HEATWAVE`).

**Curl Example (GET):**
```bash
curl -s http://localhost:3000/api/settings/demo-scenario
```

**Response (HTTP 200 OK):**
```json
{
  "demoScenario": {
    "scenario": "NORMAL",
    "description": "Default farm telemetry mode with simulated sensors"
  }
}
```

**Curl Example (PUT):**
```bash
curl -s -X PUT http://localhost:3000/api/settings/demo-scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "HEAVY_RAIN_4H"}'
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "demoScenario": {
    "scenario": "HEAVY_RAIN_4H",
    "description": "Simulated approaching storm: Rain probability 75%, sprays locked."
  }
}
```

---

### 3.10 `GET /api/kpis`
Computes precision farming metrics including water savings, chemical reductions, active alerts, and yield forecasts.

**Curl Example:**
```bash
curl -s http://localhost:3000/api/kpis
```

**Response (HTTP 200 OK):**
```json
{
  "kpis": {
    "waterSavedLiters": 900000,
    "chemicalsSavedPercent": 95.3,
    "activeAlerts": 3,
    "predictedYield": {
      "averageTonsPerHa": 22.1,
      "totalFieldsCount": 4
    },
    "metricsDocumentation": {
      "waterSavedFormula": "Sum(paused_or_skipped_irrigation_ha * 250000 L/ha)",
      "chemicalSavingsFormula": "(1 - (treated_spots * 707 m² / field_area_m²)) * 100%"
    }
  }
}
```
