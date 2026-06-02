import { create } from 'zustand';

const useAlertStore = create((set) => ({
  alerts: [],
  activeAlertsCount: 0,

  // Action: Set list loaded from Express reports API
  setAlerts: (alerts) => {
    if (!Array.isArray(alerts)) return;
    const activeAlertsCount = alerts.filter(a => !a.resolved).length;
    set({ alerts, activeAlertsCount });
  },

  // Action: Insert a real-time safety alarm from Socket.IO client stream
  addAlert: (alert) => {
    if (!alert) return;
    
    set((state) => {
      // Avoid duplicate alert tracking
      const exists = state.alerts.some(a => a._id === alert._id || (a.timestamp === alert.timestamp && a.score === alert.score));
      if (exists) return {};

      const updatedAlerts = [alert, ...state.alerts].slice(0, 50); // Keep last 50 alerts in memory
      const activeAlertsCount = updatedAlerts.filter(a => !a.resolved).length;
      
      return {
        alerts: updatedAlerts,
        activeAlertsCount,
      };
    });
  },

  // Action: Dismiss or resolve a specific alert log
  resolveAlert: (alertId) => {
    set((state) => {
      const updatedAlerts = state.alerts.map((a) =>
        a._id === alertId ? { ...a, resolved: true } : a
      );
      const activeAlertsCount = updatedAlerts.filter(a => !a.resolved).length;
      
      return {
        alerts: updatedAlerts,
        activeAlertsCount,
      };
    });
  },

  clearAlerts: () => {
    set({ alerts: [], activeAlertsCount: 0 });
  }
}));

export default useAlertStore;
