const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sender, roomId, content } = req.body;

    if (sender !== req.user.username) {
      return res.status(403).json({ error: 'You can only send messages as yourself' });
    }

    const message = new Message({ sender, roomId, content });
    await message.save();
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({ roomId }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
