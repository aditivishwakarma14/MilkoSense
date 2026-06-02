const SensorReading = require('../models/SensorReading');
const AnalysisReport = require('../models/AnalysisReport');
const AlertLog = require('../models/AlertLog');
const aiService = require('../services/aiService');
const socketHandler = require('../sockets');

// Ingest sensor readings (Directly from ESP32 or manual simulation UI)
const ingestSensorReading = async (req, res, next) => {
    try {
        const { ph, temperature, tds, turbidity, gas, cattleType, season } = req.body;

        // ── BUG-07 FIX: Basic numeric validation ─────────────────────────────
        const numFields = { ph, temperature, tds, turbidity, gas };
        for (const [key, val] of Object.entries(numFields)) {
            if (val === undefined || val === null || isNaN(Number(val))) {
                return res.status(400).json({ success: false, error: `Invalid sensor value for '${key}': must be a number` });
            }
        }
        if (Number(ph) < 0 || Number(ph) > 14) {
            return res.status(400).json({ success: false, error: `pH out of valid range (0–14): ${ph}` });
        }
        if (Number(temperature) < -10 || Number(temperature) > 80) {
            return res.status(400).json({ success: false, error: `Temperature out of valid range (-10 to 80°C): ${temperature}` });
        }

        // ── BUG-01 FIX: Match actual SensorReading schema shape ──────────────
        // Schema requires: sampleId (unique), collectedAt, location, raw{}
        const reading = new SensorReading({
            sampleId:    `MS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            collectedAt: new Date(),
            location:    { state: 'Maharashtra', district: 'Pune' },
            raw: {
                pH:          Number(ph),
                turbidity:   Number(turbidity),
                temperature: Number(temperature),
                tvc_cfu_ml:  Number(tds),    // TDS → microbial proxy
                conductivity: Number(gas),    // Gas → conductivity proxy
            }
        });
        await reading.save();

        // 2. Perform AI quality analysis
        const sensorDataForAI = {
            collectedAt: new Date().toISOString(),
            location: { state: "Maharashtra", district: "Pune" },
            raw: {
                pH: ph,
                temperature,
                turbidity,
                tvc_cfu_ml: tds,    // map TDS as proxy for microbial if no better field
                conductivity: gas,  // map gas sensor as proxy
                // Fill remaining with null so aiService handles validation:
                fat: null,
                SNF: null,
                protein: null,
                density: null,
                refractiveIndex: null,
                spectralFingerprint: null
            }
        };

        const evaluation = await aiService.analyzeSensorData(sensorDataForAI);

        const score = evaluation.results?.quality?.score ?? 0;
        const grade = evaluation.results?.quality?.grade ?? 'C Poor';

        // 3. Save AI evaluation report in MongoDB (full 3-pillar shape)
        const report = new AnalysisReport({
            sensorReading:     reading._id,
            sensorSnapshot:    evaluation.sensorReading,
            results:           evaluation.results,
            aiCopilot:         evaluation.aiCopilot,
            aiRecommendations: evaluation.aiRecommendations,
            regional:          evaluation.regional,
            // Backward-compat flat fields
            score:             score,
            qualityGrade:      { grade: grade },
            adulterationRisk:  {
                detected:  (evaluation.results?.adulteration?.overallRisk ?? 'Low') !== 'Low',
                riskLevel: evaluation.results?.adulteration?.overallRisk ?? 'Low',
                riskScore: evaluation.results?.adulteration?.totalRiskValue ?? 0,
                risks: []
            },
            spoilagePrediction:{
                hours:          evaluation.results?.freshness?.shelfLifeHours ?? 7,
                riskLevel:      evaluation.results?.freshness?.status ?? 'Low',
                recommendation: 'Maintain cold chain.'
            },
            recommendations: evaluation.recommendations ?? [],
            insights:        evaluation.insights ?? []
        });
        await report.save();

        // 4. Trigger Real-Time Socket.IO broadcasts
        // BUG-01 FIX: reading now stores data in raw{} — extract correctly
        const broadcastData = {
            _id:         reading._id,
            ph:          reading.raw.pH,
            temperature: reading.raw.temperature,
            tds:         reading.raw.tvc_cfu_ml,   // stored as proxy
            turbidity:   reading.raw.turbidity,
            gas:         reading.raw.conductivity,  // stored as proxy
            timestamp:   reading.collectedAt.toISOString(),
            qualityGrade: grade,
            score: score,
            // Full 3-pillar AI evaluation for live analytics dashboard
            results:           evaluation.results,
            aiCopilot:         evaluation.aiCopilot,
            aiRecommendations: evaluation.aiRecommendations
        };
        socketHandler.broadcastSensorUpdate(broadcastData);

        // 5. Check if score is sub-standard (<60) and log/emit alert
        if (score < 60) {
            const hasAdulteration = (evaluation.results?.adulteration?.overallRisk ?? 'Low') !== 'Low';
            const message = hasAdulteration 
                ? 'System detected adulterated milk quality parameters.'
                : 'System detected substandard milk quality parameters.';
            
            const severity = hasAdulteration ? 'critical' : 'high';

            // Save alarm log to MongoDB
            const alert = new AlertLog({
                title: hasAdulteration ? 'Milk Adulteration Alert!' : 'Quality Degradation Alert!',
                score: score,
                message,
                severity,
                adulteration: hasAdulteration
            });
            await alert.save();

            // Emit live websocket notification to all listeners
            socketHandler.broadcastAlert({
                _id: alert._id,
                title: alert.title,
                score: alert.score,
                message: alert.message,
                severity: alert.severity,
                adulteration: alert.adulteration,
                timestamp: alert.timestamp
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Sensor data ingested and graded successfully',
            reading: reading,
            analysis: evaluation
        });

    } catch (error) {
        console.error('[SensorsController Ingest Error]', error);
        next(error);
    }
};

// Retrieve the absolute latest sensor reading
const getLatestReadings = async (req, res, next) => {
    try {
        const latest = await SensorReading.findOne().sort({ timestamp: -1 });
        if (!latest) {
            return res.status(200).json({
                ph: 6.5,
                temperature: 24,
                tds: 450,
                turbidity: 12,
                gas: 125,
                timestamp: new Date().toISOString(),
                note: 'Default emulated baseline (No records found in database)'
            });
        }
        return res.status(200).json(latest);
    } catch (error) {
        console.error('[SensorsController Get Error]', error);
        next(error);
    }
};

module.exports = {
    ingestSensorReading,
    getLatestReadings
};
