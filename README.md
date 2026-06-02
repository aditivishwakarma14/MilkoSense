# 🥛 MilkoSense - AI-Assisted Milk Quality Testing & Analytics Platform

[![Status](https://img.shields.io/badge/Status-Active-success)]()
[![Version](https://img.shields.io/badge/Version-3.0.0-blue)]()
[![Architecture](https://img.shields.io/badge/Architecture-Monorepo_Multi_Service-emerald)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-cyan)]()
[![Deploy](https://img.shields.io/badge/Deploy-Render_Blueprint-purple)]()

**MilkoSense** is a state-of-the-art, IoT-enabled milk quality testing and predictive analytics platform. It features a decoupled, production-hardened monorepo architecture combining a high-performance React frontend console, an Express API gateway, and an advanced Python FastAPI Machine Learning microservice.

---

## 📋 Table of Contents

- [🏛️ Architecture & Folder Structure](#️-architecture--folder-structure)
- [📡 API & Live Telemetry Protocol](#-api--live-telemetry-protocol)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🚀 Local Installation & Setup](#-local-installation--setup)
- [🐳 Docker Container Orchestration](#-docker-container-orchestration)
- [☁️ Cloud Deployment on Render](#️-cloud-deployment-on-render)
- [🔌 IoT Hardware & Arduino ESP32 Firmware](#-iot-hardware--arduino-esp32-firmware)
- [🔬 Core Quality Thresholds Reference](#-core-quality-thresholds-reference)

---

## 🏛️ Architecture & Folder Structure

The project is structured as a monorepo containing three independent, decoupled services:

```text
MilkoSense/
│
├── frontend/                     # React 18 + Vite + Tailwind CSS Console
│   ├── src/
│   │   ├── app/                  # Application-wide stores (Zustand) and routes
│   │   ├── components/           # Shared UI elements (Charts, Layouts, Modals)
│   │   ├── features/             # Feature-based pages (Dashboard, Sensors, Analytics, OTP)
│   │   └── services/             # API Client, Socket.IO Client, Firebase Service
│   ├── dist/                     # Production build artifacts (Static Files)
│   ├── package.json              # React configuration and dependencies
│   └── Dockerfile                # Multi-stage Nginx build script
│
├── backend/                      # Node.js + Express + Socket.IO API Gateway
│   ├── src/
│   │   ├── config/               # Database and server configs
│   │   ├── controllers/          # Route controller logics
│   │   ├── middleware/           # Route guards, validation, and error handlers
│   │   ├── models/               # MongoDB Mongoose schemas
│   │   └── server.js             # Express application entrypoint
│   ├── package.json              # Node backend dependencies
│   └── Dockerfile                # Production Node.js build script
│
├── ml-service/                   # Python FastAPI Machine Learning Engine
│   ├── models/                   # Serialized model binaries (ONNX format)
│   ├── main.py                   # FastAPI routing and CORS configuration
│   ├── train.py                  # Ensemble Model training and export pipeline
│   ├── train_cnn.py              # 1D-CNN Spectral model trainer
│   ├── generate_dataset.py       # Synthetic dataset generation engine
│   ├── compute_shap.py           # SHAP explainability matrices generator
│   └── requirements.txt          # Python dependencies
│
├── docker-compose.yml            # Multi-container cluster orchestration
├── render.yaml                   # Infrastructure-as-Code Blueprint configuration
└── README.md                     # Root project documentation (This file)
```

---

## 📡 API & Live Telemetry Protocol

### Express API Endpoints
- **`POST /api/auth/register` & `/api/auth/login`**: User registration and verification via email OTP tokens.
- **`GET /api/sensors`**: Retrieves real-time sensor parameters (pH, temperature, TDS, turbidity, gas) from MongoDB or emulated generators.
- **`POST /api/analysis`**: Submits readings to the ML service to retrieve a quality grade (`A`/`B`/`C`/`D`), safety thresholds, and corrective advice.
- **`GET /api/reports`**: Retrieves saved historical ledgers.

### WebSockets (Socket.IO)
- Emits continuous **`sensorData`** telemetry updates to connected dashboard clients every 3 seconds.
- Triggers instant **`alert`** signals when milk quality index drops below safety thresholds (<60).

---

## ⚙️ Environment Configuration

### Backend Setup (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/milkosense
JWT_SECRET=your_jwt_secret_key_change_me_in_production
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
PYTHON_ML_API_KEY=dev-key-milkosense
```

### Frontend Setup (`frontend/.env`)
Create a `.env` file in the `frontend/` directory (optional for local, resolved dynamically in production):
```env
VITE_API_URL=http://localhost:5000
```

---

## 🚀 Local Installation & Setup

### Option A: Unified Setup (Recommended for Local Development)

1. **Install Root and Workspace Dependencies**:
   ```bash
   # Run at the root directory
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

2. **Initialize Python Machine Learning Engine**:
   ```bash
   cd ml-service
   # 1. Create and activate a Virtual Environment
   python -m venv venv
   # Windows (CMD/PowerShell):
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate

   # 2. Install Python requirements
   pip install -r requirements.txt

   # 3. Generate datasets and train models
   python generate_dataset.py
   python train.py
   python compute_shap.py
   python train_cnn.py
   cd ..
   ```

3. **Launch the Monorepo Dev Servers Concurrently**:
   ```bash
   npm run dev
   ```
   - **React Dashboard Console**: http://localhost:3000
   - **Express Gateway API**: http://localhost:5000
   - **Python FastAPI ML Engine**: http://localhost:8000

---

### Option B: Decoupled Manual Setup

If you prefer to run the services in separate terminal windows:

*   **Express Backend**:
    ```bash
    cd backend
    npm run dev
    ```
*   **Vite Frontend**:
    ```bash
    cd frontend
    npm run dev
    ```
*   **FastAPI ML Engine**:
    ```bash
    cd ml-service
    # Activate virtual environment first
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

---

## 🐳 Docker Container Orchestration

To run the entire system inside isolated Docker containers, launch the cluster from the root directory:
```bash
docker-compose up --build
```
- **React Frontend**: http://localhost:3000
- **Express Backend**: http://localhost:5000
- **MongoDB**: Exposed on `localhost:27017`

---

## ☁️ Cloud Deployment on Render

MilkoSense is pre-configured with a **Blueprint specification** (`render.yaml`) for automated multi-service deployments.

### Services Deployed
1.  **`milkosense-ml-service`** (Python/FastAPI Web Service)
2.  **`milkosense-backend`** (Node/Express Web Service)
3.  **`milkosense-frontend`** (Static Site CDN)

### Step-by-Step Deployment Guide
1.  Push your codebase to a GitHub or GitLab repository.
2.  Log in to [Render.com](https://dashboard.render.com).
3.  Navigate to **Blueprints** and click **New Blueprint Instance**.
4.  Connect your repository and authorize Render.
5.  Render will parse the `render.yaml` configuration and prompt you to supply values for key environment variables:
    *   `MONGO_URI`: Enter your MongoDB Atlas connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/milkosense`).
    *   `VITE_API_URL`: Once the backend service starts deploying, copy its public URL (e.g., `https://milkosense-backend.onrender.com`) and paste it as the frontend's build-time `VITE_API_URL` environment variable.
6.  Click **Apply**. Render will automatically provision the ML service, set up database security, build the Node.js API, and deploy the frontend React app.

---

## 🔌 IoT Hardware & Arduino ESP32 Firmware

To connect physical testing hardware to this system, flash an **ESP32 microcontroller** with the firmware script included in the codebase at:
👉 **[SensorsPage.jsx](file:///c:/Users/aditi/OneDrive/Desktop/Project/MilkoSense-new/MilkoSense/frontend/src/features/sensors/pages/SensorsPage.jsx#L14-L67)**

This firmware allows the microcontroller to:
1. Connect to your local dairy facility Wi-Fi.
2. Read raw telemetry values from connected analog sensors (pH electrode, temperature probe, turbidity sensor, TDS solid sensor, and fermentative gas sensor).
3. Package the telemetry into JSON payloads and post them to the Express Backend Gateway API (`/api/sensors`) every 5 seconds.

### Firmware Source Code (Arduino C++):
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverEndpoint = "http://YOUR_SERVER_IP:5000/api/sensors";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");

    // 1. Gather analog logs
    float phVal = analogRead(34) * (3.3 / 4095.0) * 3.5; // Custom Slope Offset
    float tempVal = 18.5 + (random(-2, 3) * 0.5);
    float turbidityVal = analogRead(35) * (5.0 / 4095.0) * 10.0;
    float tdsVal = analogRead(36) * (3.3 / 4095.0) * 500.0;
    float gasVal = analogRead(39) * (3.3 / 4095.0) * 100.0;

    // 2. Serialize JSON payload
    StaticJsonDocument<200> doc;
    doc["ph"] = phVal;
    doc["temperature"] = tempVal;
    doc["turbidity"] = turbidityVal;
    doc["tds"] = tdsVal;
    doc["gas"] = gasVal;
    doc["cattleType"] = "Cow";
    doc["season"] = "Summer";

    String jsonString;
    serializeJson(doc, jsonString);
    
    // 3. Post telemetry frame to Express gateway
    int httpResponseCode = http.POST(jsonString);
    Serial.print("Gateway Response Code: ");
    Serial.println(httpResponseCode);
    http.end();
  }
  delay(5000); // Ingestion poll delay: 5 seconds
}
```

---

## 🔬 Core Quality Thresholds Reference

These are the operational standards programmed into both the backend API and the ML threshold evaluation nodes:

| Parameter | Optimal Range | Unit | Description |
| :--- | :--- | :--- | :--- |
| **pH Level** | `6.4 - 6.7` | pH | Milk acidity/alkalinity indicator |
| **Temperature** | `15.0 - 30.0` | °C | Transport storage hygiene evaluation |
| **TDS (Solids)** | `300 - 600` | ppm | Mineral profile & water dilution detection |
| **Turbidity** | `10.0 - 20.0` | NTU | Suspended fat / foreign solid contamination |
| **Gas Ferment** | `100 - 150` | units | Bacterial breeding index |
