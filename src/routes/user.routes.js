const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdmin, isRecruiterOrAdmin } = require('../middleware/auth.middleware');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'User routes are working!' });
});

// Get all users (admin only)
router.get('/', verifyToken, isAdmin, userController.getAllUsers);

// Get users for messaging (all authenticated users)
router.get('/for-messaging', verifyToken, userController.getUsersForMessaging);

// Get current user profile
router.get('/profile', verifyToken, (req, res, next) => {
  console.log('GET /api/users/profile route hit');
  next();
}, userController.getCurrentUserProfile);

// Get users by role (admin only)
router.get('/role/:role', verifyToken, isAdmin, userController.getUsersByRole);

// Get student profile (admin or recruiter)
router.get('/student/:id', verifyToken, isRecruiterOrAdmin, userController.getStudentProfile);

// Approve recruiter (admin only)
router.patch('/approve-recruiter/:id', verifyToken, isAdmin, userController.approveRecruiter);

// Update user profile (legacy)
router.patch('/profile', verifyToken, userController.updateProfile);

// Enhanced profile update for settings
router.put('/profile', verifyToken, userController.updateUserProfile);

// Update notification settings
router.put('/notifications', verifyToken, userController.updateNotifications);

// Update privacy settings
router.put('/privacy', verifyToken, userController.updatePrivacy);

// Update security settings
router.put('/security', verifyToken, userController.updateSecurity);

// Change password
router.put('/password', verifyToken, userController.changePassword);

// Export user data
router.get('/export', verifyToken, userController.exportData);

// Delete user account
router.delete('/account', verifyToken, userController.deleteAccount);

module.exports = router;