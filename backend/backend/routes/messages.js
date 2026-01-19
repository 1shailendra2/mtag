const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

// POST /api/messages - Send a message (Protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sender, recipient, content } = req.body;

    // Security: Verify the sender matches the authenticated user
    if (sender !== req.user.username) {
      return res.status(403).json({ error: 'You can only send messages as yourself' });
    }

    const message = new Message({ sender, recipient, content });
    await message.save();
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/:user1/:user2 - Get conversation history (Protected)
router.get('/:user1/:user2', authMiddleware, async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    // Security: Users can only view their own conversations
    if (user1 !== req.user.username && user2 !== req.user.username) {
      return res.status(403).json({ error: 'You can only view your own conversations' });
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
