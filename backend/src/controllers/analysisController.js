const aiService = require('../services/aiService');
const SensorReading = require('../models/SensorReading');
const AnalysisReport = require('../models/AnalysisReport');

const analyzeMilkQuality = async (req, res, next) => {
    try {
        let sensorData = req.body;

        // Fallback: If request is empty, grab the latest sensor reading from DB
        if (!sensorData || Object.keys(sensorData).length === 0) {
            const latestReading = await SensorReading.findOne().sort({ collectedAt: -1 });
            if (latestReading) {
                sensorData = latestReading.toObject();
            } else {
                // Rich default demo payload (covers all 3-pillar inputs)
                sensorData = {
                    sampleId: `MS-${new Date().toISOString().slice(0, 10)}-DEMO`,
                    collectedAt: new Date().toISOString(),
                    location: {
                        state: 'Maharashtra',
                        district: 'Pune',
                        lat: 18.5204,
                        lng: 73.8567
                    },
                    raw: {
                        pH: 6.6,
                        fat: 4.2,
                        SNF: 8.6,
                        protein: 3.3,
                        lactose: 4.8,
                        density: 1.030,
                        conductivity: 4.5,
                        refractiveIndex: 1.3425,
                        turbidity: 15.0,
                        temperature: 4.5,
                        color_L: 90.5,
                        color_a: -2.3,
                        color_b: 7.5,
                        spectralFingerprint: Array(200).fill(0).map(() => 0.5 + Math.random() * 0.2),
                        tvc_cfu_ml: 12000,
                        coliform_cfu_ml: 50,
                        yeastMold_cfu_ml: 200
                    }
                };
            }
        }

        // Run the full 3-pillar AI engine
        const evaluation = await aiService.analyzeSensorData(sensorData);

        // ── Persist the rich result to MongoDB ───────────────────────────────
        try {
            const report = new AnalysisReport({
                sensorReading:  null,   // on-demand analysis (not from ESP32 ingest)
                sensorSnapshot: evaluation.sensorReading,

                // Full 3-pillar nested results
                results:          evaluation.results,
                aiCopilot:        evaluation.aiCopilot,
                aiRecommendations:evaluation.aiRecommendations,
                regional:         evaluation.regional,

                // Backward-compat flat fields
                score:             evaluation.results?.quality?.score ?? null,
                qualityGrade:      { grade: evaluation.results?.quality?.grade },
                adulterationRisk:  {
                    detected:   evaluation.results?.adulteration?.overallRisk !== 'Low',
                    riskLevel:  evaluation.results?.adulteration?.overallRisk,
                    riskScore:  evaluation.results?.adulteration?.totalRiskValue,
                    risks: []
                },
                spoilagePrediction: {
                    hours:          evaluation.results?.freshness?.shelfLifeHours,
                    days:           Math.floor((evaluation.results?.freshness?.shelfLifeHours || 0) / 24),
                    riskLevel:      evaluation.results?.freshness?.status,
                    recommendation: 'Maintain cold chain at ≤4°C.'
                },
                timestamp: evaluation.timestamp ? new Date(evaluation.timestamp) : new Date()
            });
            await report.save();
        } catch (dbErr) {
            // Non-fatal — return result even if DB write fails
            console.warn('[AnalysisController] DB persist failed (non-fatal):', dbErr.message);
        }

        return res.status(200).json(evaluation);
    } catch (error) {
        console.error('[AnalysisController Check Error]', error);
        next(error);
    }
};

module.exports = { analyzeMilkQuality };
