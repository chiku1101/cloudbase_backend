const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: {
    type: String,
    required: [true, 'Job requirements are required'],
    trim: true,
    maxlength: [3000, 'Requirements cannot exceed 3000 characters']
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  salary: {
    type: String,
    trim: true,
    maxlength: [100, 'Salary cannot exceed 100 characters']
  },
  jobType: {
    type: String,
    required: true,
    enum: {
      values: ['Full-time', 'Part-time', 'Internship', 'Contract'],
      message: 'Job type must be Full-time, Part-time, Internship, or Contract'
    },
    default: 'Full-time'
  },
  status: {
    type: String,
    enum: {
      values: ['open', 'closed', 'pending'],
      message: 'Status must be open, closed, or pending'
    },
    default: 'open'
  },
  deadline: {
    type: Date,
    required: [true, 'Application deadline is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recruiter is required']
  },
  minCGPA: {
    type: Number,
    min: [0, 'Minimum CGPA cannot be less than 0'],
    max: [10, 'Minimum CGPA cannot exceed 10']
  },
  requiredSkills: {
    type: [String],
    validate: {
      validator: function(skills) {
        return skills.every(skill => skill.trim().length > 0);
      },
      message: 'Skills cannot be empty'
    }
  },
  applicationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
jobSchema.index({ recruiter: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ deadline: 1 });

// Text index for search functionality
jobSchema.index({
  title: 'text',
  company: 'text',
  description: 'text',
  location: 'text'
});

// Virtual for checking if job is expired
jobSchema.virtual('isExpired').get(function() {
  return this.deadline < new Date();
});

// Virtual for checking if job is active
jobSchema.virtual('isActive').get(function() {
  return this.status === 'open' && this.deadline > new Date();
});

// Pre-save middleware to update deadline validation
jobSchema.pre('save', function(next) {
  if (this.isModified('deadline') && this.deadline <= new Date()) {
    const error = new Error('Deadline must be in the future');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Static method to find active jobs
jobSchema.statics.findActiveJobs = function() {
  return this.find({
    status: 'open',
    deadline: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to find jobs by recruiter
jobSchema.statics.findByRecruiter = function(recruiterId) {
  return this.find({ recruiter: recruiterId }).sort({ createdAt: -1 });
};

// Instance method to check if user can apply
jobSchema.methods.canUserApply = function(userCGPA) {
  if (this.status !== 'open' || this.isExpired) {
    return false;
  }
  if (this.minCGPA && userCGPA < this.minCGPA) {
    return false;
  }
  return true;
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;