import { useEffect } from 'react';
import socketClient from '../../services/socketClient';
import useSensorStore from '../store/sensorStore';
import useAnalyticsStore from '../store/analyticsStore';
import useAlertStore from '../store/alertStore';
import useUiStore from '../store/uiStore';

const SocketProvider = ({ children }) => {
  const setLatestSensorData = useSensorStore((state) => state.setLatestSensorData);
  const setConnectionState = useSensorStore((state) => state.setConnectionState);
  const setLatestAnalysis = useAnalyticsStore((state) => state.setLatestAnalysis);
  const addAlert = useAlertStore((state) => state.addAlert);
  const addToast = useUiStore((state) => state.addToast);

  useEffect(() => {
    // 1. Establish the connection channel
    socketClient.connect((state, details) => {
      setConnectionState(state, details);
      
      if (state === 'connected') {
        addToast('Telemetry stream online', 'success');
      } else if (state === 'reconnecting') {
        // ENH-06 FIX: Show visible toast so user knows socket is recovering
        addToast('⚡ Sensor stream interrupted — reconnecting...', 'warning');
      } else if (state === 'reconnect_failed') {
        addToast('WebSocket connection severed. Retrying...', 'error');
      } else if (state === 'disconnected') {
        addToast('Sensor stream disconnected', 'error');
      }
    });

    // 2. Register telemetry receiver
    socketClient.on('sensorData', (sensorData) => {
      // Stream raw readings to ECharts buffer and card gauges
      setLatestSensorData(sensorData);
      
      // If AI evaluation is attached, feed full 3-pillar shape to analytics layer
      if (sensorData.results || sensorData.score) {
        const analysis = {
          results:           sensorData.results,
          score:             sensorData.score,
          qualityGrade:      sensorData.qualityGrade,
          aiCopilot:         sensorData.aiCopilot,
          aiRecommendations: sensorData.aiRecommendations,
          timestamp:         sensorData.timestamp,
          sensorReading: {
            ph:          sensorData.ph,
            temperature: sensorData.temperature,
            tds:         sensorData.tds,
            turbidity:   sensorData.turbidity,
            gas:         sensorData.gas,
          }
        };
        setLatestAnalysis(analysis);
      }
    });

    // 3. Register substandard alarm receiver
    socketClient.on('alert', (alertPayload) => {
      addAlert(alertPayload);
      addToast(`⚠️ DANGER: ${alertPayload.message}`, 'error');
    });

    // 4. Cleanup socket connections and events on destruction to prevent memory leakage
    return () => {
      socketClient.off('sensorData');
      socketClient.off('alert');
      socketClient.disconnect();
    };
  }, [setLatestSensorData, setConnectionState, setLatestAnalysis, addAlert, addToast]);

  return <>{children}</>;
};

export default SocketProvider;
