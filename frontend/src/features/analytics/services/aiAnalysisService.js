import apiClient from '../../../services/apiClient';

const aiAnalysisService = {
    /**
     * POST /api/analysis
     * Runs the full 3-pillar AI engine and persists the result.
     * Returns the complete evaluation object.
     */
    async assessMilkPurity(sensorData = {}) {
        try {
            return await apiClient.post('/api/analysis', sensorData);
        } catch (error) {
            console.error('[AI Analysis Service] Assessment query failed:', error);
            throw error;
        }
    },

    /**
     * GET /api/reports
     * Returns historical analysis records from MongoDB (newest first).
     * Each record contains the full nested results / aiCopilot / aiRecommendations.
     */
    async getPurityLedger() {
        try {
            const ledger = await apiClient.get('/api/reports');
            return Array.isArray(ledger) ? ledger : [];
        } catch (error) {
            console.warn('[AI Analysis Service] Failed to retrieve historical ledger records.');
            return [];
        }
    },

    /**
     * Convenience: Fetch ledger. If empty, run an on-demand analysis first so
     * the dashboard always has real data to display.
     */
    async getOrCreateLatestAnalysis() {
        let ledger = await this.getPurityLedger();

        if (ledger.length === 0) {
            // No history yet — trigger a fresh analysis with default demo payload
            try {
                const freshResult = await this.assessMilkPurity({});
                // Normalise to ledger-record shape
                ledger = [{
                    id:               freshResult.timestamp,
                    timestamp:        freshResult.timestamp,
                    generatedAt:      new Date(freshResult.timestamp).toLocaleString(),
                    results:          freshResult.results,
                    aiCopilot:        freshResult.aiCopilot,
                    aiRecommendations:freshResult.aiRecommendations,
                    regional:         freshResult.regional,
                    sensorReading:    freshResult.sensorReading,
                    score:            freshResult.results?.quality?.score
                }];
            } catch (err) {
                console.error('[AI Analysis Service] On-demand bootstrap failed:', err);
            }
        }

        return ledger;
    }
};

export default aiAnalysisService;
