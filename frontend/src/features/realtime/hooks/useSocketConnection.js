import { useCallback } from 'react';
import useSensorStore from '../../../app/store/sensorStore';
import socketClient from '../../../services/socketClient';

const useSocketConnection = () => {
  const connectionState = useSensorStore((state) => state.connectionState);
  const connectionError = useSensorStore((state) => state.connectionError);

  const triggerReconnect = useCallback(() => {
    console.log('[useSocketConnection] Operator triggered manual connection reset.');
    socketClient.disconnect();
    socketClient.connect();
  }, []);

  return {
    connectionState,
    connectionError,
    triggerReconnect,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
  };
};

export default useSocketConnection;
