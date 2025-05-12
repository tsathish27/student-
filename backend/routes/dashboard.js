const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Admin dashboard stats
router.get('/stats', auth('admin'), dashboardController.getStats);

module.exports = router;
