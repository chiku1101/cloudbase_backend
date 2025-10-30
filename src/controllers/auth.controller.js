const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user object with basic details
    const userData = { name, email, password, role };
    
    // Initialize role-specific details as empty objects.
    // These can be populated later from the user's profile page.
    if (role === 'student') {
      userData.studentDetails = {};
    } else if (role === 'recruiter') {
      userData.recruiterDetails = { approved: false }; // Recruiters might need approval
    }
    
    // Create new user
    const user = new User(userData);
    await user.save();
    console.log('User created successfully:', user._id);
    
    // Generate JWT token - FIXED: use userId instead of id
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    console.log('Registration successful for user:', user.email);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token - FIXED: use userId instead of id
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Google OAuth login
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        name,
        email,
        googleId,
        profilePicture: picture,
        role: 'student', // Default role
        isVerified: true, // Google accounts are pre-verified
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.profilePicture = picture;
      user.isVerified = true;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Google login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ message: 'Google authentication failed' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};