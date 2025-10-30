// Example backend route for Google OAuth
// Add this to your auth routes

const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
const googleAuth = async (req, res) => {
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
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ message: 'Google authentication failed' });
  }
};

module.exports = { googleAuth };

// Add this to your auth routes file:
// router.post('/google', googleAuth);
