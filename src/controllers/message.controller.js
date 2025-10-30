const Message = require('../models/message.model');
const User = require('../models/user.model');

// Get all messages for the authenticated user
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    })
    .populate('sender', 'name email role')
    .populate('recipient', 'name email role')
    .sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { recipient, subject, content } = req.body;
    const sender = req.user._id;

    // Validate required fields
    if (!recipient || !subject || !content) {
      return res.status(400).json({ message: 'Recipient, subject, and content are required' });
    }

    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create the message
    const message = new Message({
      sender,
      recipient,
      subject,
      content
    });

    const savedMessage = await message.save();
    
    // Populate the sender and recipient details
    await savedMessage.populate('sender', 'name email role');
    await savedMessage.populate('recipient', 'name email role');

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark a message as read
exports.markAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the user is the recipient
    if (message.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to mark this message as read' });
    }

    // Update the message
    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'name email role')
    .populate('recipient', 'name email role')
    .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Message.countDocuments({
      recipient: userId,
      read: false
    });

    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the user is the sender or recipient
    if (message.sender.toString() !== userId.toString() && message.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
