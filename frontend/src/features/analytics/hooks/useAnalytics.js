import { useEffect, useState } from 'react';
import useAnalyticsStore from '../../../app/store/analyticsStore';
import aiAnalysisService from '../services/aiAnalysisService';
import useUiStore from '../../../app/store/uiStore';

const useAnalytics = () => {
    const setTrendReport    = useAnalyticsStore((state) => state.setTrendReport);
    const setLatestAnalysis = useAnalyticsStore((state) => state.setLatestAnalysis);
    const addToast          = useUiStore((state) => state.addToast);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);

                // Fetch ledger (auto-runs fresh analysis if DB is empty)
                const ledger = await aiAnalysisService.getOrCreateLatestAnalysis();

                // Populate trend reports buffer
                setTrendReport(ledger);

                // Use the newest record as the active dashboard scoreboard
                if (ledger.length > 0) {
                    setLatestAnalysis(ledger[0]);
                }
            } catch (error) {
                console.error('[useAnalytics hook caught exception]:', error);
                addToast('Failed to fetch analytics from database.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [setTrendReport, setLatestAnalysis, addToast]);

    return { loading };
};

export default useAnalytics;
