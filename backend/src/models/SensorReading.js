const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  sampleId: { type: String, required: true, unique: true },
  collectedAt: { type: Date, required: true },
  location: {
    state: { type: String },
    district: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },
  raw: {
    pH: { type: Number },
    fat: { type: Number },
    SNF: { type: Number },
    protein: { type: Number },
    lactose: { type: Number },
    density: { type: Number },
    conductivity: { type: Number },
    refractiveIndex: { type: Number },
    turbidity: { type: Number },
    temperature: { type: Number },
    color_L: { type: Number },
    color_a: { type: Number },
    color_b: { type: Number },
    spectralFingerprint: { type: [Number] },
    tvc_cfu_ml: { type: Number },
    coliform_cfu_ml: { type: Number },
    yeastMold_cfu_ml: { type: Number }
  }
}, {
  timestamps: true
});

sensorReadingSchema.index({ collectedAt: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
