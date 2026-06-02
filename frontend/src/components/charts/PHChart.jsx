import React, { useMemo } from 'react';
import useSensorStore from '../../app/store/sensorStore';
import BaseChart from './BaseChart';

const PHChart = () => {
  const historyData = useSensorStore((state) => state.historyData);

  const option = useMemo(() => {
    const timestamps = historyData.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const values = historyData.map(h => h.ph);

    return {
      title: {
        text: 'ACIDITY INDEX (pH)',
        textStyle: { color: '#F3F4F6', fontSize: 12, fontWeight: 'bold' },
        top: '2%',
        left: '2%',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      xAxis: {
        type: 'category',
        data: timestamps.length > 0 ? timestamps : ['00:00'],
        boundaryGap: false,
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 5.5,
        max: 7.5,
        splitLine: { lineStyle: { color: '#1F2937' } }
      },
      series: [
        {
          name: 'pH',
          type: 'line',
          data: values.length > 0 ? values : [6.6],
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: '#06B6D4' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(6,182,212,0.25)' },
                { offset: 1, color: 'rgba(6,182,212,0)' }
              ]
            }
          },
          // Draw horizontal target lines for optimal scale boundary triggers (6.4 - 6.8)
          markLine: {
            silent: true,
            lineStyle: { color: '#EF4444', type: 'dashed', opacity: 0.5 },
            data: [
              { yAxis: 6.4, name: 'Lower Limit' },
              { yAxis: 6.8, name: 'Upper Limit' }
            ]
          }
        }
      ]
    };
  }, [historyData]);

  return <BaseChart option={option} />;
};

export default PHChart;
