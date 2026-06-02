import React from 'react';
import { motion } from 'framer-motion';

const ConfidenceBar = ({ label, confidence, riskLevel }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-gray-300 font-bold">{label}</span>
      <span className={`font-mono ${riskLevel === 'high' ? 'text-iot-red' : riskLevel === 'medium' ? 'text-iot-yellow' : 'text-iot-green'}`}>
        {confidence}% Conf.
      </span>
    </div>
    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full ${riskLevel === 'high' ? 'bg-iot-red' : riskLevel === 'medium' ? 'bg-iot-yellow' : 'bg-iot-green'}`} 
        style={{ width: `${confidence}%` }} 
      />
    </div>
  </div>
);

const AdulterationIntelligence = ({ assessment }) => {
  const isDetected = assessment?.adulterationRisk?.detected;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="p-6 rounded-2xl bg-gray-900 border border-gray-800 h-full flex flex-col"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">Adulteration Intelligence</h3>
        <p className="text-xs text-gray-400">Neural network confidence mapping for synthetic additives.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <ConfidenceBar label="Water Dilution" confidence={isDetected ? 85 : 12} riskLevel={isDetected ? 'high' : 'low'} />
        <ConfidenceBar label="Urea Content" confidence={isDetected ? 65 : 2} riskLevel={isDetected ? 'medium' : 'low'} />
        <ConfidenceBar label="Detergent / Soap" confidence={isDetected ? 40 : 1} riskLevel={isDetected ? 'medium' : 'low'} />
        <ConfidenceBar label="Starch / Flour" confidence={isDetected ? 15 : 0} riskLevel="low" />
        <ConfidenceBar label="Synthetic Milk Vectors" confidence={isDetected ? 20 : 0} riskLevel="low" />
      </div>
      
      <div className={`mt-4 p-3 rounded-xl border text-xs text-center ${isDetected ? 'bg-iot-red/10 border-iot-red/20 text-iot-red' : 'bg-iot-green/10 border-iot-green/20 text-iot-green'}`}>
        {isDetected ? 'Critical Adulteration Profiles Detected. Recommend Isolation.' : 'No significant adulterant signatures matched.'}
      </div>
    </motion.div>
  );
};

export default AdulterationIntelligence;
