import React, { useMemo } from 'react';
import useSensorStore from '../../app/store/sensorStore';
import useAlertStore from '../../app/store/alertStore';
import { Database, AlertOctagon, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const RealtimeMetrics = () => {
  const historyData = useSensorStore((state) => state.historyData);
  const alerts = useAlertStore((state) => state.alerts);

  // Memoize metrics computation to avoid redundant CPU usage on live streaming re-renders
  const metrics = useMemo(() => {
    const totalReadings = historyData.length;
    
    // Calculate rolling average milk quality score (last 100 readings)
    const validScores = historyData.map(h => {
      // If the grading score is attached, use it. Otherwise mock or calculate
      if (h.qualityGrade?.score) return h.qualityGrade.score;
      if (h.score) return h.score;
      // Default fallback algorithm to make prototype alive
      const deviation = Math.abs(h.ph - 6.6) * 10 + Math.abs(h.temperature - 20) * 0.5;
      return Math.max(20, Math.min(100, 100 - deviation));
    });
    
    const avgScore = validScores.length > 0 
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) 
      : 0;

    const criticalAlerts = alerts.filter(a => !a.resolved).length;

    // Simulate system active uptime from the first reading
    let uptimeHours = '0.0';
    if (historyData.length > 1) {
      const first = new Date(historyData[0].timestamp).getTime();
      const last = new Date(historyData[historyData.length - 1].timestamp).getTime();
      const diff = (last - first) / (1000 * 60 * 60); // milliseconds to hours
      uptimeHours = diff > 0.01 ? diff.toFixed(1) : '0.1';
    }

    return {
      totalReadings,
      avgScore,
      criticalAlerts,
      uptimeHours
    };
  }, [historyData, alerts]);

  const cards = [
    {
      title: 'TOTAL READINGS INGESTED',
      value: metrics.totalReadings,
      unit: 'Telemetry Frames',
      icon: <Database className="w-5 h-5 text-iot-cyan" />,
      color: 'text-iot-cyan',
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.1)]'
    },
    {
      key: 'avg-score',
      title: 'AVERAGE QUALITY SCORE',
      value: `${metrics.avgScore}%`,
      unit: 'Standard Grade',
      icon: <TrendingUp className="w-5 h-5 text-iot-green" />,
      color: 'text-iot-green',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]'
    },
    {
      title: 'ACTIVE SAFETY ALERTS',
      value: metrics.criticalAlerts,
      unit: 'Unresolved Logs',
      icon: <AlertOctagon className={`w-5 h-5 text-iot-red ${metrics.criticalAlerts > 0 ? 'animate-bounce' : ''}`} />,
      color: 'text-iot-red',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.1)]'
    },
    {
      title: 'SYSTEM GATEWAY UPTIME',
      value: `${metrics.uptimeHours} hrs`,
      unit: 'Continuous Feed',
      icon: <Clock className="w-5 h-5 text-iot-indigo" />,
      color: 'text-iot-indigo',
      glow: 'shadow-[0_0_15px_rgba(99,102,241,0.1)]'
    }
  ];

  return (
    <div className="grid grid-cols-12 gap-4 w-full">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className={`col-span-12 sm:col-span-6 lg:col-span-3 flex items-center justify-between p-4.5 rounded-xl glass-panel shadow-glass border border-gray-800 ${card.glow}`}
        >
          <div>
            <span className="text-[9px] font-bold tracking-widest text-gray-500 dark:text-dark-text-muted uppercase font-mono">{card.title}</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <h3 className={`text-2xl font-black tracking-tight text-white font-mono`}>
                {card.value}
              </h3>
              <span className="text-[10px] font-semibold text-gray-400 font-mono">{card.unit}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
            {card.icon}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default RealtimeMetrics;
