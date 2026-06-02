import React from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';

const MilkQualityTrend = () => {
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#1f2937', textStyle: { color: '#fff' } },
    grid: { left: '5%', right: '5%', bottom: '10%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af' }
    },
    yAxis: {
      type: 'value',
      min: 80,
      max: 100,
      splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
      axisLabel: { color: '#9ca3af' }
    },
    series: [
      {
        name: 'Quality Score',
        data: [96, 95, 95, 92, 89, 93, 94],
        type: 'line',
        smooth: true,
        symbolSize: 8,
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.4)' }, { offset: 1, color: 'rgba(16, 185, 129, 0)' }]
          }
        }
      }
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="p-6 rounded-2xl bg-gray-900 border border-gray-800 h-full flex flex-col"
    >
      <h3 className="text-lg font-bold text-white mb-1">Quality Index Trend</h3>
      <p className="text-xs text-gray-400 mb-4">Historical stability over the past 24 hours.</p>
      <div className="flex-1 min-h-[250px]">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
      </div>
    </motion.div>
  );
};

export default MilkQualityTrend;
