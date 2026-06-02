import React from 'react';
import { motion } from 'framer-motion';

const RootCauseBar = ({ label, impact, color, direction }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-300 font-bold">{label}</span>
      <span className={`${direction === 'positive' ? 'text-iot-green' : 'text-iot-red'} font-mono`}>
        {direction === 'positive' ? '+' : '-'}{impact}%
      </span>
    </div>
    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
      {direction === 'negative' ? (
        <div className="h-full bg-iot-red rounded-full" style={{ width: `${impact}%` }} />
      ) : (
        <div className="h-full flex-1" />
      )}
      {direction === 'positive' && (
        <div className="h-full bg-iot-green rounded-full" style={{ width: `${impact}%`, marginLeft: 'auto' }} />
      )}
    </div>
  </div>
);

const RootCauseAnalysis = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="p-6 rounded-2xl bg-gray-900 border border-gray-800 h-full flex flex-col"
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-1">Root Cause Analysis</h3>
        <p className="text-xs text-gray-400">Explainable AI: Key variance contributors</p>
      </div>
      
      <div className="flex-1 flex flex-col justify-center mt-2">
        <RootCauseBar label="pH Variance (Acidic Shift)" impact={4.2} color="red" direction="negative" />
        <RootCauseBar label="Temperature Spike (+2°C)" impact={2.8} color="red" direction="negative" />
        <RootCauseBar label="TDS (Optimal Solids)" impact={1.5} color="green" direction="positive" />
        <RootCauseBar label="Turbidity Level" impact={0.5} color="green" direction="positive" />
        <RootCauseBar label="Gas PPM (Methane)" impact={1.2} color="red" direction="negative" />
      </div>
    </motion.div>
  );
};

export default RootCauseAnalysis;
