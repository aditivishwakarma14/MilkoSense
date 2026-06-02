const express = require('express');
const router = express.Router();
const realtimeController = require('../controllers/realtimeController');

// GET /api/realtime
router.get('/', realtimeController.getDashboardStats);

module.exports = router;
