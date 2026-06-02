import { create } from 'zustand';
import storageService from '../../services/storageService';

const useAnalyticsStore = create((set) => ({
  latestAnalysis: storageService.get('latestAnalysis', null),
  trendReport: storageService.get('trendReport', []),  // BUG-04 FIX: init as [] not null
  isAnalyzing: false,

  setLatestAnalysis: (analysis) => {
    if (!analysis) return;
    storageService.set('latestAnalysis', analysis);
    set({ latestAnalysis: analysis });
  },

  setTrendReport: (trendReport) => {
    if (!Array.isArray(trendReport)) return;
    storageService.set('trendReport', trendReport);
    set({ trendReport });
  },

  setAnalyzingState: (isAnalyzing) => {
    set({ isAnalyzing });
  },

  clearAnalytics: () => {
    storageService.remove('latestAnalysis');
    set({ latestAnalysis: null, trendReport: null });
  }
}));

export default useAnalyticsStore;
