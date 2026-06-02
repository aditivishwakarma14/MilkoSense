import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const AICopilot = ({ assessment }) => {
  const isOptimal = assessment?.qualityGrade?.grade === 'A';
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="h-full p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-2xl relative overflow-hidden flex flex-col justify-center"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Sparkles className="w-64 h-64 text-white" />
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-iot-blue/10 border border-iot-blue/20 text-iot-blue text-[10px] font-bold uppercase tracking-widest mb-6">
          <Sparkles className="w-3 h-3" />
          Neural Assessment Copilot
        </div>
        
        <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
          Sample is exhibiting <span className={isOptimal ? 'text-iot-green' : 'text-iot-yellow'}>{isOptimal ? 'exceptional purity' : 'marginal variances'}</span> with strong A2 protein markers.
        </h2>
        
        <p className="text-gray-400 text-sm lg:text-base max-w-2xl leading-relaxed mb-8">
          {isOptimal 
            ? "The physical and chemical signatures strongly align with premium Gir crossbreed profiles. No detectable synthetic adulterants or dilution markers. Optimal for immediate processing or high-value retail distribution."
            : "Slight deviations observed in TDS and pH balance which may indicate early stage spoilage or minor dilution. Recommend immediate isolation and further biochemical testing."}
        </p>

        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-xl bg-iot-blue text-white font-bold text-sm hover:bg-blue-600 dark:bg-brand-primary transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
            View Deep Diagnostics <ArrowRight className="w-4 h-4" />
          </button>
          <button className="px-6 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold text-sm hover:bg-gray-700 transition-colors">
            Generate Audit Report
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AICopilot;
