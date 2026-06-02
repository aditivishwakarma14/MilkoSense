import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const SensorCard = ({ title, value, unit, icon, status, color = 'cyan', optimalRange, minVal = 0, maxVal = 100, trendData = [] }) => {
  // Map color identifiers to absolute CSS tokens
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          text: 'text-iot-green',
          bg: 'bg-iot-green bg-opacity-10',
          border: 'border-iot-green border-opacity-20',
          bar: 'bg-iot-green shadow-[0_0_12px_#10B981]',
          line: '#10B981',
          glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'
        };
      case 'red':
        return {
          text: 'text-iot-red',
          bg: 'bg-iot-red bg-opacity-10',
          border: 'border-iot-red border-opacity-20',
          bar: 'bg-iot-red shadow-[0_0_12px_#EF4444] animate-pulse',
          line: '#EF4444',
          glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]'
        };
      case 'yellow':
        return {
          text: 'text-iot-yellow',
          bg: 'bg-iot-yellow bg-opacity-10',
          border: 'border-iot-yellow border-opacity-20',
          bar: 'bg-iot-yellow shadow-[0_0_12px_#F59E0B]',
          line: '#F59E0B',
          glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]'
        };
      case 'indigo':
        return {
          text: 'text-iot-indigo',
          bg: 'bg-iot-indigo bg-opacity-10',
          border: 'border-iot-indigo border-opacity-20',
          bar: 'bg-iot-indigo shadow-[0_0_12px_#6366F1]',
          line: '#6366F1',
          glow: 'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]'
        };
      default:
        return {
          text: 'text-iot-cyan',
          bg: 'bg-iot-cyan bg-opacity-10',
          border: 'border-iot-cyan border-opacity-20',
          bar: 'bg-iot-cyan shadow-[0_0_12px_#06B6D4]',
          line: '#06B6D4',
          glow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
        };
    }
  };

  const colors = getColorClasses();
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  
  // Calculate percentage fill for custom linear gauge
  const fillPercentage = Math.max(0, Math.min(100, ((numericValue - minVal) / (maxVal - minVal)) * 100));

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className={`group relative flex flex-col p-5 rounded-2xl glass-panel shadow-glass border border-gray-800 transition-all duration-200 ${colors.glow}`}
    >
      {/* Upper Information row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-gray-500 dark:text-dark-text-muted uppercase font-mono">{title}</span>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <h3 className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {typeof value === 'number' ? value.toFixed(color === 'ph' || title.toLowerCase().includes('ph') ? 2 : 1) : value}
            </h3>
            <span className="text-xs font-semibold text-gray-400 font-mono">{unit}</span>
          </div>
        </div>

        <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} border ${colors.border}`}>
          {icon}
        </div>
      </div>

      {/* Progress track gauge & Trend line */}
      <div className="w-full relative mb-4">
        {trendData && trendData.length > 0 && (
          <div className="absolute inset-0 h-10 -top-8 opacity-40 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <Line type="monotone" dataKey="value" stroke={colors.line} strokeWidth={2} dot={false} isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800 relative z-10">
          <motion.div
            className={`h-full rounded-full ${colors.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Threshold warnings row */}
      <div className="flex items-center justify-between text-[10px] font-mono mt-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <span className="text-gray-400">RANGE: {optimalRange}</span>
        </div>

        <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
          {status}
        </span>
      </div>
    </motion.div>
  );
};

export default SensorCard;
