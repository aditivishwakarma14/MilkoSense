import React, { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import useUiStore from '../../app/store/uiStore';
import Loader from '../ui/Loader';

const BaseChart = ({ option, style = { height: '300px', width: '100%' }, loading = false }) => {
  const chartRef = useRef(null);
  const theme = useUiStore((state) => state.theme);

  // Auto-resize graph when window dimensions change
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const chartInstance = chartRef.current.getEchartsInstance();
        chartInstance.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Resize with delay to support sidebar slide animation durations
    const timer = setTimeout(handleResize, 350);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Set standard grid layout options
  const baseOption = {
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'Outfit, Inter, sans-serif',
      color: theme === 'dark' ? '#9CA3AF' : '#4B5563',
    },
    grid: {
      top: '15%',
      left: '4%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    },
    ...option,
  };

  if (loading) {
    return (
      <div style={style} className="flex items-center justify-center bg-gray-900 bg-opacity-30 border border-gray-800 rounded-2xl">
        <Loader message="Rendering graphic data..." />
      </div>
    );
  }

  return (
    <ReactECharts
      ref={chartRef}
      option={baseOption}
      style={style}
      theme={theme}
      notMerge={true} // Force chart state redraws rather than merges on high-speed feeds
      lazyUpdate={true}
    />
  );
};

export default BaseChart;
