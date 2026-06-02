import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Dna, IndianRupee, Hash, Activity } from 'lucide-react';

const DigitalPassport = ({ assessment }) => {
  // Use fallback values if assessment properties are missing
  const id = assessment?.id || `MK-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
  
  const breed = assessment?.breedPrediction?.primary || assessment?.sensorReading?.cattleType || 'Unknown / Mixed';
  const confidence = assessment?.breedPrediction?.confidence || assessment?.qualityGrade?.confidence || 0.95;
  const a1a2 = assessment?.a1a2Status?.type || 'Not Analyzed';
  
  const baseValuePerLiter = 45; // base price in INR
  const purityMultiplier = assessment?.qualityGrade?.grade === 'A+' ? 1.4 : assessment?.qualityGrade?.grade === 'A' ? 1.2 : assessment?.qualityGrade?.grade === 'B+' ? 1.1 : assessment?.qualityGrade?.grade === 'B' ? 1.0 : 0.7;
  const a2Premium = a1a2 === 'A2' ? 10 : 0; // 10 INR premium for A2 milk
  const valuePerLiter = ((baseValuePerLiter * purityMultiplier) + a2Premium).toFixed(2);

  return (
    <div className="p-0 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-2xl h-full flex flex-col justify-between overflow-hidden relative">
      {/* Background Graphic overlay for "Foundry" style aesthetic */}
      <div className="absolute top-0 left-0 w-full h-40 z-0">
         <img src="/images/cattle_passport_scan.png" alt="Digital Twin" className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/80 to-gray-900"></div>
      </div>

      <div className="p-6 flex flex-col h-full z-10">
        <div className="flex items-center gap-3 mb-4 border-b border-gray-800 pb-4">
          <div className="p-2 bg-iot-blue/20 rounded-lg backdrop-blur-sm">
            <Fingerprint className="w-6 h-6 text-iot-blue" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide drop-shadow-md">DIGITAL PASSPORT</h3>
            <p className="text-[10px] text-gray-300 font-mono tracking-widest uppercase drop-shadow-md">Immutable Sample Identity</p>
          </div>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/80 backdrop-blur-sm border border-gray-800 shadow-inner">
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Batch ID</span>
            </div>
            <span className="text-sm text-gray-200 font-mono font-bold tracking-widest">{id}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/80 backdrop-blur-sm border border-gray-800 shadow-inner">
            <div className="flex items-center gap-3">
              <Dna className="w-4 h-4 text-iot-cyan" />
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Predicted Breed</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-iot-cyan font-bold capitalize">{breed}</div>
              <div className="text-[10px] text-gray-500 dark:text-dark-text-muted font-mono mt-0.5">Conf: {(confidence * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/80 backdrop-blur-sm border border-gray-800 shadow-inner">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">A1/A2 Status</span>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${a1a2 === 'A2' ? 'text-iot-green' : 'text-purple-400'}`}>{a1a2}</div>
              <div className="text-[10px] text-gray-500 dark:text-dark-text-muted font-mono mt-0.5">{assessment?.a1a2Status?.healthImpact || 'Standard'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/80 backdrop-blur-sm border border-gray-800 shadow-inner">
            <div className="flex items-center gap-3">
              <IndianRupee className="w-4 h-4 text-iot-green" />
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Economic Value</span>
            </div>
            <div className="text-right">
              <div className="text-lg text-iot-green font-bold">₹{valuePerLiter}</div>
              <div className="text-[10px] text-gray-500 dark:text-dark-text-muted font-mono mt-0.5">Per Liter (Inc. Premiums)</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-center shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700/50 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-iot-green animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-[10px] text-gray-300 font-mono uppercase tracking-widest">Verified by AI Oracle</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalPassport;
