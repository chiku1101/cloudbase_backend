const jobFetchingService = require('../services/jobFetchingService');

// Get external jobs from various sources
exports.getExternalJobs = async (req, res) => {
  try {
    const { 
      query = 'software engineer', 
      location = 'remote', 
      limit = 20,
      source = 'all' // 'all', 'indeed', 'github', 'startup'
    } = req.query;

    console.log(`🔍 Fetching external jobs: ${query} in ${location} from ${source}`);

    let jobs = [];

    switch (source) {
      case 'indeed':
        jobs = await jobFetchingService.fetchIndeedJobs(query, location, parseInt(limit));
        break;
      case 'github':
        jobs = await jobFetchingService.fetchGitHubJobs(query, location, parseInt(limit));
        break;
      case 'startup':
        jobs = await jobFetchingService.fetchStartupJobs(query, location, parseInt(limit));
        break;
      case 'all':
      default:
        jobs = await jobFetchingService.fetchAllJobs(query, location, parseInt(limit));
        break;
    }

    res.status(200).json({
      success: true,
      message: `Found ${jobs.length} external jobs`,
      data: jobs,
      meta: {
        query,
        location,
        source,
        limit: parseInt(limit),
        count: jobs.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching external jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external jobs',
      error: error.message
    });
  }
};

// Get job categories for filtering
exports.getJobCategories = async (req, res) => {
  try {
    const categories = jobFetchingService.getJobCategories();
    
    res.status(200).json({
      success: true,
      message: 'Job categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('❌ Error fetching job categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job categories',
      error: error.message
    });
  }
};

// Get popular job locations
exports.getPopularLocations = async (req, res) => {
  try {
    const locations = jobFetchingService.getPopularLocations();
    
    res.status(200).json({
      success: true,
      message: 'Popular locations retrieved successfully',
      data: locations
    });
  } catch (error) {
    console.error('❌ Error fetching popular locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular locations',
      error: error.message
    });
  }
};

// Search jobs with advanced filters
exports.searchExternalJobs = async (req, res) => {
  try {
    const {
      query = '',
      location = 'remote',
      category = '',
      experience = '',
      jobType = '',
      salary = '',
      limit = 20,
      source = 'all'
    } = req.body;

    console.log(`🔍 Advanced job search:`, { query, location, category, experience, jobType, salary });

    // Build search query based on category
    let searchQuery = query;
    if (category && !query) {
      const categories = jobFetchingService.getJobCategories();
      const selectedCategory = categories.find(cat => cat.id === category);
      if (selectedCategory) {
        searchQuery = selectedCategory.keywords[0]; // Use first keyword as default
      }
    }

    // Add experience level to query
    if (experience) {
      searchQuery += ` ${experience}`;
    }

    // Add job type to query
    if (jobType) {
      searchQuery += ` ${jobType}`;
    }

    let jobs = [];

    switch (source) {
      case 'indeed':
        jobs = await jobFetchingService.fetchIndeedJobs(searchQuery, location, parseInt(limit));
        break;
      case 'github':
        jobs = await jobFetchingService.fetchGitHubJobs(searchQuery, location, parseInt(limit));
        break;
      case 'startup':
        jobs = await jobFetchingService.fetchStartupJobs(searchQuery, location, parseInt(limit));
        break;
      case 'all':
      default:
        jobs = await jobFetchingService.fetchAllJobs(searchQuery, location, parseInt(limit));
        break;
    }

    // Filter by salary if specified
    if (salary) {
      jobs = jobs.filter(job => {
        const jobSalary = job.salary.toLowerCase();
        return jobSalary.includes(salary.toLowerCase()) || 
               jobSalary.includes('not specified') ||
               jobSalary.includes('competitive');
      });
    }

    res.status(200).json({
      success: true,
      message: `Found ${jobs.length} jobs matching your criteria`,
      data: jobs,
      meta: {
        query: searchQuery,
        location,
        category,
        experience,
        jobType,
        salary,
        source,
        limit: parseInt(limit),
        count: jobs.length
      }
    });

  } catch (error) {
    console.error('❌ Error in advanced job search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search external jobs',
      error: error.message
    });
  }
};

// Get job details (for external jobs, we'll return basic info)
exports.getExternalJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // For external jobs, we can't get detailed info without scraping individual pages
    // Return basic structure for now
    const jobDetails = {
      _id: jobId,
      title: 'External Job',
      company: 'External Company',
      location: 'Various',
      description: 'This is an external job posting. Click the external link to view full details.',
      source: 'External',
      externalUrl: 'https://example.com',
      isExternal: true
    };

    res.status(200).json({
      success: true,
      message: 'External job details retrieved',
      data: jobDetails
    });

  } catch (error) {
    console.error('❌ Error fetching external job details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external job details',
      error: error.message
    });
  }
};
