const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { verifyToken, isRecruiter, isAdmin } = require('../middleware/auth.middleware');

// Debug endpoint (temporary - remove in production)
router.get('/debug/all', verifyToken, jobController.debugAllJobs);

// Create a new job (recruiter only)
router.post('/', verifyToken, isRecruiter, jobController.createJob);

// Get all jobs - MAIN ENDPOINT FOR VIEWING JOBS
router.get('/', verifyToken, jobController.getAllJobs);

// Get jobs by recruiter (recruiter only)
router.get('/recruiter', verifyToken, isRecruiter, jobController.getRecruiterJobs);

// Get job by ID
router.get('/:id', verifyToken, jobController.getJobById);

// Update job (recruiter only)
router.patch('/:id', verifyToken, isRecruiter, jobController.updateJob);

// Close job (recruiter only)
router.patch('/close/:id', verifyToken, isRecruiter, jobController.closeJob);

// Delete job (recruiter only)
router.delete('/:id', verifyToken, isRecruiter, jobController.deleteJob);

// Approve job (admin only)
router.patch('/approve/:id', verifyToken, isAdmin, jobController.approveJob);

module.exports = router;