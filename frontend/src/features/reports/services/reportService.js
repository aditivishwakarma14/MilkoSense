import apiClient from '../../../services/apiClient';

const reportService = {
  // Query historical database report lists with custom filter parameters
  async queryReports(params = {}) {
    try {
      // Passes timeframe, cattleType, and pagination to Express controllers
      return await apiClient.get('/api/reports', { params });
    } catch (error) {
      console.error('[Report Service Error] Failed to retrieve logs:', error);
      throw error;
    }
  }
};

export default reportService;
