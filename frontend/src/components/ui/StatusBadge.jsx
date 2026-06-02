import React from 'react';

const StatusBadge = ({ status }) => {
  const normalized = String(status).toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      case 'optimal':
      case 'normal':
      case 'safe':
      case 'connected':
        return {
          bg: 'bg-iot-green/10',
          text: 'text-iot-green',
          border: 'border-iot-green/25',
          dot: 'bg-iot-green shadow-[0_0_8px_#10B981]'
        };
      case 'warning':
      case 'moderate':
      case 'reconnecting':
        return {
          bg: 'bg-iot-yellow/10',
          text: 'text-iot-yellow',
          border: 'border-iot-yellow/25',
          dot: 'bg-iot-yellow shadow-[0_0_8px_#F59E0B]'
        };
      case 'critical':
      case 'high':
      case 'adulterated':
      case 'disconnected':
      case 'error':
        return {
          bg: 'bg-iot-red/10',
          text: 'text-iot-red',
          border: 'border-iot-red/25',
          dot: 'bg-iot-red shadow-[0_0_8px_#EF4444] animate-pulse'
        };
      default:
        return {
          bg: 'bg-iot-cyan/10',
          text: 'text-iot-cyan',
          border: 'border-iot-cyan/25',
          dot: 'bg-iot-cyan shadow-[0_0_8px_#06B6D4]'
        };
    }
  };

  const style = getStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
