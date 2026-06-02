const AnalysisReport = require('../models/AnalysisReport');
const SensorReading = require('../models/SensorReading');

// GET /api/reports — Returns full 3-pillar rich analysis records
const getReports = async (req, res, next) => {
    try {
        const reports = await AnalysisReport.find()
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        // Return the full nested shape; the frontend consumes results, aiCopilot, etc.
        const formattedReports = reports.map(r => ({
            id:               r._id,
            timestamp:        r.timestamp,
            generatedAt:      new Date(r.timestamp).toLocaleString(),

            // ── Full 3-Pillar AI data ──────────────────────────────────────────
            results:          r.results          ?? null,
            aiCopilot:        r.aiCopilot        ?? null,
            aiRecommendations:r.aiRecommendations ?? null,
            regional:         r.regional         ?? null,
            sensorReading:    r.sensorSnapshot   ?? null,

            // ── Flat compat fields ─────────────────────────────────────────────
            score:             r.score,
            qualityGrade:      r.qualityGrade,
            adulterationRisk:  r.adulterationRisk,
            spoilagePrediction:r.spoilagePrediction,
            recommendations:   r.recommendations ?? [],
            insights:          r.insights        ?? []
        }));

        return res.status(200).json(formattedReports);
    } catch (error) {
        console.error('[ReportsController GET Error]', error);
        next(error);
    }
};

// POST /api/reports — Backward-compat manual report creation
const createReport = async (req, res, next) => {
    try {
        const reportData = req.body;

        let readingId = reportData.sensorReading || reportData.readingId;
        if (!readingId) {
            const reading = new SensorReading({
                sampleId:    `MS-MANUAL-${Date.now()}`,
                collectedAt: new Date(),
                raw: {
                    pH:          reportData.ph          || 6.5,
                    temperature: reportData.temperature || 24,
                    turbidity:   reportData.turbidity   || 12,
                    tvc_cfu_ml:  reportData.tds         || 450
                }
            });
            await reading.save();
            readingId = reading._id;
        }

        const report = new AnalysisReport({
            sensorReading:     readingId,
            score:             reportData.score             || 75,
            qualityGrade:      reportData.qualityGrade      || {},
            adulterationRisk:  reportData.adulterationRisk  || {},
            spoilagePrediction:reportData.spoilagePrediction || {},
            recommendations:   reportData.recommendations   || [],
            insights:          reportData.insights          || []
        });
        await report.save();

        return res.status(201).json({
            success: true,
            message: 'Report archived in MongoDB',
            report
        });
    } catch (error) {
        console.error('[ReportsController POST Error]', error);
        next(error);
    }
};

module.exports = { getReports, createReport };
