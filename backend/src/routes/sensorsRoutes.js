const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const sensorsController = require('../controllers/sensorsController');
const { validateSensorReading } = require('../middleware/validator');

// SEC-02 FIX: Rate limit sensor ingestion — max 120 req/min per IP (2/sec)
const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many sensor readings — slow down your ESP32 polling rate' }
});

// GET /api/sensors - Retrieve latest reading
router.get('/', sensorsController.getLatestReadings);

// POST /api/sensors - Ingest ESP32 telemetry or simulated data with validators
router.post('/', ingestLimiter, validateSensorReading, sensorsController.ingestSensorReading);

module.exports = router;
