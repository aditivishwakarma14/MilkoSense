import React, { useMemo } from 'react';
import useSensorStore from '../../app/store/sensorStore';
import BaseChart from './BaseChart';

const TemperatureChart = () => {
  const historyData = useSensorStore((state) => state.historyData);

  const option = useMemo(() => {
    const timestamps = historyData.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const values = historyData.map(h => h.temperature);

    return {
      title: {
        text: 'THERMAL READINGS (°C)',
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
        min: 10,
        max: 35,
        splitLine: { lineStyle: { color: '#1F2937' } }
      },
      series: [
        {
          name: 'Temperature',
          type: 'line',
          data: values.length > 0 ? values : [20.0],
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: '#3B82F6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59,130,246,0.25)' },
                { offset: 1, color: 'rgba(59,130,246,0)' }
              ]
            }
          },
          markLine: {
            silent: true,
            lineStyle: { color: '#EF4444', type: 'dashed', opacity: 0.5 },
            data: [
              { yAxis: 15.0, name: 'Lower Bound' },
              { yAxis: 25.0, name: 'Upper Bound' }
            ]
          }
        }
      ]
    };
  }, [historyData]);

  return <BaseChart option={option} />;
};

export default TemperatureChart;
