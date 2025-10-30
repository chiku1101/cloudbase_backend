const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId; // Password not required if Google OAuth
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    profilePicture: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['admin', 'recruiter', 'student'],
      default: 'student',
    },
    // Fields specific to students
    studentDetails: {
      cgpa: Number,
      skills: [String],
      resumeUrl: String,
      branch: String,
      graduationYear: Number,
    },
    // Fields specific to recruiters
    recruiterDetails: {
      company: String,
      position: String,
      approved: {
        type: Boolean,
        default: false,
      },
    },
    // Additional profile fields
    phone: String,
    bio: String,
    location: String,
    linkedin: String,
    github: String,
    website: String,
    // Notification settings
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      jobAlerts: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false }
    },
    // Privacy settings
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'recruiters', 'private'], default: 'public' },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      allowMessages: { type: Boolean, default: true },
      dataSharing: { type: Boolean, default: false }
    },
    // Security settings
    security: {
      twoFactorAuth: { type: Boolean, default: false },
      loginAlerts: { type: Boolean, default: true },
      sessionTimeout: { type: Number, default: 30 }
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;