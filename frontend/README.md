# MilkoSense Realtime React Telemetry Console 🚀

Welcome to the enterprise-grade, industrial-scale real-time telemetry console for **MilkoSense**. This frontend is built with a focus on performance, low memory footprint, and low-latency rendering for high-frequency IoT streaming data.

---

## 🛠️ Architecture Stack
*   **Core**: React 18+ (Vite Bundler)
*   **Styling**: Tailwind CSS (v4 CSS-First Custom Theme Engine)
*   **Realtime Streaming**: Socket.IO Client
*   **State Management**: Zustand (Optimized selective subscribers, zero-context renders)
*   **Charting Layer**: Apache ECharts (`echarts-for-react`) with dynamic resizing
*   **Animations**: Framer Motion (Smooth glassmorphism transitions and pulse warnings)
*   **Code Splitting**: React Lazy + Suspense (Instant compilation & page chunking)
*   **Production Server**: Multi-stage Docker container utilizing a secure Nginx proxy

---

## 📂 Codebase Layout
```text
frontend/
├── public/                       # Global favicon, icons, and assets
├── src/
│   ├── app/                      # Application Contexts
│   │   ├── store/                # Zustand State Managers (Selective subscribers)
│   │   │   ├── sensorStore.js    # Raw telemetry frames & WebSockets link state
│   │   │   ├── analyticsStore.js # AI assessments, grades, and quality scores
│   │   │   ├── alertStore.js     # Live incident matrix catalog
│   │   │   └── uiStore.js        # Themes toggles & layout toasts
│   │   ├── providers/            # Application Orchestrators
│   │   │   ├── SocketProvider.jsx# Websocket connection and listener binds
│   │   │   └── ThemeProvider.jsx # Tailwind dark/light theme initializer
│   │   └── router/               # Code-split Lazy routing
│   │       └── AppRouter.jsx
│   │
│   ├── components/               # Modular Layout & UI blocks
│   │   ├── ui/                   # Loaders, ErrorBoundaries, Modal sheets, Status Badges
│   │   ├── layout/               # Navbar commands, Sidebar controls, Footer bars
│   │   ├── telemetry/            # SensorCard gauges, Scoreboard dials, Alert panels
│   │   ├── charts/               # ECharts wrappers (pH, Temp, Turbidity, TDS, Gas, Forecasts)
│   │   └── reports/              # Tables ledger, Excel CSV exporters, search filters
│   │
│   ├── features/                 # Segmented Domain Logic
│   │   ├── realtime/             # Live sensor feeds hooks & simulation injectors
│   │   ├── analytics/            # Double Exponential Holt-Winters smoothing calculations
│   │   └── reports/              # Database report query and audit logs
│   │
│   ├── services/                 # Centralized HTTP & Socket clients
│   │   ├── apiClient.js          # Axios configuration with global error interceptors
│   │   ├── socketClient.js       # Socket.IO connection client with reconnect limits
│   │   ├── authService.js        # Session and credentials management
│   │   └── storageService.js     # Safe localStorage serializers
│   │
│   ├── pages/                    # Home, About, Team, Contact, Colorimetric
│   ├── index.css                 # CSS-first theme rules & custom scrollbars
│   ├── App.jsx                   # Component hub
│   └── main.jsx                  # Virtual DOM mounter
│
├── Dockerfile                    # Production multi-stage Docker builder
├── nginx.conf                    # Nginx reverse proxy mapping SPA routes fallback
└── vite.config.js                # Server proxy maps & building configurations
```

---

## 🚀 Performance Strategies Implemented
1.  **Selective Zustand Subscriptions**: Components subscribe *only* to specific slices of states (e.g. `latestSensorData`). Changes to alert counts or menus will *never* trigger re-renders in ECharts components.
2.  **Double Exponential Smoothing (Holt-Winters)**: Rather than querying servers, advanced predictive forecasting models are computed directly on-the-fly inside the browser using optimized linear formulas in `trendPredictionService.js`.
3.  **Intermediate Telemetry Buffer**: To survive extremely high-speed microcontroller streams, the `useTelemetryBuffer` hook buffers sensor updates and flushes them in batches every 500ms, maintaining a perfect 60fps browser rendering cycle.
4.  **Multi-Stage Docker Containerization**: Nodes compile static assets inside a Node-builder stage, copying ONLY final HTML/JS files into Nginx, reducing production footprints to under 40MB.
