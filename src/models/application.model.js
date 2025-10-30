const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'rejected', 'hired'],
      default: 'applied',
    },
    coverLetter: {
      type: String,
    },
    resumeUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// Ensure a student can only apply once to a job
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;