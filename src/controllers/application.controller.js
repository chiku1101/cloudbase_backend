const Application = require('../models/application.model');
const Job = require('../models/job.model');
const User = require('../models/user.model');

// Get all applications (admin/recruiter only)
exports.getAllApplications = async (req, res) => {
  try {
    console.log('=== getAllApplications API CALLED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User:', req.user.name, 'Role:', req.user.role);
    console.log('User ID:', req.user._id);

    const applications = await Application.find()
      .populate('student', 'name email')
      .populate('job', 'title company')
      .sort({ createdAt: -1 });

    console.log(`Found ${applications.length} applications`);

    res.json({
      applications,
      total: applications.length
    });
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit job application
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const { jobId, coverLetter } = req.body;

    console.log('Application submission request:', {
      userId,
      jobId,
      coverLetter: coverLetter ? 'provided' : 'not provided'
    });

    // Check if user is a student
    const user = await User.findById(userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply for jobs' });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    console.log('Job details:', {
      id: job._id,
      title: job.title,
      status: job.status,
      deadline: job.deadline,
      isActive: job.isActive,
      isExpired: job.isExpired
    });

    // Check if job is open for applications
    if (job.status !== 'open') {
      return res.status(400).json({ 
        message: `Job is not open for applications. Current status: ${job.status}` 
      });
    }

    // Check if deadline has passed
    if (job.deadline <= new Date()) {
      return res.status(400).json({ 
        message: 'Application deadline has passed' 
      });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({ 
      student: userId, 
      job: jobId 
    });

    if (existingApplication) {
      return res.status(400).json({ 
        message: 'You have already applied for this job' 
      });
    }

    // Validate student profile completeness
    if (!user.studentDetails) {
      return res.status(400).json({ 
        message: 'Please complete your student profile before applying' 
      });
    }

    // Check CGPA requirement if specified
    if (job.minCGPA && user.studentDetails.cgpa < job.minCGPA) {
      return res.status(400).json({ 
        message: `Minimum CGPA requirement not met. Required: ${job.minCGPA}, Your CGPA: ${user.studentDetails.cgpa}` 
      });
    }

    // Create new application
    const applicationData = {
      student: userId,
      job: jobId,
      status: 'applied'
    };

    // Add cover letter if provided
    if (coverLetter && coverLetter.trim() !== '') {
      applicationData.coverLetter = coverLetter.trim();
    }

    // Add resume URL if available
    if (user.studentDetails.resumeUrl) {
      applicationData.resumeUrl = user.studentDetails.resumeUrl;
    }

    const newApplication = new Application(applicationData);
    await newApplication.save();

    // Update job's application count
    await Job.findByIdAndUpdate(jobId, { 
      $inc: { applicationCount: 1 } 
    });

    // Populate the response
    await newApplication.populate([
      { path: 'job', select: 'title company location' },
      { path: 'student', select: 'name email' }
    ]);

    console.log('Application created successfully:', newApplication);

    res.status(201).json({
      message: 'Application submitted successfully',
      application: newApplication
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    
    // Handle duplicate key error (already applied)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'You have already applied for this job' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get user's applications
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user._id;

    const applications = await Application.find({ student: userId })
      .populate('job', 'title company location salary jobType deadline status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Applications fetched successfully',
      applications,
      total: applications.length
    });
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get applications for a specific job (recruiter only)
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    // Verify job exists and belongs to the recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiter.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to view applications for this job' 
      });
    }

    const applications = await Application.find({ job: jobId })
      .populate('student', 'name email studentDetails')
      .populate('job', 'title company')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Job applications fetched successfully',
      applications,
      total: applications.length,
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      }
    });
  } catch (error) {
    console.error('Error getting job applications:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update application status (recruiter only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    // Validate status
    const validStatuses = ['applied', 'shortlisted', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Find application and populate job
    const application = await Application.findById(applicationId).populate('job');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if recruiter owns the job
    if (application.job.recruiter.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to update this application' 
      });
    }

    // Update status
    application.status = status;
    await application.save();

    // Populate response
    await application.populate([
      { path: 'student', select: 'name email' },
      { path: 'job', select: 'title company' }
    ]);

    res.status(200).json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete application (student only - withdraw application)
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user._id;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if application belongs to the user
    if (application.student.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to withdraw this application' 
      });
    }

    // Check if application can be withdrawn (only if still in 'applied' status)
    if (application.status !== 'applied') {
      return res.status(400).json({ 
        message: `Cannot withdraw application. Current status: ${application.status}` 
      });
    }

    // Delete application and update job's application count
    await Promise.all([
      Application.findByIdAndDelete(applicationId),
      Job.findByIdAndUpdate(application.job, { 
        $inc: { applicationCount: -1 } 
      })
    ]);

    res.status(200).json({
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};
