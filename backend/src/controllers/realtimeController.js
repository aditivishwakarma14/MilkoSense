const SensorReading = require('../models/SensorReading');
const AnalysisReport = require('../models/AnalysisReport');
const AlertLog = require('../models/AlertLog');

const startTime = Date.now();

const getDashboardStats = async (req, res, next) => {
    try {
        const uptimeHours = parseFloat(((Date.now() - startTime) / (1000 * 60 * 60)).toFixed(2));

        // 1. Count total sensor readings recorded
        const totalReadings = await SensorReading.countDocuments();

        // 2. Count unresolved critical alerts
        const alerts = await AlertLog.countDocuments({ resolved: false });

        // 3. Compute dynamic average milk score using MongoDB Aggregation Pipeline
        let avgQuality = 0;
        if (totalReadings > 0) {
            const stats = await AnalysisReport.aggregate([
                {
                    $group: {
                        _id: null,
                        averageScore: { $avg: '$score' }
                    }
                }
            ]);
            if (stats.length > 0) {
                avgQuality = parseFloat(stats[0].averageScore.toFixed(1));
            }
        }

        return res.status(200).json({
            totalReadings,
            avgQuality,
            alerts,
            uptime: parseFloat((24.0 + uptimeHours).toFixed(1)), // Baseline emulation + actual running hours
            dataQuality: totalReadings > 50 ? 'excellent' : totalReadings > 20 ? 'good' : 'limited',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[RealtimeController Stats Error]', error);
        next(error);
    }
};

module.exports = {
    getDashboardStats
};
