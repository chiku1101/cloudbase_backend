const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// Get all messages for the authenticated user
router.get('/', messageController.getMessages);

// Send a new message
router.post('/', messageController.sendMessage);

// Get conversation between two users
router.get('/conversation/:userId', messageController.getConversation);

// Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// Mark a message as read
router.put('/:id/read', messageController.markAsRead);

// Delete a message
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
