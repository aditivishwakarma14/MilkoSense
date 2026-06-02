import { create } from 'zustand';
import storageService from '../../services/storageService';

const useSensorStore = create((set) => ({
  // Core states
  latestSensorData: storageService.get('latestSensorData', null),
  historyData: storageService.get('milkosense_history', []),
  connectionState: 'disconnected', // 'connected' | 'disconnected' | 'reconnecting' | 'error'
  connectionError: null,

  // Action: Receive new live sensor reading
  setLatestSensorData: (data) => {
    if (!data) return;

    set((state) => {
      // Buffer a maximum of 100 historical readings for real-time ECharts updates
      const updatedHistory = [...state.historyData, { ...data, timestamp: data.timestamp || new Date().toISOString() }];
      const trimmedHistory = updatedHistory.slice(-100);

      // Persist to local storage for survival over manual refreshes
      storageService.set('latestSensorData', data);
      storageService.set('milkosense_history', trimmedHistory);

      return {
        latestSensorData: data,
        historyData: trimmedHistory,
      };
    });
  },

  // Action: Set ECharts or HTTP REST loaded history array
  setHistoryData: (history) => {
    if (!Array.isArray(history)) return;
    storageService.set('milkosense_history', history);
    set({ historyData: history });
  },

  // Action: Update Socket.IO link connection status
  setConnectionState: (connectionState, error = null) => {
    set({ connectionState, connectionError: error });
  },

  // Action: Reset telemetry buffer
  clearHistory: () => {
    storageService.remove('latestSensorData');
    storageService.remove('milkosense_history');
    set({ latestSensorData: null, historyData: [] });
  }
}));

export default useSensorStore;
