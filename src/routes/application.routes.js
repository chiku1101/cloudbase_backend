const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { verifyToken, isRecruiterOrAdmin } = require('../middleware/auth.middleware');

// Get all applications (admin only)
router.get('/', verifyToken, isRecruiterOrAdmin, applicationController.getAllApplications);

// Submit job application (student only)
router.post('/apply', verifyToken, applicationController.submitApplication);

// Get user's applications (student)
router.get('/my-applications', verifyToken, applicationController.getMyApplications);

// Get applications for a specific job (recruiter/admin only)
router.get('/job/:jobId', verifyToken, isRecruiterOrAdmin, applicationController.getJobApplications);

// Update application status (recruiter/admin only)
router.patch('/:applicationId/status', verifyToken, isRecruiterOrAdmin, applicationController.updateApplicationStatus);

// Withdraw application (student only)
router.delete('/:applicationId', verifyToken, applicationController.withdrawApplication);

module.exports = router;