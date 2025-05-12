const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');

// Get all audit logs (admin)
router.get('/', auth('admin'), auditController.getAuditLogs);

module.exports = router;
