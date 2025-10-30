const Job = require('../models/job.model');
const Application = require('../models/application.model');

// Create a new job (recruiter only)
exports.createJob = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('User details:', req.user);
    
    const {
      title,
      company,
      description,
      requirements,
      location,
      salary,
      jobType,
      deadline,
      minCGPA,
      requiredSkills,
    } = req.body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Job title is required' });
    }
    
    if (!company || company.trim() === '') {
      return res.status(400).json({ 
        message: 'Company name is required' 
      });
    }
    
    if (!description || description.trim() === '') {
      return res.status(400).json({ message: 'Job description is required' });
    }
    
    if (!requirements || requirements.trim() === '') {
      return res.status(400).json({ message: 'Job requirements are required' });
    }
    
    if (!location || location.trim() === '') {
      return res.status(400).json({ message: 'Job location is required' });
    }
    
    if (!deadline) {
      return res.status(400).json({ message: 'Application deadline is required' });
    }
    
    // Create job data object
    const jobData = {
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      requirements: requirements.trim(),
      location: location.trim(),
      jobType: jobType || 'Full-time',
      deadline: new Date(deadline),
      recruiter: req.user._id,
      status: 'open' // Make sure status is set to 'open' by default
    };
    
    // Add optional fields if they exist
    if (salary && salary.trim() !== '') {
      jobData.salary = salary.trim();
    }
    
    if (minCGPA && !isNaN(parseFloat(minCGPA))) {
      jobData.minCGPA = parseFloat(minCGPA);
    }
    
    if (requiredSkills && Array.isArray(requiredSkills)) {
      jobData.requiredSkills = requiredSkills
        .filter(skill => skill && skill.trim() !== '')
        .map(skill => skill.trim());
    }
    
    console.log('Creating job with data:', jobData);
    
    const job = new Job(jobData);
    await job.save();
    
    console.log('Job created successfully:', job);
    
    res.status(201).json({ 
      message: 'Job created successfully', 
      job 
    });
    
  } catch (error) {
    console.error('Error creating job:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors,
        error: error.message 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate entry detected', 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all jobs - FIXED VERSION
exports.getAllJobs = async (req, res) => {
  try {
    console.log('=== getAllJobs API CALLED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User:', req.user?.name, 'Role:', req.user?.role);
    console.log('User ID:', req.user?._id);
    console.log('Query params:', req.query);
    console.log('Request headers:', req.headers);
    
    const { status, company, jobType, search } = req.query;
    
    // Build filter object
    const filter = {};
    
    // IMPORTANT: Different logic for different user roles
    if (req.user.role === 'student') {
      // Students should see all jobs (temporarily removing all filters for debugging)
      console.log('Student filter applied - showing ALL jobs (no filters for debugging)');
      
    } else if (req.user.role === 'recruiter') {
      // Recruiters should see only their own jobs (all statuses)
      filter.recruiter = req.user._id;
      console.log('Recruiter filter applied - showing only own jobs');
      
    } else if (req.user.role === 'admin') {
      // Admins should see all jobs (all statuses)
      console.log('Admin filter applied - showing all jobs');
      // No additional filters for admin - they see everything
    }
    
    // Apply additional filters if provided (but skip for students during debugging)
    if (status && req.user.role !== 'student') {
      // Students see all jobs during debugging, others can filter by status
      filter.status = status;
    }

    if (company) {
      filter.company = { $regex: company, $options: 'i' };
    }

    if (jobType) {
      filter.jobType = jobType;
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Final filter:', JSON.stringify(filter, null, 2));
    
    // First, let's check how many jobs exist in total
    const totalJobsCount = await Job.countDocuments({});
    console.log('Total jobs in database:', totalJobsCount);
    
    const jobs = await Job.find(filter)
      .populate('recruiter', 'name email recruiterDetails')
      .sort({ createdAt: -1 });

    console.log(`Found ${jobs.length} jobs after filtering`);
    console.log('Jobs found:', jobs.map(job => ({
      id: job._id,
      title: job.title,
      company: job.company,
      status: job.status,
      recruiter: job.recruiter?.name,
      deadline: job.deadline
    })));

    // Add application count for each job (useful for all roles)
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({ job: job._id });
        
        // For students, also check if they've already applied
        let hasApplied = false;
        if (req.user.role === 'student') {
          const application = await Application.findOne({ 
            job: job._id, 
            student: req.user._id 
          });
          hasApplied = !!application;
        }
        
        return {
          ...job.toObject(),
          applicationCount,
          ...(req.user.role === 'student' && { hasApplied })
        };
      })
    );

    console.log('Final response being sent:', {
      jobs: jobsWithStats,
      total: jobsWithStats.length,
      userRole: req.user.role
    });

    res.status(200).json({
      jobs: jobsWithStats,
      total: jobsWithStats.length,
      userRole: req.user.role
    });
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get jobs by recruiter (recruiter only)
exports.getRecruiterJobs = async (req, res) => {
  try {
    console.log('=== getRecruiterJobs called ===');
    console.log('User:', req.user);
    
    if (!req.user || req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied. Recruiter role required.' });
    }
    
    const jobs = await Job.find({ recruiter: req.user._id })
      .populate('recruiter', 'name email')
      .sort({ createdAt: -1 });
    
    // Get application counts for each job
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({ job: job._id });
        return {
          ...job.toObject(),
          applicationCount
        };
      })
    );
    
    res.status(200).json({
      message: 'Jobs fetched successfully',
      jobs: jobsWithStats,
      total: jobsWithStats.length
    });
    
  } catch (error) {
    console.error('Error in getRecruiterJobs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    const job = await Job.findById(id).populate(
      'recruiter',
      'name email recruiterDetails'
    );
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Get application count
    const applicationCount = await Application.countDocuments({ job: id });
    
    // Check if current user has applied (if user is a student)
    let hasApplied = false;
    if (req.user.role === 'student') {
      const application = await Application.findOne({ 
        job: id, 
        student: req.user._id 
      });
      hasApplied = !!application;
    }
    
    res.status(200).json({
      ...job.toObject(),
      applicationCount,
      hasApplied
    });
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update job (recruiter only)
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    // Find job
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if recruiter owns the job
    if (job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }
    
    // Validate updates
    const allowedUpdates = [
      'title', 'company', 'description', 'requirements', 
      'location', 'salary', 'jobType', 'deadline', 
      'minCGPA', 'requiredSkills', 'status'
    ];
    
    const updateKeys = Object.keys(updates);
    const isValidOperation = updateKeys.every(update => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }
    
    // Apply updates
    updateKeys.forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        if (typeof updates[key] === 'string') {
          job[key] = updates[key].trim();
        } else {
          job[key] = updates[key];
        }
      }
    });
    
    // Handle deadline conversion
    if (updates.deadline) {
      job.deadline = new Date(updates.deadline);
    }
    
    await job.save();
    
    res.status(200).json({ 
      message: 'Job updated successfully', 
      job 
    });
  } catch (error) {
    console.error('Error updating job:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete job (recruiter only)
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    // Find job
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if recruiter owns the job or user is admin
    if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }
    
    // Delete job and all associated applications
    await Promise.all([
      Job.findByIdAndDelete(id),
      Application.deleteMany({ job: id }),
    ]);
    
    res.status(200).json({ 
      message: 'Job and associated applications deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve job (admin only)
exports.approveJob = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    job.status = 'open';
    await job.save();
    
    res.status(200).json({ 
      message: 'Job approved successfully', 
      job 
    });
  } catch (error) {
    console.error('Error approving job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Close job (recruiter only)
exports.closeJob = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if recruiter owns the job
    if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to close this job' });
    }
    
    job.status = 'closed';
    await job.save();
    
    res.status(200).json({ 
      message: 'Job closed successfully', 
      job 
    });
  } catch (error) {
    console.error('Error closing job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Debug endpoint to check all jobs (temporary - remove in production)
exports.debugAllJobs = async (req, res) => {
  try {
    const allJobs = await Job.find({}).populate('recruiter', 'name email');
    res.status(200).json({
      message: 'All jobs in database',
      total: allJobs.length,
      jobs: allJobs.map(job => ({
        id: job._id,
        title: job.title,
        company: job.company,
        status: job.status,
        recruiter: job.recruiter?.name,
        createdAt: job.createdAt,
        deadline: job.deadline
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};