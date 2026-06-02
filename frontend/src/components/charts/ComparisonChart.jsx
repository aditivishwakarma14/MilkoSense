import React, { useMemo } from 'react';
import useSensorStore from '../../app/store/sensorStore';
import BaseChart from './BaseChart';

const ComparisonChart = () => {
  const historyData = useSensorStore((state) => state.historyData);

  const option = useMemo(() => {
    // Calculate current averages
    let avgPh = 6.7, avgTemp = 4.0, avgTurbidity = 12.0, avgTds = 850, avgGas = 60;
    
    if (historyData && historyData.length > 0) {
      const recent = historyData.slice(0, 20); // last 20 readings
      avgPh = recent.reduce((sum, r) => sum + (r.ph || 6.6), 0) / recent.length;
      avgTemp = recent.reduce((sum, r) => sum + (r.temperature || 4.0), 0) / recent.length;
      avgTurbidity = recent.reduce((sum, r) => sum + (r.turbidity || 15.0), 0) / recent.length;
      avgTds = recent.reduce((sum, r) => sum + (r.tds || 900), 0) / recent.length;
      avgGas = recent.reduce((sum, r) => sum + (r.gas || 100), 0) / recent.length;
    }

    return {
      title: {
        text: 'STANDARD VS LIVE DEVIATION',
        textStyle: { color: '#111827', fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter, sans-serif' },
        top: '2%',
        left: '2%',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Standard Target', 'Live Average'],
        bottom: '0%',
        textStyle: { color: '#4B5563', fontFamily: 'Inter, sans-serif' }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['pH Level', 'Temp (°C)', 'Turbidity', 'TDS (ppm)', 'Gas (ppm)'],
        axisLabel: { color: '#6B7280', fontSize: 10, fontFamily: 'Inter, sans-serif' },
        axisLine: { lineStyle: { color: '#D1D5DB' } }
      },
      yAxis: [
        {
          type: 'log',
          name: 'Units (Log Scale)',
          position: 'left',
          axisLabel: { color: '#6B7280', fontSize: 10, fontFamily: 'Inter, sans-serif' },
          splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
          min: 1
        }
      ],
      series: [
        {
          name: 'Standard Target',
          type: 'bar',
          data: [6.7, 4.0, 10.0, 850, 50],
          itemStyle: { 
            color: '#10B981', // Emerald 500
            borderRadius: [4, 4, 0, 0] 
          }
        },
        {
          name: 'Live Average',
          type: 'bar',
          data: [avgPh.toFixed(1), avgTemp.toFixed(1), avgTurbidity.toFixed(1), avgTds.toFixed(0), avgGas.toFixed(0)],
          itemStyle: { 
            color: '#6366F1', // Indigo 500
            borderRadius: [4, 4, 0, 0] 
          }
        }
      ]
    };
  }, [historyData]);

  return <BaseChart option={option} />;
};

export default ComparisonChart;
