import apiClient from '../../../services/apiClient';

const realtimeService = {
  // Pull rolling historical data to pre-populate ECharts graphs on mount
  async getTelemetryHistory() {
    try {
      const response = await apiClient.get('/api/sensors');
      // Backend returns array of raw telemetries
      return Array.isArray(response) ? response : response.readings || [];
    } catch (error) {
      console.warn('[Realtime Service] Failed to retrieve history, using sandbox models.');
      return [];
    }
  },

  // Ingest manual dashboard sensor payloads directly from the DOM UI
  async postSensorReading(readingPayload) {
    return apiClient.post('/api/sensors', readingPayload);
  },

  // Pull aggregated metrics
  async getDashboardMetrics() {
    try {
      return await apiClient.get('/api/realtime');
    } catch (error) {
      console.warn('[Realtime Service] Failed to fetch dynamic aggregations.');
      return null;
    }
  }
};

export default realtimeService;
