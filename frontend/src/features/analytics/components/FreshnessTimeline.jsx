import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const FreshnessTimeline = ({ assessment }) => {
  const hours = assessment?.spoilagePrediction?.hours || 71;

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '90%',
        min: 0,
        max: 120,
        splitNumber: 4,
        axisLine: {
          lineStyle: {
            width: 15,
            color: [
              [0.2, '#ef4444'], // 0-24h
              [0.4, '#f59e0b'], // 24-48h
              [1, '#10b981']    // 48-120h
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 10,
          offsetCenter: [0, '-60%'],
          itemStyle: { color: 'auto' }
        },
        axisTick: { length: 12, lineStyle: { color: 'auto', width: 2 } },
        splitLine: { length: 20, lineStyle: { color: 'auto', width: 3 } },
        axisLabel: { color: '#9ca3af', distance: -30, fontSize: 10 },
        title: { offsetCenter: [0, '-20%'], fontSize: 14, color: '#9ca3af' },
        detail: {
          fontSize: 32,
          offsetCenter: [0, '10%'],
          valueAnimation: true,
          formatter: function (value) { return Math.round(value) + 'h'; },
          color: 'auto',
          fontWeight: 'bolder'
        },
        data: [{ value: hours, name: 'Est. Shelf Life' }]
      }
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="p-6 rounded-2xl bg-gray-900 border border-gray-800 h-full flex flex-col"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Freshness Index</h3>
          <p className="text-xs text-gray-400">Total estimated viable hours.</p>
        </div>
        <Clock className="w-5 h-5 text-iot-yellow" />
      </div>
      
      <div className="flex-1 h-[200px]">
        <ReactECharts option={gaugeOption} style={{ height: '100%', width: '100%' }} />
      </div>

      <div className="mt-2 text-center p-3 rounded-xl bg-iot-yellow/10 border border-iot-yellow/20 text-xs text-iot-yellow">
        Maintain refrigeration at 4°C to achieve maximum duration.
      </div>
    </motion.div>
  );
};

export default FreshnessTimeline;
