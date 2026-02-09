const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const connectDB = require('./db/connect');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const roomRoutes = require('./routes/rooms');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;

  if (dbStatus === 1) {
    // 1 = connected
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } else {
    // 0 = disconnected, 2 = connecting, 3 = disconnecting
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Connect to MongoDB
connectDB();

// Socket.io connection handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (username) => {
    socket.username = username;
    onlineUsers.set(username, socket.id);
    console.log(`${username} joined`);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.username} joined room: ${roomId}`);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`${socket.username} left room: ${roomId}`);
  });

  socket.on('send_message', async ({ roomId, content }) => {
    const sender = socket.username;
    if (!sender) return;

    const Message = require('./models/Message');

    try {
      const newMessage = new Message({ sender, roomId, content });
      await newMessage.save();

      // Emit message to everyone in the room
      io.to(roomId).emit('receive_message', {
        sender,
        roomId,
        content,
        timestamp: newMessage.timestamp
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      onlineUsers.delete(socket.username);
      console.log(`${socket.username} disconnected`);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
