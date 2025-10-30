const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token. User not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired.' 
      });
    }
    
    return res.status(500).json({ 
      message: 'Server error during authentication.' 
    });
  }
};

// Check if user is a student
const isStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      message: 'Access denied. Student role required.' 
    });
  }

  next();
};

// Check if user is a recruiter
const isRecruiter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ 
      message: 'Access denied. Recruiter role required.' 
    });
  }

  next();
};

// Check if user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin role required.' 
    });
  }

  next();
};

// Check if user is either recruiter or admin
const isRecruiterOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Recruiter or Admin role required.' 
    });
  }

  next();
};

// Optional auth - sets user if token is present but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without setting user
    next();
  }
};

module.exports = {
  verifyToken,
  isStudent,
  isRecruiter,
  isAdmin,
  isRecruiterOrAdmin,
  optionalAuth
};