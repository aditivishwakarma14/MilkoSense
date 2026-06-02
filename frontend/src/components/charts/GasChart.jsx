import React, { useMemo } from 'react';
import useSensorStore from '../../app/store/sensorStore';
import BaseChart from './BaseChart';

const GasChart = () => {
  const historyData = useSensorStore((state) => state.historyData);

  const option = useMemo(() => {
    const timestamps = historyData.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const values = historyData.map(h => h.gas);

    return {
      title: {
        text: 'METHANE / SPOILAGE GAS EMISSION',
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
        min: 50,
        max: 300,
        splitLine: { lineStyle: { color: '#1F2937' } }
      },
      series: [
        {
          name: 'Gas Level',
          type: 'line',
          data: values.length > 0 ? values : [110],
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: '#6366F1' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99,102,241,0.25)' },
                { offset: 1, color: 'rgba(99,102,241,0)' }
              ]
            }
          },
          markLine: {
            silent: true,
            lineStyle: { color: '#EF4444', type: 'dashed', opacity: 0.5 },
            data: [
              { yAxis: 150, name: 'Methane Danger Threshold' }
            ]
          }
        }
      ]
    };
  }, [historyData]);

  return <BaseChart option={option} />;
};

export default GasChart;
