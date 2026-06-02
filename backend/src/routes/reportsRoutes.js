const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// GET /api/reports
router.get('/', reportsController.getReports);

// POST /api/reports
router.post('/', reportsController.createReport);

module.exports = router;
