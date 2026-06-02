import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

const SuitabilityItem = ({ name, score, recommended }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/50 border border-gray-800 mb-3">
    <div className="flex items-center gap-3">
      {recommended ? (
        <CheckCircle2 className="w-5 h-5 text-iot-green" />
      ) : (
        <XCircle className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
      )}
      <span className={`text-sm font-bold ${recommended ? 'text-gray-200' : 'text-gray-500 dark:text-dark-text-muted'}`}>{name}</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${recommended ? 'bg-iot-green' : 'bg-gray-600'}`} 
          style={{ width: `${score}%` }} 
        />
      </div>
      <span className={`text-xs font-mono font-bold w-8 text-right ${recommended ? 'text-iot-green' : 'text-gray-500 dark:text-dark-text-muted'}`}>
        {score}%
      </span>
    </div>
  </div>
);

const DairySuitability = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="p-6 rounded-2xl bg-gray-900 border border-gray-800 h-full flex flex-col"
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-1">Dairy Suitability Engine</h3>
        <p className="text-xs text-gray-400">Processing compatibility based on fat/protein/TDS.</p>
      </div>

      <div className="flex-1 mt-2">
        <SuitabilityItem name="Liquid Milk (Retail)" score={96} recommended={true} />
        <SuitabilityItem name="Premium Cheese" score={88} recommended={true} />
        <SuitabilityItem name="Yogurt / Curd" score={92} recommended={true} />
        <SuitabilityItem name="Milk Powder" score={45} recommended={false} />
      </div>
    </motion.div>
  );
};

export default DairySuitability;
