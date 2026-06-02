import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Beaker, ShieldAlert, CheckCircle } from 'lucide-react';

const ForecastNode = ({ time, status, desc, isLast }) => (
  <div className="relative flex gap-4">
    {!isLast && <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-800"></div>}
    
    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
      status === 'optimal' ? 'bg-iot-green/20 border-iot-green text-iot-green' : 
      status === 'warning' ? 'bg-iot-yellow/20 border-iot-yellow text-iot-yellow' : 
      'bg-iot-red/20 border-iot-red text-iot-red'
    }`}>
      {status === 'optimal' ? <CheckCircle className="w-4 h-4" /> : 
       status === 'warning' ? <Activity className="w-4 h-4" /> : 
       <ShieldAlert className="w-4 h-4" />}
    </div>
    
    <div className="pb-8">
      <h4 className="text-sm font-bold text-gray-200">{time}</h4>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  </div>
);

const MicrobialForecast = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="p-6 rounded-2xl bg-gray-900 border border-gray-800 h-full flex flex-col"
    >
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Microbial Forecast</h3>
          <p className="text-xs text-gray-400">Predicted bacterial growth & spoilage curve.</p>
        </div>
        <div className="p-2 bg-iot-blue/10 rounded-lg">
          <Beaker className="w-5 h-5 text-iot-blue" />
        </div>
      </div>

      <div className="flex-1 mt-2 pl-2">
        <ForecastNode 
          time="Now (T+0)" 
          status="optimal" 
          desc="Bacterial load stable. Within excellent safety margins." 
        />
        <ForecastNode 
          time="+ 6 Hours" 
          status="optimal" 
          desc="Minimal psychrotrophic growth. Safe for processing." 
        />
        <ForecastNode 
          time="+ 12 Hours" 
          status="warning" 
          desc="Acidification begins. pH predicted to drop by 0.15." 
        />
        <ForecastNode 
          time="+ 24 Hours" 
          status="critical" 
          desc="Lactic acid threshold reached. High spoilage probability." 
          isLast={true}
        />
      </div>
    </motion.div>
  );
};

export default MicrobialForecast;
