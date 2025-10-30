const User = require('../models/user.model');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get users for messaging (all authenticated users)
exports.getUsersForMessaging = async (req, res) => {
  try {
    const users = await User.find().select('name email role');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get users by role (admin only)
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!['admin', 'recruiter', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const users = await User.find({ role }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve recruiter (admin only)
exports.approveRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recruiter = await User.findById(id);
    
    if (!recruiter) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (recruiter.role !== 'recruiter') {
      return res.status(400).json({ message: 'User is not a recruiter' });
    }
    
    recruiter.recruiterDetails.approved = true;
    await recruiter.save();
    
    res.status(200).json({ message: 'Recruiter approved successfully', recruiter });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, cgpa, skills, resumeUrl, branch, graduationYear } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update general fields
    user.name = name || user.name;
    user.email = email || user.email;

    // Ensure studentDetails object exists for students
    if (user.role === 'student' && !user.studentDetails) {
      user.studentDetails = {};
    }

    // Update student-specific fields directly on the model instance
    if (user.role === 'student') {
      if (cgpa) user.studentDetails.cgpa = parseFloat(cgpa);
      if (resumeUrl) user.studentDetails.resumeUrl = resumeUrl;
      if (branch) user.studentDetails.branch = branch;
      if (graduationYear) user.studentDetails.graduationYear = parseInt(graduationYear, 10);
      
      if (typeof skills === 'string') {
        user.studentDetails.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(skills)) {
        user.studentDetails.skills = skills;
      }
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
exports.getCurrentUserProfile = async (req, res) => {
  try {
    console.log('getCurrentUserProfile controller called');
    const userId = req.user._id;
    console.log('User ID:', userId);
    
    const user = await User.findById(userId).select('-password');
    console.log('User found:', !!user);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student profile
exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await User.findById(id).select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }
    
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile (enhanced for settings)
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, phone, bio, location, linkedin, github, website } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;
    if (location) user.location = location;
    if (linkedin) user.linkedin = linkedin;
    if (github) user.github = github;
    if (website) user.website = website;

    const updatedUser = await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update notification settings
exports.updateNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationSettings = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update notification settings
    user.notifications = { ...user.notifications, ...notificationSettings };
    await user.save();

    res.status(200).json({
      message: 'Notification preferences updated successfully',
      notifications: user.notifications,
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update privacy settings
exports.updatePrivacy = async (req, res) => {
  try {
    const userId = req.user._id;
    const privacySettings = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update privacy settings
    user.privacy = { ...user.privacy, ...privacySettings };
    await user.save();

    res.status(200).json({
      message: 'Privacy settings updated successfully',
      privacy: user.privacy,
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update security settings
exports.updateSecurity = async (req, res) => {
  try {
    const userId = req.user._id;
    const securitySettings = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update security settings
    user.security = { ...user.security, ...securitySettings };
    await user.save();

    res.status(200).json({
      message: 'Security settings updated successfully',
      security: user.security,
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a password (not OAuth user)
    if (!user.password) {
      return res.status(400).json({ message: 'Password change not available for OAuth users' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export user data
exports.exportData = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create export data
    const exportData = {
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        location: user.location,
        linkedin: user.linkedin,
        github: user.github,
        website: user.website,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      settings: {
        notifications: user.notifications,
        privacy: user.privacy,
        security: user.security
      },
      studentDetails: user.studentDetails,
      recruiterDetails: user.recruiterDetails,
      exportDate: new Date().toISOString()
    };

    res.status(200).json({
      message: 'Data exported successfully',
      data: exportData,
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};