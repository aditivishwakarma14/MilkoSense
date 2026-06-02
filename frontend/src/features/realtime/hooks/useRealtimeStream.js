import { useEffect, useState } from 'react';
import useSensorStore from '../../../app/store/sensorStore';
import useAlertStore from '../../../app/store/alertStore';
import realtimeService from '../services/realtimeService';
import useUiStore from '../../../app/store/uiStore';
import socketClient from '../../../services/socketClient';

const useRealtimeStream = () => {
  const setHistoryData = useSensorStore((state) => state.setHistoryData);
  const setLatestSensorData = useSensorStore((state) => state.setLatestSensorData);
  const setConnectionState = useSensorStore((state) => state.setConnectionState);
  const setAlerts = useAlertStore((state) => state.setAlerts);
  const addAlert = useAlertStore((state) => state.addAlert);
  const addToast = useUiStore((state) => state.addToast);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeTelemetry = async () => {
      try {
        setIsLoading(true);
        const history = await realtimeService.getTelemetryHistory();
        if (mounted) setHistoryData(history);
        
        const metrics = await realtimeService.getDashboardMetrics();
        if (mounted && metrics?.alerts) {
          setAlerts(metrics.alerts);
        }
      } catch (error) {
        console.error('[useRealtimeStream Boundary] Ingest failed:', error);
        if (mounted) addToast('Gateway offline. Displaying sandbox models.', 'warning');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeTelemetry();

    // Setup Socket Connection and Listeners
    socketClient.connect((state, error) => {
      if (mounted) {
        setConnectionState(state, error?.message);
        if (state === 'connected') {
          addToast('WebSocket link established', 'success');
        } else if (state === 'connect_error') {
          addToast('WebSocket connection failed', 'error');
        }
      }
    });

    socketClient.on('sensorData', (data) => {
      if (mounted) {
        setLatestSensorData(data);
      }
    });

    socketClient.on('alert', (alert) => {
      if (mounted) {
        addAlert(alert);
        addToast(alert.title, alert.severity === 'critical' ? 'error' : 'warning');
      }
    });

    return () => {
      mounted = false;
      socketClient.off('sensorData');
      socketClient.off('alert');
      // Intentionally not disconnecting socket here to allow cross-page persistence, 
      // or disconnect if we only want it on this page.
      socketClient.disconnect();
    };
  }, [setHistoryData, setLatestSensorData, setAlerts, addAlert, addToast, setConnectionState]);

  return { isLoading };
};

export default useRealtimeStream;
