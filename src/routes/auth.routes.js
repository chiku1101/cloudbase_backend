const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Google OAuth login
router.post('/google', authController.googleLogin);

// Get current user
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;