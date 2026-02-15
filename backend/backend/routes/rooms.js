const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: -1 });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        const existingRoom = await Room.findOne({ name });
        if (existingRoom) {
            return res.status(400).json({ error: 'Room name already exists' });
        }

        const room = new Room({
            name,
            createdBy: req.user.username
        });

        await room.save();
        res.status(201).json(room);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
