import React, { useState } from 'react';
import useRealtimeStream from '../hooks/useRealtimeStream';
import useSocketConnection from '../hooks/useSocketConnection';
import useUiStore from '../../../app/store/uiStore';
import realtimeService from '../services/realtimeService';
import Loader from '../../../components/ui/Loader';
import RealtimeMetrics from '../../../components/telemetry/RealtimeMetrics';
import TelemetryGrid from '../../../components/telemetry/TelemetryGrid';
import QualityScoreCard from '../../../components/telemetry/QualityScoreCard';
import AlertPanel from '../../../components/telemetry/AlertPanel';

// Load chart graphics
import PHChart from '../../../components/charts/PHChart';
import TemperatureChart from '../../../components/charts/TemperatureChart';
import TurbidityChart from '../../../components/charts/TurbidityChart';
import TDSChart from '../../../components/charts/TDSChart';
import GasChart from '../../../components/charts/GasChart';

import { Activity, RefreshCw, Radio, PlayCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const RealtimeDashboard = () => {
  const { isLoading } = useRealtimeStream();
  const { isConnected, triggerReconnect } = useSocketConnection();
  const addToast = useUiStore((state) => state.addToast);
  const [selectedChart, setSelectedChart] = useState('ph');
  const [isSimulating, setIsSimulating] = useState(false);

  // High-precision simulator to post telemetry mimicking an physical ESP32 node
  const handleSimulateNode = async () => {
    if (isSimulating) return;
    
    try {
      setIsSimulating(true);
      
      const isSubstandard = Math.random() > 0.75;
      
      const payload = {
        sampleId: `MS-${new Date().toISOString().slice(0,10)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        collectedAt: new Date().toISOString(),
        location: {
            state: "Maharashtra",
            district: "Pune",
            lat: 18.5204 + (Math.random() * 0.1 - 0.05),
            lng: 73.8567 + (Math.random() * 0.1 - 0.05)
        },
        raw: {
            pH: isSubstandard ? (Math.random() > 0.5 ? 6.2 : 7.2) : (6.6 + Math.random() * 0.2),
            fat: isSubstandard ? (2.5 + Math.random()) : (3.5 + Math.random()),
            SNF: isSubstandard ? (7.0 + Math.random()) : (8.5 + Math.random()),
            protein: isSubstandard ? (2.5 + Math.random()) : (3.2 + Math.random()),
            lactose: 4.8 + (Math.random() * 0.2 - 0.1),
            density: isSubstandard ? 1.025 : 1.030,
            conductivity: isSubstandard ? 6.5 : 4.5,
            refractiveIndex: 1.3425 + (Math.random() * 0.001 - 0.0005),
            turbidity: isSubstandard ? 35.0 : (10.0 + Math.random() * 5),
            temperature: 4.0 + Math.random() * 2,
            color_L: 90.5 + Math.random(),
            color_a: -2.3 + Math.random(),
            color_b: 7.5 + Math.random(),
            spectralFingerprint: Array(200).fill(0).map(() => 0.5 + Math.random() * 0.2),
            tvc_cfu_ml: isSubstandard ? 250000 : 12000,
            coliform_cfu_ml: isSubstandard ? 1200 : 50,
            yeastMold_cfu_ml: isSubstandard ? 5500 : 200
        }
      };

      addToast('Gateway injecting ESP32 data packet...', 'info');
      await realtimeService.postSensorReading(payload);
      addToast('Telemetry frame processed & saved successfully.', 'success');
    } catch (error) {
      addToast('Simulator link failed: MongoDB Atlas timed out.', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return <Loader message="Accessing gateway database records..." fullPage />;
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto text-left flex flex-col gap-6 pb-8">
      {/* Dynamic Header actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 dark:border-dark-border pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-dark-text-primary flex items-center gap-2.5 font-mono">
            <Activity className="w-5 h-5 text-brand-primary animate-pulse" />
            OPERATIONAL WORKSTATION
          </h1>
          <p className="text-[11px] font-mono text-gray-500 dark:text-dark-text-muted mt-1 uppercase tracking-wider">Real-time parameters, AI analytical scores, and automated hazard triggers.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Inject simulated physical node packet */}
          <button
            onClick={handleSimulateNode}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-primary/10 border border-brand-primary/30 hover:bg-brand-primary hover:text-white text-brand-primary font-bold text-[10px] tracking-widest uppercase transition-all duration-200"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            {isSimulating ? 'TRANSMITTING...' : 'INJECT ESP32 PACKET'}
          </button>

          {/* Reset link channels */}
          <button
            onClick={triggerReconnect}
            className="p-2 rounded-lg bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text-primary hover:border-gray-300 dark:hover:border-dark-border transition-all duration-150"
            title="Force WebSocket Handshake Reconnect"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${!isConnected ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid Layout Container */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Top row: Metrics */}
        <div className="col-span-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <RealtimeMetrics />
          </motion.div>
        </div>

        {/* Second row: Telemetry Grid */}
        <div className="col-span-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <TelemetryGrid />
          </motion.div>
        </div>

        {/* Third row: Charts and Alerts */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 xl:col-span-8 flex flex-col p-5 rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-xl min-h-[400px]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-dark-border pb-3 mb-3">
            <h3 className="text-[11px] font-bold tracking-widest text-gray-800 dark:text-dark-text-primary uppercase font-mono flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-brand-primary" />
              HIGH-FREQUENCY PLOTS
            </h3>
            
            {/* Chart type selectors */}
            <div className="flex flex-wrap gap-1 bg-gray-50 dark:bg-dark-bg p-1 border border-gray-200 dark:border-dark-border rounded-lg text-[9px] font-bold font-mono">
              {[
                { id: 'ph', label: 'PH' },
                { id: 'temp', label: 'TEMP' },
                { id: 'turb', label: 'TURB' },
                { id: 'tds', label: 'TDS' },
                { id: 'gas', label: 'GAS' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedChart(tab.id)}
                  className={`px-3 py-1 rounded-md transition-all duration-200 ${
                    selectedChart === tab.id ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Render selected graph dynamically */}
          <div className="flex-1 w-full min-h-[300px] flex items-center justify-center relative">
            {selectedChart === 'ph' && <PHChart />}
            {selectedChart === 'temp' && <TemperatureChart />}
            {selectedChart === 'turb' && <TurbidityChart />}
            {selectedChart === 'tds' && <TDSChart />}
            {selectedChart === 'gas' && <GasChart />}
          </div>
        </motion.div>

        {/* Sidebar panels */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <QualityScoreCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex-1">
            <AlertPanel />
          </motion.div>
        </div>
        
      </div>
    </div>
  );
};

export default RealtimeDashboard;
