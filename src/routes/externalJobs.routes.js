const express = require('express');
const router = express.Router();
const {
  getExternalJobs,
  getJobCategories,
  getPopularLocations,
  searchExternalJobs,
  getExternalJobDetails
} = require('../controllers/externalJobs.controller');

// Get external jobs from various sources
// GET /api/external-jobs?query=software engineer&location=remote&limit=20&source=all
router.get('/', getExternalJobs);

// Get job categories for filtering
// GET /api/external-jobs/categories
router.get('/categories', getJobCategories);

// Get popular job locations
// GET /api/external-jobs/locations
router.get('/locations', getPopularLocations);

// Advanced job search with filters
// POST /api/external-jobs/search
router.post('/search', searchExternalJobs);

// Get external job details
// GET /api/external-jobs/:jobId
router.get('/:jobId', getExternalJobDetails);

module.exports = router;
