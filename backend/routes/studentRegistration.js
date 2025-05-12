const express = require('express');
const router = express.Router();
const controller = require('../controllers/studentRegistrationController');
const auth = require('../middleware/auth');
const authOptional = require('../middleware/authOptional'); // assuming authOptional middleware exists

// Student submits registration request
router.post('/register', controller.submitRegistration);

// Student: check registration status by email
router.get('/status', controller.checkStatus);

// Admin: list all pending registration requests
router.get('/requests', auth('admin'), controller.listPending);

// Admin: approve a registration request
router.post('/requests/:id/approve', auth('admin'), controller.approve);

// Admin: reject a registration request
router.post('/requests/:id/reject', auth('admin'), controller.reject);

// Add route to get a single request by ID
router.get('/requests/:id', authOptional, controller.getRequestById);

// Add route to update a request by ID
router.put('/requests/:id', authOptional, controller.updateRequestById);

module.exports = router;
