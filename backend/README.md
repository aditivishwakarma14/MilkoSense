# MilkoSense Backend Service

A high-performance Express.js + Node.js + Socket.IO microservice that forms the core intelligence layer of the **MilkoSense Smart AI Milk Quality Assessment System**.

## Features

1. **REST APIs**: Full suite of analytical and administrative endpoints.
2. **Real-time Engine**: Integrated Socket.IO server emitting live telemetry feeds and safety thresholds.
3. **AI Core**: Advanced weighted classification system evaluating and grading milk parameters.
4. **Data Polling Service**: Caches and normalizes real-time sensor updates from Firebase RTDB.
5. **Robust Local Storage Database**: Persists analysis results directly to a local, lightweight JSON structure (`reports/history.json`).

## Folder Structure

```
backend/
├── src/
│   ├── config/            # System-wide configuration options
│   ├── controllers/       # Route action handlers (sensors, analysis, reports, realtime)
│   ├── routes/            # REST endpoint routers
│   ├── services/          # Business intelligence services (aiService, firebaseService)
│   ├── middleware/        # Express custom middlewares (validation, security)
│   ├── models/            # Schema definition abstractions
│   ├── utils/             # Reusable server helpers
│   └── server.js          # Core Server Entrypoint
├── uploads/               # Temporary uploaded resource folder
├── reports/               # Persisted reports database (history.json)
├── package.json           # Backend dependency configurations
├── .env                   # Configuration variables
└── README.md              # Backend documentation
```

## REST API Documentation

### 1. Get Live Sensors Telemetry
- **Endpoint**: `/api/sensors`
- **Method**: `GET`
- **Description**: Returns the latest cached and normalized real-time readings from Firebase RTDB (with automated fallbacks).
- **Response**:
  ```json
  {
    "gas": 125,
    "ph": 6.55,
    "quality": "GOOD",
    "tds": 448,
    "temperature": 23.8,
    "turbidity": 14.9,
    "timestamp": "2026-05-27T13:10:00.000Z"
  }
  ```

### 2. Perform AI Milk Assessment
- **Endpoint**: `/api/analysis`
- **Method**: `POST`
- **Description**: Submits sensor parameters for comprehensive machine learning evaluations. Fallbacks to latest sensor values if body is empty.
- **Request Body**:
  ```json
  {
    "ph": 6.5,
    "temperature": 24,
    "turbidity": 15,
    "tds": 450,
    "gas": 120,
    "cattleType": "cow",
    "season": "summer"
  }
  ```
- **Response**:
  ```json
  {
    "qualityGrade": {
      "grade": "A",
      "score": 88,
      "label": "Excellent",
      "color": "#10b981",
      "confidence": 0.92,
      "parameters": { ... }
    },
    "score": 88,
    "confidence": 0.95,
    "adulterationRisk": { "detected": false, "risks": [], "riskLevel": "low", "riskScore": 10 },
    "spoilagePrediction": { "hours": 36, "days": 1.5, "riskLevel": "medium", "recommendation": "Store at <4°C" },
    "recommendations": [ ... ],
    "insights": [ ... ],
    "timestamp": "2026-05-27T13:10:05.000Z"
  }
  ```

### 3. Load/Save Historical Reports
- **Endpoint**: `/api/reports`
- **Method**: `GET` | `POST`
- **Description**: Loads the historical list of past milk testing runs, or submits a new test run to be archived.

### 4. Load Live Dashboard Summary
- **Endpoint**: `/api/realtime`
- **Method**: `GET`
- **Description**: Returns aggregate metrics (Total readings analyzed, Average quality grade score, Active critical alerts count, System Uptime).

## Realtime Socket.IO API

- **Event**: `sensorData`
  - **Type**: Emit (Server -> Client)
  - **Payload**: Normalised sensor telemetry feed emitted every 3 seconds.
- **Event**: `alert`
  - **Type**: Emit (Server -> Client)
  - **Payload**: Quality alert payload emitted if an evaluated score drops below a standard critical threshold (<60 score).

## Setup & Running

1. Navigate to the `backend/` directory.
2. Install standard dependencies:
   ```bash
   npm install
   ```
3. Boot up the server:
   - **Production Mode**: `npm start`
   - **Development Auto-Reload**: `npm run dev`
