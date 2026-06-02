import { useState, useEffect, useRef } from 'react';
import useSensorStore from '../../../app/store/sensorStore';

const useTelemetryBuffer = (throttleMs = 500) => {
  const latestSensorData = useSensorStore((state) => state.latestSensorData);
  const [bufferedData, setBufferedData] = useState(null);
  const bufferRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // 1. Ingest physical telemetries into intermediate reference buffer
    bufferRef.current = latestSensorData;

    // 2. Set up throttle interval to batch updates into React local state
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        if (bufferRef.current) {
          setBufferedData(bufferRef.current);
          bufferRef.current = null; // Clear intermediate buffer
        }
      }, throttleMs);
    }

    // 3. Clear timers on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [latestSensorData, throttleMs]);

  return bufferedData || latestSensorData; // Returns buffered or direct latest value fallback
};

export default useTelemetryBuffer;
