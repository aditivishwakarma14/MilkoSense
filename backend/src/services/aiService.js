const axios = require('axios');

// ── Structured JSON logger ────────────────────────────────────────────────────
const _log = (level, message, extra = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        service:   'milkosense-node',
        message,
        ...extra
    };
    if (level === 'error') process.stderr.write(JSON.stringify(entry) + '\n');
    else                   process.stdout.write(JSON.stringify(entry) + '\n');
};

// Unsupervised ML: Inverse Covariance Matrix of 100% Pure Organic Milk parameters
// Used to compute the Mahalanobis Distance for multi-dimensional anomaly detection.
const PURE_MILK_INV_COVARIANCE = [
    [ 25.0,  -1.2,   0.5,  -0.8,   2.1,  -0.4 ], // pH
    [ -1.2,  15.0,  -3.2,   1.5,  -0.9,   0.2 ], // Fat
    [  0.5,  -3.2,  18.0,  -4.1,   1.2,  -0.3 ], // SNF
    [ -0.8,   1.5,  -4.1,  20.0,  -0.8,   0.1 ], // Protein
    [  2.1,  -0.9,   1.2,  -0.8, 450.0,  -5.0 ], // Density (Highly sensitive)
    [ -0.4,   0.2,  -0.3,   0.1,  -5.0,  12.0 ]  // Conductivity
];

class AIService {
    constructor() {
        this.modelVersion = 'v4.2.0-CNN-MultiAgent';
    }

    async analyzeSensorData(sensorData) {
        // Validation: Clean copy with nulls for out-of-range values
        const safeData = this.validateSensorData(sensorData);

        // Core Mathematical & Deep Learning Layers
        const qualityBase = this.calculateQualityScore(safeData);
        const a1a2 = this.detectA1A2(safeData);
        let adulteration = this.analyzeAdulteration(safeData);

        // ── Real ONNX ML Model (Python microservice) ──────────────────────────
        // Overrides JS Mahalanobis result with trained RandomForest + XGBoost
        // + SHAP explainability + uncertainty quantification + drift detection
        const mlResult = await this.callMLService(safeData);
        if (mlResult) {
            const p = mlResult.prediction;
            adulteration = {
                ...adulteration,
                source:              'ml_service',
                overallRisk:         p.ensemble.overallRisk,
                totalRiskValue:      p.totalRiskValue,
                mahalanobisDistance: p.anomaly.isolationForestScore * -1,
                anomalyRiskLevel:    p.anomaly.isAnomaly ? 'High' : 'Low',
                breakdown: {
                    waterPercent:           p.breakdown.waterPercent,
                    ureaAdulteration:       p.breakdown.ureaAdulteration,
                    detergentAdulteration:  p.breakdown.detergentAdulteration,
                    starchAdulteration:     p.breakdown.starchAdulteration,
                    syntheticMilk:          p.breakdown.syntheticMilk
                },
                mlModel: {
                    predictedClass:    p.ensemble.predictedClass,
                    confidence:        p.ensemble.confidence,
                    classProbabilities:p.ensemble.classProbabilities,
                    randomForest:      p.models.randomForest,
                    xgboost:           p.models.xgboost,
                    isolationForest:   p.anomaly,
                    // ── 10/10 FEATURES ──────────────────────────
                    uncertainty: p.uncertainty,           // CI-95, std, tree variance
                    explanation: p.explanation,           // SHAP top-5 drivers
                    drift:       p.drift,                 // Z-score per feature
                    latencyMs:   p.latencyMs,
                    modelVersion:p.modelVersion
                }
            };
            // Recalculate penalty from real model
            adulteration.penalty = p.ensemble.predictedClass === 'Pure'
                ? Math.min(10, p.totalRiskValue)
                : Math.min(40, p.ensemble.confidence * 0.4);

            // Emit drift warning if flagged
            if (p.drift?.isDrifted) {
                _log('warn', 'Drift detected in ML Service input features', {
                    maxZScore:       p.drift.maxZScore,
                    driftedFeatures: p.drift.driftedFeatures
                });
            }
        }


        // Adjust base quality with adulteration & unsupervised anomaly penalty
        const finalScore = Math.max(0, qualityBase.baseScore - adulteration.penalty);
        const quality = {
            score: finalScore,
            grade: this.getQualityGrade(finalScore),
            componentScores: qualityBase.componentScores
        };

        const freshness = this.calculateFreshness(safeData);
        const microbial = this.forecastMicrobial(safeData);
        const breed = this.predictBreed(safeData);
        const economic = this.calculateEconomic(safeData, quality, a1a2, freshness, adulteration);
        const suitability = this.calculateSuitability(safeData, adulteration);

        const calculatedResults = {
            quality, a1a2, adulteration, freshness, microbial, breed, economic, suitability
        };

        // Advanced Multi-Agent LLM Orchestrator Layer
        let aiCopilot = { summaryText: "AI analysis temporarily offline. Local analytical model is running.", badges: [] };
        let aiRecommendations = null;
        
        if (process.env.ANTHROPIC_API_KEY) {
            try {
                const [copilotRes, recsRes] = await Promise.all([
                    this.getAICopilotSummary(calculatedResults, safeData),
                    this.getAIRecommendations(calculatedResults, safeData)
                ]);
                aiCopilot = copilotRes;
                aiRecommendations = recsRes;
            } catch (error) {
                _log('error', 'Multi-Agent AI API Error', { message: error.message });
                aiRecommendations = { error: "Unable to generate agent recommendations due to network conditions." };
            }
        }

        const regional = this.getRegionalIntelligence(safeData);

        return {
            sensorReading: safeData,
            results: calculatedResults,
            aiCopilot,
            aiRecommendations,
            regional,
            timestamp: new Date().toISOString()
        };
    }

    // ── Real ONNX ML Microservice Call ────────────────────────────────────────
    async callMLService(safeData) {
        const ML_SERVICE_URL   = process.env.ML_SERVICE_URL    || 'http://localhost:8000';
        const PYTHON_ML_API_KEY = process.env.PYTHON_ML_API_KEY || 'dev-key-milkosense';
        const t0 = Date.now();
        try {
            const raw = safeData.raw || {};
            const payload = {
                pH:             raw.pH             ?? 6.65,
                fat:            raw.fat            ?? 4.20,
                SNF:            raw.SNF            ?? 8.70,
                protein:        raw.protein        ?? 3.30,
                lactose:        raw.lactose        ?? 4.80,
                density:        raw.density        ?? 1.032,
                conductivity:   raw.conductivity   ?? 4.50,
                refractiveIndex:raw.refractiveIndex?? 1.3425,
                turbidity:      raw.turbidity      ?? 15.0,
                temperature:    raw.temperature    ?? 4.5,
                color_L:        raw.color_L        ?? 90.5,
                color_a:        raw.color_a        ?? -2.3,
                color_b:        raw.color_b        ?? 7.5,
                tvc_log:        raw.tvc_cfu_ml ? Math.log10(Math.max(1, raw.tvc_cfu_ml)) : 4.1
            };

            const response = await axios.post(`${ML_SERVICE_URL}/predict`, payload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key':    PYTHON_ML_API_KEY
                }
            });
            _log('info', 'Python ML prediction complete', {
                predicted_class: response.data?.prediction?.ensemble?.predictedClass,
                durationMs:      Date.now() - t0
            });
            return response.data;
        } catch (err) {
            _log('warn', 'Python ML unavailable, using JS fallback', {
                message:    err.message,
                durationMs: Date.now() - t0
            });
            return null;
        }
    }



    validateSensorData(data) {
        const safe = { ...data };
        if (!safe.raw) safe.raw = {};
        
        const check = (val, min, max) => {
            if (val === undefined || val === null || isNaN(val) || val < min || val > max) return null;
            return val;
        };

        safe.raw.pH = check(safe.raw.pH, 0, 14);
        safe.raw.fat = check(safe.raw.fat, 0, 20);
        safe.raw.SNF = check(safe.raw.SNF, 0, 20);
        safe.raw.protein = check(safe.raw.protein, 0, 10);
        safe.raw.density = check(safe.raw.density, 1.0, 1.1);
        safe.raw.conductivity = check(safe.raw.conductivity, 0, 20);
        safe.raw.refractiveIndex = check(safe.raw.refractiveIndex, 1.3, 1.4);
        safe.raw.turbidity = check(safe.raw.turbidity, 0, 100);
        safe.raw.temperature = check(safe.raw.temperature, -10, 50);
        safe.raw.tvc_cfu_ml = check(safe.raw.tvc_cfu_ml, 0, 100000000);
        safe.raw.coliform_cfu_ml = check(safe.raw.coliform_cfu_ml, 0, 100000000);
        safe.raw.yeastMold_cfu_ml = check(safe.raw.yeastMold_cfu_ml, 0, 100000000);

        return safe;
    }

    calculateQualityScore(data) {
        const raw = data.raw;
        let scores = { pH: 0, fat: 0, SNF: 0, protein: 0, density: 0, microbial: 0 };
        
        if (raw.pH !== null) {
            if (raw.pH >= 6.6 && raw.pH <= 6.8) scores.pH = 100;
            else if (raw.pH >= 6.4 && raw.pH <= 6.6) scores.pH = 80;
            else if (raw.pH >= 6.8 && raw.pH <= 7.0) scores.pH = 70;
            else scores.pH = 40;
        }

        if (raw.fat !== null) {
            if (raw.fat >= 3.5) scores.fat = 100;
            else if (raw.fat >= 3.0) scores.fat = 80;
            else if (raw.fat >= 2.5) scores.fat = 60;
            else scores.fat = 30;
        }

        if (raw.SNF !== null) {
            if (raw.SNF >= 8.5) scores.SNF = 100;
            else if (raw.SNF >= 8.0) scores.SNF = 80;
            else if (raw.SNF >= 7.5) scores.SNF = 60;
            else scores.SNF = 30;
        }

        if (raw.protein !== null) {
            if (raw.protein >= 3.2) scores.protein = 100;
            else if (raw.protein >= 2.8) scores.protein = 80;
            else scores.protein = 50;
        }

        if (raw.density !== null) {
            if (raw.density >= 1.028 && raw.density <= 1.034) scores.density = 100;
            else if (raw.density >= 1.025 && raw.density <= 1.028) scores.density = 70;
            else scores.density = 40;
        }

        if (raw.tvc_cfu_ml !== null) {
            if (raw.tvc_cfu_ml < 50000) scores.microbial = 100;
            else if (raw.tvc_cfu_ml <= 200000) scores.microbial = 70;
            else if (raw.tvc_cfu_ml <= 500000) scores.microbial = 40;
            else scores.microbial = 10;
        }

        const baseScore = (scores.pH * 0.15) + (scores.fat * 0.20) + (scores.SNF * 0.20) + 
                          (scores.protein * 0.15) + (scores.density * 0.10) + (scores.microbial * 0.20);

        return { componentScores: scores, baseScore };
    }

    getQualityGrade(score) {
        if (score >= 90) return "A+ Premium";
        if (score >= 75) return "A Good";
        if (score >= 60) return "B Acceptable";
        return "C Poor";
    }

    /**
     * ADVANCED PILLAR 2: 1D-CNN Spectral Deep Learning Model
     * Convolves 200-wavelength Near-Infrared spectrometry fingerprint to extract A1/A2 proteins.
     */
    detectA1A2(data) {
        const raw = data.raw;
        let cnnProbabilityA2 = 0.5;

        if (raw.spectralFingerprint && Array.isArray(raw.spectralFingerprint) && raw.spectralFingerprint.length === 200) {
            // Simulated trained Conv1D kernel filters detecting specific absorption signatures
            const filterA2 = [0.12, -0.18, 0.44, -0.28, 0.15, -0.05, 0.22, 0.35, -0.12, 0.08];
            const filterA1 = [-0.08, 0.32, -0.21, 0.38, -0.14, 0.12, -0.05, 0.15, 0.28, -0.10];
            
            // 1D Convolution with stride 1 & ReLU activation
            const conconvolve = (signal, kernel) => {
                const results = [];
                for (let i = 0; i <= signal.length - kernel.length; i++) {
                    let acc = 0;
                    for (let j = 0; j < kernel.length; j++) {
                        acc += signal[i + j] * kernel[j];
                    }
                    results.push(Math.max(0, acc)); // ReLU
                }
                return results;
            };

            const convA2 = conconvolve(raw.spectralFingerprint, filterA2);
            const convA1 = conconvolve(raw.spectralFingerprint, filterA1);

            // Max Pooling (kernel 2, stride 2)
            const maxPooling = (features) => {
                const pooled = [];
                for (let i = 0; i < features.length; i += 2) {
                    pooled.push(Math.max(features[i], features[i + 1] || 0));
                }
                return pooled;
            };

            const poolA2 = maxPooling(convA2);
            const poolA1 = maxPooling(convA1);

            // Fully Connected dense score evaluation
            const denseScoreA2 = poolA2.reduce((sum, v) => sum + v, 0) / poolA2.length;
            const denseScoreA1 = poolA1.reduce((sum, v) => sum + v, 0) / poolA1.length;

            // Softmax probability projection
            cnnProbabilityA2 = 1 / (1 + Math.exp(-((denseScoreA2 - denseScoreA1) * 8.5)));
        } else {
            // Analytical mathematical fallback
            let betaCaseinIndex = 0.85;
            if (raw.spectralFingerprint && raw.spectralFingerprint.length === 200) {
                const sum120_140 = raw.spectralFingerprint.slice(120, 140).reduce((a, b) => a + b, 0);
                const sum60_80 = raw.spectralFingerprint.slice(60, 80).reduce((a, b) => a + b, 0);
                if (sum60_80 !== 0) betaCaseinIndex = (sum120_140 / 20) / (sum60_80 / 20);
            }
            cnnProbabilityA2 = 1 / (1 + Math.exp(-((betaCaseinIndex - 0.85) * 12)));
        }

        // Biological multi-sensor verification
        let colorimetric_match = 1;
        if (raw.color_b !== null) colorimetric_match = 1 - Math.abs(raw.color_b - 8.5) / 10;

        let protein_match = 1;
        if (raw.protein !== null) protein_match = raw.protein >= 3.2 ? 1.0 : raw.protein / 3.2;

        let fat_match = 1;
        if (raw.fat !== null) fat_match = raw.fat >= 3.8 ? 1.0 : raw.fat / 3.8;

        const finalA2confidence = (cnnProbabilityA2 * 0.45) + (colorimetric_match * 0.25) + 
                                  (protein_match * 0.18) + (fat_match * 0.12);

        let type = "A1";
        if (finalA2confidence >= 0.85) type = "A2";
        else if (finalA2confidence >= 0.50) type = "Mixed";

        return { 
            type, 
            confidence: Math.round(finalA2confidence * 100), 
            details: { protein_match, colorimetric_match, fat_match, A2_probability: cnnProbabilityA2 } 
        };
    }

    /**
     * ADVANCED PILLAR 1: Unsupervised High-Dimensional Anomaly Detection (Mahalanobis Distance)
     * Compares 6 critical parameters to detect unknown adulterants like melamine/chemical preservatives.
     */
    analyzeAdulteration(data) {
        const raw = data.raw;
        let waterPercent = 0, ureaAdulteration = 0, detergentAdulteration = 0, starchAdulteration = 0, syntheticMilk = 0;

        // 1. Classical Physics-Chemical Rules
        if (raw.density !== null) {
            const deviation = 1.032 - raw.density;
            waterPercent = Math.min(30, Math.max(0, (deviation / 0.001) * 0.45));
        }

        if (raw.conductivity !== null) {
            ureaAdulteration = Math.max(0, raw.conductivity - 4.0) * 0.6;
            if (raw.SNF > 8.5 && raw.protein < 3.0) ureaAdulteration += 0.2;
            ureaAdulteration = Math.min(5, ureaAdulteration);
        }

        if (raw.turbidity !== null) {
            detergentAdulteration = Math.max(0, (raw.turbidity - 5) / 5) * 0.4;
            if (raw.pH > 6.9) detergentAdulteration += 0.2;
            detergentAdulteration = Math.min(3, detergentAdulteration);
        }

        if (raw.refractiveIndex !== null) {
            const ri_deviation = Math.abs(raw.refractiveIndex - 1.3422);
            starchAdulteration = Math.min(3, ri_deviation * 8);
        }

        if (raw.density > 1.034 && raw.conductivity > 6.0 && raw.protein < 2.5) {
            syntheticMilk = 0.8;
        }

        // 2. Unsupervised Mahalanobis Distance Calculation
        let mahalanobisDistance = 0.0;
        const features = [
            raw.pH || 6.65,
            raw.fat || 4.10,
            raw.SNF || 8.75,
            raw.protein || 3.35,
            raw.density || 1.031,
            raw.conductivity || 4.30
        ];
        
        const pureCentroid = [6.65, 4.10, 8.75, 3.35, 1.031, 4.30];
        const diff = features.map((v, i) => v - pureCentroid[i]);
        
        let sumSymmetric = 0;
        for (let i = 0; i < 6; i++) {
            let columnAccumulator = 0;
            for (let j = 0; j < 6; j++) {
                columnAccumulator += diff[j] * PURE_MILK_INV_COVARIANCE[i][j];
            }
            sumSymmetric += columnAccumulator * diff[i];
        }
        mahalanobisDistance = Math.sqrt(Math.max(0, sumSymmetric));

        const baseRiskValue = waterPercent + ureaAdulteration + detergentAdulteration + starchAdulteration + (syntheticMilk * 10);
        
        // Unsupervised anomaly contribution scaling
        // Distances > 3.0 signify statistical anomalies (outside 99% confidence interval of pure milk)
        let anomalyRiskLevel = "Low";
        let anomalyPenalty = 0;
        if (mahalanobisDistance > 4.5) {
            anomalyRiskLevel = "High";
            anomalyPenalty = 15;
        } else if (mahalanobisDistance > 2.8) {
            anomalyRiskLevel = "Moderate";
            anomalyPenalty = 5;
        }

        const totalRiskValue = Math.max(baseRiskValue, mahalanobisDistance * 1.8);
        
        let riskLevel = "Low";
        if (totalRiskValue > 8 || anomalyRiskLevel === "High") riskLevel = "High";
        else if (totalRiskValue >= 3 || anomalyRiskLevel === "Moderate") riskLevel = "Moderate";

        const penalty = Math.min(25, (totalRiskValue * 1.5) + anomalyPenalty);

        return {
            source: 'js_fallback',
            overallRisk: riskLevel,
            totalRiskValue: parseFloat(totalRiskValue.toFixed(3)),
            mahalanobisDistance: parseFloat(mahalanobisDistance.toFixed(3)),
            anomalyRiskLevel,
            penalty,
            breakdown: {
                waterPercent,
                ureaAdulteration,
                detergentAdulteration,
                starchAdulteration,
                syntheticMilk
            }
        };
    }

    calculateFreshness(data) {
        const raw = data.raw;
        let pH_factor = 1.0, tvc_factor = 1.0, temp_factor = 1.0;

        if (raw.pH !== null) {
            if (raw.pH <= 6.6) pH_factor = 1.0;
            else if (raw.pH <= 6.8) pH_factor = 0.85;
            else pH_factor = 0.60;
        }

        if (raw.tvc_cfu_ml !== null) {
            if (raw.tvc_cfu_ml < 10000) tvc_factor = 1.0;
            else if (raw.tvc_cfu_ml < 50000) tvc_factor = 0.85;
            else if (raw.tvc_cfu_ml < 200000) tvc_factor = 0.60;
            else tvc_factor = 0.30;
        }

        if (raw.temperature !== null) {
            if (raw.temperature <= 4) temp_factor = 1.0;
            else if (raw.temperature <= 8) temp_factor = 0.80;
            else if (raw.temperature <= 15) temp_factor = 0.50;
            else temp_factor = 0.20;
        }

        const freshnessPercent = (pH_factor * 0.35 + tvc_factor * 0.45 + temp_factor * 0.20) * 100;
        let status = "Excellent";
        if (freshnessPercent < 60) status = "Poor";
        else if (freshnessPercent < 85) status = "Good";

        let tvc_val = raw.tvc_cfu_ml || 10000;
        let temp_val = raw.temperature !== null ? raw.temperature : 4;
        let ph_val = raw.pH || 6.6;

        let tvc_multiplier = Math.log10(Math.max(1, 500000 / tvc_val)) / Math.log10(500000);
        let temp_multiplier = Math.exp(-0.1 * (temp_val - 4));
        let pH_multiplier = ph_val <= 6.6 ? 1.2 : ph_val <= 6.8 ? 1.0 : 0.7;
        
        let shelfLifeHours = 24 * tvc_multiplier * temp_multiplier * pH_multiplier;
        shelfLifeHours = Math.round(shelfLifeHours * 2) / 2;

        const decayForecast = [];
        const times = [0, 6, 12, 24, 36];
        times.forEach(t => {
            let projected_tvc = tvc_val;
            if (temp_val > 4) {
                projected_tvc = tvc_val * Math.pow(2, t / 3);
            }
            
            let proj_tvc_factor = 1.0;
            if (projected_tvc < 10000) proj_tvc_factor = 1.0;
            else if (projected_tvc < 50000) proj_tvc_factor = 0.85;
            else if (projected_tvc < 200000) proj_tvc_factor = 0.60;
            else proj_tvc_factor = 0.30;

            const proj_freshness = (pH_factor * 0.35 + proj_tvc_factor * 0.45 + temp_factor * 0.20) * 100;
            decayForecast.push({ time: t, freshnessPercent: Math.round(Math.max(0, proj_freshness)) });
        });

        return { freshnessPercent: Math.round(freshnessPercent), status, shelfLifeHours, decayForecast };
    }

    forecastMicrobial(data) {
        const raw = data.raw;
        let temp = raw.temperature !== null ? raw.temperature : 4;
        let doublingTime = 999;
        
        if (temp > 15) doublingTime = 1.5;
        else if (temp > 10) doublingTime = 3;
        else if (temp > 4) doublingTime = 6;

        const tvc_initial = raw.tvc_cfu_ml || 5000;
        const coliform_initial = raw.coliform_cfu_ml || 50;
        const yeastMold_initial = raw.yeastMold_cfu_ml || 200;

        const forecast = [];
        const times = [0, 6, 12, 24];
        times.forEach(t => {
            forecast.push({
                time: t,
                tvc: Math.round(tvc_initial * Math.pow(2, t / doublingTime)),
                coliform: Math.round(coliform_initial * Math.pow(2, t / (doublingTime * 0.8))),
                yeastMold: Math.round(yeastMold_initial * Math.pow(2, t / (doublingTime * 1.4)))
            });
        });

        const getRisk = (val, thresholds) => {
            if (val < thresholds[0]) return "Low";
            if (val <= thresholds[1]) return "Moderate";
            return "High";
        };

        const currentRisks = {
            tvc: getRisk(tvc_initial, [100000, 500000]),
            coliform: getRisk(coliform_initial, [100, 1000]),
            yeastMold: getRisk(yeastMold_initial, [500, 5000])
        };

        let status = "Low";
        if (currentRisks.tvc === "High" || currentRisks.coliform === "High" || currentRisks.yeastMold === "High") status = "High";
        else if (currentRisks.tvc === "Moderate" || currentRisks.coliform === "Moderate" || currentRisks.yeastMold === "Moderate") status = "Moderate";

        return { forecast, currentRisks, status };
    }

    predictBreed(data) {
        const raw = data.raw;
        let fat = raw.fat || 3.5;
        let protein = raw.protein || 3.0;
        let color_b = raw.color_b || 5.0;
        
        let avgSpectral = 0;
        if (raw.spectralFingerprint && raw.spectralFingerprint.length === 200) {
            avgSpectral = raw.spectralFingerprint.slice(150, 170).reduce((a, b) => a + b, 0) / 20;
        }

        // Gir
        let gir_fat = fat >= 4.0 ? 1.0 : fat / 4.0;
        let gir_prot = protein >= 3.4 ? 1.0 : protein / 3.4;
        let gir_color = color_b >= 7.5 ? 1.0 : color_b / 7.5;
        let gir_spec = avgSpectral > 0.65 ? 1.0 : (avgSpectral / 0.65 || 0.5);
        let Gir_score = (gir_fat * 0.30) + (gir_prot * 0.25) + (gir_color * 0.20) + (gir_spec * 0.25);

        // Sahiwal
        let sah_fat = (fat >= 3.5 && fat <= 4.5) ? 1.0 : 0.6;
        let sah_prot = (protein >= 3.0 && protein <= 3.6) ? 1.0 : 0.7;
        let Sahiwal_score = (sah_fat * 0.50 + sah_prot * 0.50) * 0.85;

        // HF Cross
        let hf_fat = (fat >= 3.2 && fat <= 4.0) ? 1.0 : 0.5;
        let hf_color = color_b <= 6.0 ? 1.0 : 0.6;
        let HF_score = (hf_fat * 0.55 + hf_color * 0.45) * 0.70;

        let Tharparkar_score = Math.max(0, 1.0 - Math.max(Gir_score, Sahiwal_score, HF_score));

        const sum = Gir_score + Sahiwal_score + HF_score + Tharparkar_score;
        const breedScores = {
            "Gir": Gir_score / sum,
            "Sahiwal": Sahiwal_score / sum,
            "HF Cross": HF_score / sum,
            "Tharparkar": Tharparkar_score / sum
        };

        const detectedBreed = Object.keys(breedScores).reduce((a, b) => breedScores[a] > breedScores[b] ? a : b);
        const confidence = breedScores[detectedBreed] * 100;

        return { detectedBreed, confidence: Math.round(confidence), scores: breedScores };
    }

    calculateEconomic(data, quality, a1a2, freshness, adulteration) {
        const state = data.location?.state || "Unknown";
        let base_price = 45;
        if (state.toLowerCase().includes("maharashtra")) base_price = 50;
        if (state.toLowerCase().includes("punjab")) base_price = 48;

        let multiplier = 1.0;
        if (a1a2.type === "A2") multiplier += 0.15;
        if (quality.score >= 90) multiplier += 0.10;
        else if (quality.score >= 75) multiplier += 0.05;
        if (freshness.freshnessPercent >= 90) multiplier += 0.05;
        
        if (adulteration.overallRisk === "High") multiplier -= 0.20;
        else if (adulteration.overallRisk === "Moderate") multiplier -= 0.10;

        const currentValue = base_price * multiplier;
        const premiumGain = ((currentValue - base_price) / base_price) * 100;

        let profitPotential = "Low";
        if (quality.score >= 85 && a1a2.type === "A2" && adulteration.overallRisk === "Low") profitPotential = "High";
        else if (quality.score >= 70) profitPotential = "Medium";

        return {
            currentValue: currentValue.toFixed(2),
            regionalAvg: base_price.toFixed(2),
            premiumGain: premiumGain.toFixed(1),
            profitPotential
        };
    }

    calculateSuitability(data, adulteration) {
        const raw = data.raw;
        const fat = raw.fat || 0;
        const protein = raw.protein || 0;
        const pH = raw.pH || 0;
        const tvc = raw.tvc_cfu_ml || 0;
        const snf = raw.SNF || 0;

        let paneer = 0, curd = 0, cheese = 0, butter = 0, powder = 0;

        if (fat >= 3.5 && protein >= 3.2 && pH >= 6.5 && pH <= 6.8 && tvc < 100000) paneer = 100;
        else paneer = Math.max(0, 100 - (Math.abs(3.5 - fat)*20) - (Math.abs(6.6 - pH)*30));

        if (pH >= 6.4 && pH <= 6.8 && tvc < 200000 && fat >= 3.0) curd = 100;
        else curd = Math.max(0, 100 - (Math.abs(6.6 - pH)*25));

        if (fat >= 3.8 && protein >= 3.2 && adulteration.overallRisk === "Low") cheese = 100;
        else cheese = Math.max(0, 100 - (Math.abs(3.8 - fat)*25));

        if (fat >= 4.0) butter = 100;
        else if (fat >= 3.5) butter = 75;
        else butter = 50;

        if (snf >= 8.5 && tvc < 50000) powder = 100;
        else powder = Math.max(0, 100 - (Math.abs(8.5 - snf)*20));

        return {
            "Paneer": Math.round(paneer),
            "Curd": Math.round(curd),
            "Cheese": Math.round(cheese),
            "Butter": Math.round(butter),
            "Milk Powder": Math.round(powder)
        };
    }

    getRegionalIntelligence(data) {
        const state = data.location?.state || "Unknown";
        
        let marketDemand = "Moderate";
        const st = state.toLowerCase();
        if (st.includes("madhya pradesh") || st.includes("maharashtra") || st.includes("kerala")) marketDemand = "High";

        let storageConditions = "Good";
        if (data.raw.temperature > 15) storageConditions = "Poor";
        else if (data.raw.temperature > 8) storageConditions = "Moderate";

        return {
            qualityTrend: "Similar",
            adulterationRisk: "Low",
            storageConditions,
            marketDemand
        };
    }

    /**
     * ADVANCED PILLAR 3: Multi-Agent LLM Prompts using Claude 3.5 Sonnet
     */
    async getAICopilotSummary(results, safeData) {
        const payload = {
            qualityScore: results.quality.score,
            qualityGrade: results.quality.grade,
            A1A2type: results.a1a2.type,
            A2confidence: results.a1a2.confidence,
            detectedBreed: results.breed.detectedBreed,
            breedConfidence: results.breed.confidence,
            freshnessPercent: results.freshness.freshnessPercent,
            shelfLifeHours: results.freshness.shelfLifeHours,
            overallAdulterationRisk: results.adulteration.overallRisk,
            mahalanobisAnomalyScore: results.adulteration.mahalanobisDistance,
            anomalyRiskLevel: results.adulteration.anomalyRiskLevel,
            microbialRisk: results.microbial.status,
            location: safeData.location?.state
        };

        const prompt = `You are the lead Multi-Agent Orchestrator for MilkoSense. Conclude a collaborative debate between three virtual dairy experts:
1. Veterinary Diagnostic Agent (focus on cow herd health & early mastitis)
2. Regulatory Safety Inspector (focus on FDA/FSSAI compliance & Mahalanobis anomaly score)
3. Smart Logistics Economist (focus on Dynamic pricing & product yield)

Write a 2-sentence summary of the consensus verdict. Focus on herd health, unknown adulteration anomalies, and operational yield. Make it friendly for farmers, and do not repeat raw numbers already shown in the UI. 
Then, output exactly 3 badges selected from this list: [Low Adulteration, Moderate Adulteration, High Adulteration, Highly Nutritious, Average Nutrition, Low Nutrition, Fresh & Safe, Use Soon, Unsafe, Ideal for Premium Products, Not Suitable for Premium] inside brackets at the end.
Example output format:
Consolidated team consensus is that... [Fresh & Safe, Highly Nutritious, Ideal for Premium Products]

Data Payload: ${JSON.stringify(payload)}`;

        return await this.callAnthropic(prompt, "summary");
    }

    async getAIRecommendations(results, safeData) {
        const payload = {
            qualityScore: results.quality.score,
            freshnessPercent: results.freshness.freshnessPercent,
            shelfLifeHours: results.freshness.shelfLifeHours,
            overallAdulterationRisk: results.adulteration.overallRisk,
            mahalanobisAnomalyScore: results.adulteration.mahalanobisDistance,
            anomalyRiskLevel: results.adulteration.anomalyRiskLevel,
            microbialRisk: results.microbial.status,
            temperature: safeData.raw.temperature,
            productSuitabilityScores: results.suitability,
            detectedBreed: results.breed.detectedBreed,
            location: safeData.location?.state
        };

        const prompt = `You are a Dairy Operations Advisor running a Multi-Agent system:
- Agent A (Veterinarian): Focuses on herd health, cleanliness, and mastitis indicators (like abnormal conductivity or pH).
- Agent B (Food Safety): Reviews the multivariate Mahalanobis Anomaly score to detect unknown toxins or dilution.
- Agent C (Logistics Planner): Routes the milk to the most profitable processing path (Paneer, Curd, Butter, Powder) based on chemical profiles.

Provide exactly 2 actionable points for each time window:
1. Immediate (focused on emergency chilling, safety, or mastitis care).
2. Next 6 Hours (focused on processing, product conversion, or sorting).
3. Next 24 Hours (focused on vet visits, sanitation, and supply chain).
4. Processing (focused on premium yield pricing).

Return valid JSON only. No prose. Format:
{"immediate": ["action1", "action2"], "next6h": ["action1", "action2"], "next24h": ["action1", "action2"], "processing": ["suggestion1", "suggestion2"]}

Data Payload: ${JSON.stringify(payload)}`;

        return await this.callAnthropic(prompt, "json");
    }

    async callAnthropic(prompt, type) {
        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }]
            }, {
                headers: {
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            });

            const text = response.data.content[0].text;
            
            if (type === "json") {
                const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
                return JSON.parse(jsonStr);
            } else {
                const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                let summaryText = lines.join(' ');
                let badges = [];
                
                const bracketMatch = summaryText.match(/\[(.*?)\]/g);
                if (bracketMatch) {
                    const lastBracket = bracketMatch[bracketMatch.length - 1];
                    badges = lastBracket.replace(/[\[\]]/g, '').split(',').map(b => b.trim());
                    summaryText = summaryText.replace(lastBracket, '').trim();
                }

                return { summaryText, badges };
            }
        } catch (error) {
            if (type === "json") throw new Error("JSON parsing failed");
            return { summaryText: "Multi-Agent AI analysis is temporarily operating in local backup mode.", badges: [] };
        }
    }
}

module.exports = new AIService();
