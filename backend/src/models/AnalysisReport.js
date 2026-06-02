const mongoose = require('mongoose');

// ── Sub-schemas ────────────────────────────────────────────────────────────────

const qualitySchema = new mongoose.Schema({
    score:           { type: Number },
    grade:           { type: String },
    componentScores: {
        pH:       { type: Number },
        fat:      { type: Number },
        SNF:      { type: Number },
        protein:  { type: Number },
        density:  { type: Number },
        microbial:{ type: Number }
    }
}, { _id: false });

const a1a2Schema = new mongoose.Schema({
    type:       { type: String },   // "A1" | "A2" | "Mixed"
    confidence: { type: Number },   // 0-100
    details:    { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const adulterationSchema = new mongoose.Schema({
    overallRisk:         { type: String },  // "Low" | "Moderate" | "High"
    totalRiskValue:      { type: Number },
    mahalanobisDistance: { type: Number },  // Core Pillar 1 metric
    anomalyRiskLevel:    { type: String },
    penalty:             { type: Number },
    breakdown: {
        waterPercent:           { type: Number },
        ureaAdulteration:       { type: Number },
        detergentAdulteration:  { type: Number },
        starchAdulteration:     { type: Number },
        syntheticMilk:          { type: Number }
    }
}, { _id: false });

const freshnessSchema = new mongoose.Schema({
    freshnessPercent: { type: Number },
    status:           { type: String },
    shelfLifeHours:   { type: Number },
    decayForecast:    [{ time: Number, freshnessPercent: Number }]
}, { _id: false });

const microbialSchema = new mongoose.Schema({
    status:       { type: String },
    currentRisks: { type: mongoose.Schema.Types.Mixed },
    forecast:     [{ time: Number, tvc: Number, coliform: Number, yeastMold: Number }]
}, { _id: false });

const breedSchema = new mongoose.Schema({
    detectedBreed: { type: String },
    confidence:    { type: Number },
    scores:        { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const economicSchema = new mongoose.Schema({
    currentValue:    { type: String },
    regionalAvg:     { type: String },
    premiumGain:     { type: String },
    profitPotential: { type: String }
}, { _id: false });

const aiCopilotSchema = new mongoose.Schema({
    summaryText: { type: String },
    badges:      [{ type: String }]
}, { _id: false });

// ── Main Schema ────────────────────────────────────────────────────────────────

const analysisReportSchema = new mongoose.Schema({
    // Link to the raw sensor snapshot (may be null for on-demand analyses)
    sensorReading: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SensorReading',
        default: null
    },

    // ── Snapshot of the sensor payload (stored inline for fast reads) ──────────
    sensorSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },

    // ── 3-Pillar AI Results ────────────────────────────────────────────────────
    results: {
        quality:      qualitySchema,
        a1a2:         a1a2Schema,
        adulteration: adulterationSchema,
        freshness:    freshnessSchema,
        microbial:    microbialSchema,
        breed:        breedSchema,
        economic:     economicSchema,
        suitability:  { type: mongoose.Schema.Types.Mixed }  // { Paneer, Curd, Cheese, Butter, 'Milk Powder' }
    },

    // ── Multi-Agent LLM Output ─────────────────────────────────────────────────
    aiCopilot:        aiCopilotSchema,
    aiRecommendations:{ type: mongoose.Schema.Types.Mixed, default: null },

    // ── Regional context ───────────────────────────────────────────────────────
    regional:         { type: mongoose.Schema.Types.Mixed, default: null },

    // ── Backwards-compat flat fields (for legacy consumers) ───────────────────
    score:            { type: Number, index: true },
    qualityGrade:     { type: mongoose.Schema.Types.Mixed },
    adulterationRisk: { type: mongoose.Schema.Types.Mixed },
    spoilagePrediction:{ type: mongoose.Schema.Types.Mixed },
    recommendations:  { type: mongoose.Schema.Types.Mixed, default: [] },
    insights:         { type: mongoose.Schema.Types.Mixed, default: [] },

    timestamp: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('AnalysisReport', analysisReportSchema);
