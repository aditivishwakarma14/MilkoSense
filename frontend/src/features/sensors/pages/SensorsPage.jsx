import React from 'react';
import { Sliders, Cpu, Link, HelpCircle, Save } from 'lucide-react';
import useUiStore from '../../../app/store/uiStore';
import { motion } from 'framer-motion';
import ComparisonChart from '../../../components/charts/ComparisonChart';

const SensorsPage = () => {
  const addToast = useUiStore((state) => state.addToast);

  const handleSaveConfigs = () => {
    addToast('Sensor Node calibration saved successfully', 'success');
  };

  const codeSnippet = `
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
  Serial.println("\\nWiFi Connected!");
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
`;

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-dark-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-dark-text-primary flex items-center gap-2.5">
            <div className="p-2 bg-green-50 dark:bg-brand-primary/10 rounded-lg">
              <Sliders className="w-6 h-6 text-[#047857] dark:text-brand-primary" />
            </div>
            SENSOR NODE CALIBRATIONS
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">Calibrate physical analog inputs, adjust slopes, and access Arduino firmware scripts.</p>
        </div>

        <button
          onClick={handleSaveConfigs}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white font-semibold text-xs tracking-wider uppercase shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          SAVE COEFFICIENTS
        </button>
      </div>

      {/* Grid containing Config Form and Code Blocks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Segment: Calibration Forms (33% wide) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm space-y-5"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4">
            <Cpu className="w-5 h-5 text-[#047857] dark:text-brand-primary" />
            <h3 className="text-sm font-bold tracking-widest text-gray-800 dark:text-dark-text-primary uppercase font-mono">CALIBRATION FORM</h3>
          </div>

          <p className="text-xs text-gray-500 dark:text-dark-text-muted leading-relaxed">
            Adjust physical mathematical variables to calibrate analog raw readings before compiling.
          </p>

          <form className="space-y-4 font-mono text-xs" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-gray-700 dark:text-dark-text-primary font-bold block mb-1.5">pH SENSOR SLOPE (pH/V)</label>
              <input
                type="number"
                step="0.01"
                defaultValue={3.50}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3.5 py-2 text-gray-900 dark:text-dark-text-primary outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-all"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-dark-text-primary font-bold block mb-1.5">TEMPERATURE OFFSET (°C)</label>
              <input
                type="number"
                step="0.1"
                defaultValue={0.0}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3.5 py-2 text-gray-900 dark:text-dark-text-primary outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-all"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-dark-text-primary font-bold block mb-1.5">TDS FACTOR COEFFICIENT</label>
              <input
                type="number"
                step="0.1"
                defaultValue={0.5}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3.5 py-2 text-gray-900 dark:text-dark-text-primary outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-all"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-dark-text-primary font-bold block mb-1.5">TURBIDITY MAX (NTU/V)</label>
              <input
                type="number"
                step="0.1"
                defaultValue={10.0}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3.5 py-2 text-gray-900 dark:text-dark-text-primary outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-all"
              />
            </div>
          </form>
        </motion.div>

        {/* Right Segment: Arduino Code copy block (66% wide) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-600 dark:text-brand-primary" />
              <h3 className="text-sm font-bold tracking-widest text-gray-800 dark:text-dark-text-primary uppercase font-mono">ARDUINO C++ INTEGRATION</h3>
            </div>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(codeSnippet);
                addToast('Arduino script copied to clipboard', 'success');
              }}
              className="px-3 py-1.5 text-[10px] font-bold text-blue-700 dark:text-brand-mint bg-blue-50 dark:bg-brand-primary/10 hover:bg-blue-100 dark:hover:bg-brand-primary/20 border border-blue-200 dark:border-brand-primary/20 rounded-md transition-all"
            >
              COPY CODE
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-dark-text-muted leading-relaxed mb-4">
            Flash this script onto your ESP32 micro-controller board to begin posting raw analog telemetries directly to the platform's backend gateway in real-time.
          </p>

          <pre className="flex-1 overflow-x-auto p-4 bg-gray-900 dark:bg-black border border-gray-800 dark:border-dark-border rounded-xl text-[11px] leading-relaxed text-green-400 dark:text-brand-mint font-mono max-h-[350px] shadow-inner">
            <code>{codeSnippet.trim()}</code>
          </pre>
        </motion.div>

        {/* Bottom Row: Additional Data and Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Node Diagnostics */}
          <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4">
              <Sliders className="w-5 h-5 text-[#047857] dark:text-brand-primary" />
              <h3 className="text-sm font-bold tracking-widest text-gray-800 dark:text-dark-text-primary uppercase font-mono">NODE DIAGNOSTICS</h3>
            </div>
            
            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-gray-50 dark:border-dark-border pb-2">
                <span className="text-gray-500 dark:text-dark-text-muted font-bold">STATUS</span>
                <span className="text-[#047857] dark:text-brand-primary font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#047857] dark:bg-brand-primary animate-pulse"></span> ONLINE</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 dark:border-dark-border pb-2">
                <span className="text-gray-500 dark:text-dark-text-muted font-bold">UPTIME</span>
                <span className="text-gray-800 dark:text-dark-text-primary font-medium">14d 08h 32m</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 dark:border-dark-border pb-2">
                <span className="text-gray-500 dark:text-dark-text-muted font-bold">BATTERY LEVEL</span>
                <span className="text-gray-800 dark:text-dark-text-primary font-medium">84% (Charging)</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 dark:border-dark-border pb-2">
                <span className="text-gray-500 dark:text-dark-text-muted font-bold">SIGNAL (RSSI)</span>
                <span className="text-blue-600 dark:text-brand-primary font-medium">-64 dBm (Good)</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 dark:border-dark-border pb-2">
                <span className="text-gray-500 dark:text-dark-text-muted font-bold">LAST PING</span>
                <span className="text-gray-800 dark:text-dark-text-primary font-medium">{'<'} 1 second ago</span>
              </div>
            </div>
          </div>

          {/* Maintenance & Action Items */}
          <div className="p-6 rounded-2xl bg-orange-50 dark:bg-amber-900/10 border border-orange-100 dark:border-amber-900/30 shadow-sm space-y-4">
             <div className="flex items-center gap-2 border-b border-orange-200/50 dark:border-amber-900/30 pb-3">
              <HelpCircle className="w-5 h-5 text-orange-600 dark:text-amber-500" />
              <h3 className="text-sm font-bold tracking-widest text-orange-900 dark:text-amber-400 uppercase font-mono">MAINTENANCE ALERTS</h3>
            </div>
            <ul className="text-xs space-y-3 font-mono">
              <li className="flex gap-2 text-orange-800 dark:text-amber-200/80">
                <span className="font-black text-orange-600 dark:text-amber-500">•</span> 
                pH Probe recalibration due in 5 days (14 days cycle).
              </li>
              <li className="flex gap-2 text-orange-800 dark:text-amber-200/80">
                <span className="font-black text-orange-600 dark:text-amber-500">•</span> 
                Turbidity lens requires manual cleaning to prevent drift.
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm flex flex-col"
        >
           <ComparisonChart />
        </motion.div>
      </div>
    </div>
  );
};

export default SensorsPage;
