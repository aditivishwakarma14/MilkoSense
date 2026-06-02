import React, { useMemo } from 'react';
import useSensorStore from '../../app/store/sensorStore';
import BaseChart from './BaseChart';

const TDSChart = () => {
  const historyData = useSensorStore((state) => state.historyData);

  const option = useMemo(() => {
    const timestamps = historyData.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const values = historyData.map(h => h.tds);

    return {
      title: {
        text: 'TOTAL DISSOLVED SOLIDS (TDS)',
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
        min: 500,
        max: 1500,
        splitLine: { lineStyle: { color: '#1F2937' } }
      },
      series: [
        {
          name: 'TDS',
          type: 'line',
          data: values.length > 0 ? values : [950],
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: '#F59E0B' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245,158,11,0.25)' },
                { offset: 1, color: 'rgba(245,158,11,0)' }
              ]
            }
          },
          markLine: {
            silent: true,
            lineStyle: { color: '#EF4444', type: 'dashed', opacity: 0.5 },
            data: [
              { yAxis: 800, name: 'Lower Bound' },
              { yAxis: 1200, name: 'Upper Bound' }
            ]
          }
        }
      ]
    };
  }, [historyData]);

  return <BaseChart option={option} />;
};

export default TDSChart;
