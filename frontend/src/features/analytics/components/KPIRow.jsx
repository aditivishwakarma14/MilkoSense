import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const KPICard = ({ title, value, status, trend, trendValue, sparklineData, color, delay }) => {
  const sparklineOption = {
    animation: false,
    tooltip: { show: false },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: false },
    yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
    series: [
      {
        type: 'line',
        data: sparklineData,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + '80' }, // 50% opacity
              { offset: 1, color: color + '00' }  // 0% opacity
            ]
          }
        }
      }
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex flex-col justify-between hover:border-gray-700 hover:shadow-lg transition-all h-[130px] group relative overflow-hidden"
    >
      <div className="flex justify-between items-start z-10">
        <div>
          <h4 className="text-[11px] font-bold tracking-widest text-gray-500 dark:text-dark-text-muted uppercase font-mono mb-1">{title}</h4>
          <div className="text-2xl font-black text-white">{value}</div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          status === 'optimal' ? 'bg-iot-green/20 text-iot-green' : 
          status === 'warning' ? 'bg-iot-yellow/20 text-iot-yellow' : 
          status === 'critical' ? 'bg-iot-red/20 text-iot-red' : 
          'bg-iot-blue/20 text-iot-blue'
        }`}>
          {status.toUpperCase()}
        </div>
      </div>
      
      <div className="flex justify-between items-end z-10 mt-2">
        <div className="flex items-center gap-1">
          {trend === 'up' ? <TrendingUp className="w-3 h-3 text-iot-green" /> : 
           trend === 'down' ? <TrendingDown className="w-3 h-3 text-iot-red" /> : 
           <Minus className="w-3 h-3 text-gray-400" />}
          <span className={`text-[10px] font-bold ${trend === 'up' ? 'text-iot-green' : trend === 'down' ? 'text-iot-red' : 'text-gray-400'}`}>
            {trendValue}
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-12 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
        <ReactECharts option={sparklineOption} style={{ height: '100%', width: '100%' }} />
      </div>
    </motion.div>
  );
};

const KPIRow = ({ assessment }) => {
  const kpis = [
    {
      title: "Quality Score",
      value: `${assessment?.score || 94}/100`,
      status: assessment?.qualityGrade?.grade === 'A' ? 'optimal' : 'warning',
      trend: 'up',
      trendValue: '+2.4%',
      sparklineData: [88, 90, 89, 92, 91, 94, 94],
      color: '#10b981', // green
      delay: 0.05
    },
    {
      title: "A1/A2 Type",
      value: "A2 Prev",
      status: 'info',
      trend: 'neutral',
      trendValue: 'Stable',
      sparklineData: [1, 1, 1, 1, 1, 1, 1],
      color: '#3b82f6', // blue
      delay: 0.1
    },
    {
      title: "Predicted Breed",
      value: assessment?.sensorReading?.cattleType || "Gir Cross",
      status: 'info',
      trend: 'up',
      trendValue: '98% Conf',
      sparklineData: [80, 85, 88, 92, 95, 97, 98],
      color: '#8b5cf6', // purple
      delay: 0.15
    },
    {
      title: "Freshness",
      value: `${assessment?.spoilagePrediction?.hours || 71}h`,
      status: 'optimal',
      trend: 'down',
      trendValue: '-1.2h/hr',
      sparklineData: [80, 78, 76, 75, 74, 72, 71],
      color: '#f59e0b', // yellow
      delay: 0.2
    },
    {
      title: "Risk Level",
      value: assessment?.adulterationRisk?.detected ? "HIGH" : "LOW",
      status: assessment?.adulterationRisk?.detected ? 'critical' : 'optimal',
      trend: assessment?.adulterationRisk?.detected ? 'up' : 'neutral',
      trendValue: assessment?.adulterationRisk?.detected ? '+15%' : '0%',
      sparklineData: [5, 4, 6, 5, 4, 3, 2],
      color: assessment?.adulterationRisk?.detected ? '#ef4444' : '#10b981',
      delay: 0.25
    },
    {
      title: "Device Status",
      value: "Online",
      status: 'optimal',
      trend: 'up',
      trendValue: '99.9% Uptime',
      sparklineData: [100, 99, 100, 100, 100, 100, 100],
      color: '#06b6d4', // cyan
      delay: 0.3
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi, idx) => (
        <KPICard key={idx} {...kpi} />
      ))}
    </div>
  );
};

export default KPIRow;
