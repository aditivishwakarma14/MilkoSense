# 🥛 MilkoSense - AI-Assisted Milk Quality Testing System

[![Status](https://img.shields.io/badge/Status-Active-success)]()
[![Version](https://img.shields.io/badge/Version-3.0.0-blue)]()
[![Architecture](https://img.shields.io/badge/Architecture-Clean_Fullstack_MVC-emerald)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-cyan)]()

**MilkoSense** is a state-of-the-art IoT-based milk quality testing system. It has been reorganized into a **clean, highly scalable Frontend + Backend Architecture** to support independent deployment, containerized Docker execution, real-time WebSocket telemetry, and production-ready robustness.

---

## 📋 Table of Contents

- [Reorganized Scalable Folder Structure](#-reorganized-scalable-folder-structure)
- [REST APIs & Socket.IO Architecture](#-rest-apis--socketio-architecture)
- [How to Run (3 Ways)](#-how-to-run-3-ways)
- [Core Quality Thresholds](#-core-quality-thresholds)
- [Completed Migration Rules](#-completed-migration-rules)
- [Docker-Compose Orchestration](#-docker-compose-orchestration)

---

## 🏗️ Reorganized Scalable Folder Structure

The project has been successfully restructured into decoupled frontend, backend, and documentation roots:

```
MilkoSense/
│
├── frontend/                     # Pure static HTML, CSS & client logic (Independent)
│   ├── public/                   # Client-facing static HTML files
│   │   ├── index.html            # Landing / Entrance
│   │   ├── about.html            # Core project theory
│   │   ├── contact.html          # Farmer contact page
│   │   ├── dashboard.html        # Main historical IoT dashboard
│   │   ├── sensors.html          # Manual sensor parameters input
│   │   ├── team.html             # Project members roster
│   │   ├── analysis.html         # Premium ML grading dashboard
│   │   ├── realtime-dashboard.html# Live Socket.IO graphing dashboard
│   │   └── colorimetric.html     # Image analysis module
│   │
│   ├── assets/                   # Static page resources
│   │   ├── css/                  # Styling files
│   │   ├── js/                   # Shared scripts (main.js, theme.js, dynamic-loader.js)
│   │   ├── images/               # Graphic JPG files (ph/tds/turbidity sensors, team)
│   │   └── icons/                # Web SVG/PNG graphics
│   │
│   ├── components/               # Shared reusable markup / modules
│   │   ├── navbar/
│   │   ├── footer/
│   │   ├── charts/
│   │   └── cards/
│   │
│   ├── services/                 # Centralized state/logic services
│   │   ├── api.js                # Central HTTP fetcher (Express + fallback direct Firebase)
│   │   ├── auth.js               # Mock session management and operator authentication
│   │   └── firebase.js           # standalone Firebase DB polling client
│   │
│   ├── pages/                    # Complex page-specific logic
│   │   ├── analytics/            # ai-analysis.js & trend-analysis.js
│   │   └── reports/              # report-generator.js
│   │
│   ├── package.json              # Independent client launcher config
│   ├── Dockerfile                # Optimized frontend image build instructions
│   └── README.md                 # Frontend manual
│
├── backend/                      # Node.js + Express.js APIs & Websockets (Independent)
│   ├── src/                      # Source scripts
│   │   ├── controllers/          # Route handlers (sensors, analysis, reports, realtime)
│   │   ├── routes/               # API endpoint registrations
│   │   ├── services/             # Backend operations (aiService, firebaseService)
│   │   ├── config/               # Database configurations
│   │   ├── middleware/           # Custom validation checks
│   │   ├── models/               # Schema models
│   │   ├── utils/                # Server helper functions
│   │   └── server.js             # Express core runtime entrypoint
│   │
│   ├── uploads/                  # Temporary file registers
│   ├── reports/                  # Local persistent JSON database (history.json)
│   ├── package.json              # Node dependency configurations
│   ├── .env                      # Ports & Firebase RTDB configuration credentials
│   ├── Dockerfile                # Optimized backend image build instructions
│   └── README.md                 # Backend manual
│
├── docs/                         # Consolidated product documentation
│   ├── design.md                 # System UI theme guides
│   ├── interaction.md            # Page events sequence charts
│   └── outline.md                # General thesis project report
│
├── .gitignore                    # Tracking safety configs
├── docker-compose.yml            # Multi-container cluster deployment orchestrator
└── README.md                     # Root documentation manual (This file)
```

---

## 📡 REST APIs & Socket.IO Architecture

The Node.js Express backend exposes a professional REST API and triggers high-frequency live WebSocket feeds:

### REST API Mappings
- **`GET /api/sensors`**: Retrieves cached real-time parameters from Firebase (pH, TDS, Turbidity, Temp, Gas). Falls back gracefully to smooth offline emulations if cloud database is unreachable.
- **`POST /api/analysis`**: Takes sensor inputs and calculates a weighted Random Forest grade (A/B/C/D), risk profile, and actionable steps.
- **`GET` / `POST /api/reports`**: Fetches list or saves analytical reports into `/reports/history.json`.
- **`GET /api/realtime`**: Compiles aggregated analytics (Avg quality grade, alarm counts, uptime).

### Socket.IO Feed
- Emits **`sensorData`** broadcasts to client dashboards every 3 seconds.
- Detects **`alert`** signals in real-time when evaluated milk scores fall below critical safety thresholds (<60).

---

## 🚀 How to Run (3 Ways)

Ensure you have **Node.js (v18+)** installed.

### 1. Unified Fullstack Setup (Recommended & Easiest)
In this mode, the Express backend serves the API endpoints *and* host-binds the frontend static pages, keeping URLs perfectly aligned:
```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Fire up the unified server
npm run dev
# Active at: http://localhost:5000/
```

### 2. Fully Decoupled Setup (Independent Development)
Run the client and the backend on completely separate ports to test isolated deployments:

**Startup Backend:**
```bash
cd backend
npm install
npm run dev
# Running REST + Sockets at: http://localhost:5000/
```

**Startup Frontend:**
```bash
cd frontend
npm run dev
# Running Static Server at: http://localhost:3000/
```
*Note: `frontend/services/api.js` will automatically detect that you are running independently and route all API calls to `http://localhost:5000` with automated direct-Firebase fallbacks.*

### 3. Docker Cluster Launch (Production Ready)
Launch both containers as isolated services in a sandboxed network:
```bash
# Launch multi-container grid
docker-compose up --build

# Backend accessible at: http://localhost:5000/
# Frontend accessible at: http://localhost:3000/
```

---

## 🔬 Core Quality Thresholds

| Parameter | Optimal Range | Metric Unit | Health Indication |
| :--- | :--- | :--- | :--- |
| **pH Level** | `6.4 - 6.7` | pH | Milk freshness / bacterial acidity |
| **Temperature** | `15.0 - 30.0` | °C | Transport storage hygiene |
| **TDS (Solids)** | `300 - 600` | ppm | Mineral profiling / water dilution detection |
| **Turbidity** | `10.0 - 20.0` | NTU | Suspended fat / dirt contamination |
| **Gas Ferment** | `100 - 150` | units | Bacterial multiplying index |

---

## 🛠️ Completed Migration Rules

1. **HTML Shifting**: Relocated all 11 user-facing pages into `frontend/public/`.
2. **Logically Categorized Scripts**:
   - `ai-analysis.js` → `frontend/pages/analytics/ai-analysis.js` (ML Model logic)
   - `trend-analysis.js` → `frontend/pages/analytics/trend-analysis.js` (Analytical stats)
   - `report-generator.js` → `frontend/pages/reports/report-generator.js` (CSV/JSON/Print)
   - `milk-intelligence.js` → `frontend/services/milk-intelligence.js` (AI Breed guidelines)
3. **Decoupled Firebase RTDB**: Consolidated `firebase-integration.js` to `frontend/services/firebase.js`.
4. **Boilerplate REST Express Server**: Engineered structured folders for controllers, routes, and utilities.
5. **Real-time Socket.IO Broadcast**: Integrated event emission on background telemetry threads.
6. **Environment Separation**: Transported database credentials and ports to `.env` configurations.
7. **Clean Relative Relinking**: Automatically modified all internal HTML pathways to load dependencies from new modular folders (e.g., assets/images, assets/js).
8. **Decoupled Deployability**: Configured standalone client and backend setup with independent Dockerfiles and build parameters.
