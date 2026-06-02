import React, { useMemo } from 'react';
import useSensorStore from '../../app/store/sensorStore';
import SensorCard from './SensorCard';
import { FlaskConical, Thermometer, Droplets, Zap, Wind, ActivitySquare } from 'lucide-react';

const TelemetryGrid = () => {
  // Selective Zustand subscription to isolate re-render triggers solely to latest telemetry frames
  const latestSensorData = useSensorStore((state) => state.latestSensorData);
  const historyData = useSensorStore((state) => state.historyData) || [];

  const parsedData = useMemo(() => {
    const raw = latestSensorData || {
      ph: 6.6,
      temperature: 18.5,
      turbidity: 15.0,
      tds: 950.0,
      gas: 110.0,
      conductivity: 4.8
    };

    // Helper to evaluate status classifications on the fly
    const getStatus = (param, val) => {
      switch (param) {
        case 'ph':
          return val >= 6.4 && val <= 6.8 ? { label: 'Optimal', color: 'green' } : { label: 'Warning', color: 'red' };
        case 'temperature':
          return val >= 15 && val <= 25 ? { label: 'Optimal', color: 'green' } : { label: 'Warning', color: 'yellow' };
        case 'turbidity':
          return val >= 10 && val <= 20 ? { label: 'Optimal', color: 'green' } : { label: 'Warning', color: 'red' };
        case 'tds':
          return val >= 800 && val <= 1200 ? { label: 'Optimal', color: 'green' } : { label: 'Warning', color: 'yellow' };
        case 'gas':
          return val < 150 ? { label: 'Optimal', color: 'green' } : { label: 'Critical', color: 'red' };
        case 'conductivity':
          return val >= 4.0 && val <= 5.5 ? { label: 'Optimal', color: 'green' } : { label: 'Warning', color: 'yellow' };
        default:
          return { label: 'Safe', color: 'cyan' };
      }
    };

    // Extract recent trends (last 20 points) for sparklines
    const recentHistory = historyData.slice(-20);
    const getTrend = (key) => recentHistory.map(d => ({ value: d[key] || 0 }));

    return [
      {
        title: 'ACIDITY (pH)',
        value: raw.ph,
        unit: 'pH Scale',
        icon: <FlaskConical className="w-5 h-5" />,
        status: getStatus('ph', raw.ph).label,
        color: getStatus('ph', raw.ph).color,
        optimalRange: '6.4-6.8',
        minVal: 0,
        maxVal: 14,
        trendData: getTrend('ph')
      },
      {
        title: 'TEMPERATURE',
        value: raw.temperature,
        unit: '°C',
        icon: <Thermometer className="w-5 h-5" />,
        status: getStatus('temperature', raw.temperature).label,
        color: getStatus('temperature', raw.temperature).color,
        optimalRange: '15-25°C',
        minVal: 0,
        maxVal: 50,
        trendData: getTrend('temperature')
      },
      {
        title: 'TURBIDITY',
        value: raw.turbidity,
        unit: 'NTU',
        icon: <Droplets className="w-5 h-5" />,
        status: getStatus('turbidity', raw.turbidity).label,
        color: getStatus('turbidity', raw.turbidity).color,
        optimalRange: '10-20 NTU',
        minVal: 0,
        maxVal: 50,
        trendData: getTrend('turbidity')
      },
      {
        title: 'TDS DENSITY',
        value: raw.tds,
        unit: 'ppm',
        icon: <Zap className="w-5 h-5" />,
        status: getStatus('tds', raw.tds).label,
        color: getStatus('tds', raw.tds).color,
        optimalRange: '800-1200',
        minVal: 0,
        maxVal: 2000,
        trendData: getTrend('tds')
      },
      {
        title: 'GAS EMISSION',
        value: raw.gas,
        unit: 'ppm',
        icon: <Wind className="w-5 h-5" />,
        status: getStatus('gas', raw.gas).label,
        color: getStatus('gas', raw.gas).color,
        optimalRange: '< 150',
        minVal: 0,
        maxVal: 500,
        trendData: getTrend('gas')
      },
      {
        title: 'CONDUCTIVITY',
        value: raw.conductivity || 4.8,
        unit: 'mS/cm',
        icon: <ActivitySquare className="w-5 h-5" />,
        status: getStatus('conductivity', raw.conductivity || 4.8).label,
        color: getStatus('conductivity', raw.conductivity || 4.8).color,
        optimalRange: '4.0-5.5',
        minVal: 0,
        maxVal: 10,
        trendData: getTrend('conductivity')
      }
    ];
  }, [latestSensorData, historyData]);

  return (
    <div className="grid grid-cols-12 gap-4 w-full">
      {parsedData.map((sensor) => (
        <div key={sensor.title} className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2">
          <SensorCard {...sensor} />
        </div>
      ))}
    </div>
  );
};

export default TelemetryGrid;
