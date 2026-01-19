const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const connectDB = require('./db/connect');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

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

    // Broadcast online users to all clients
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('send_message', async ({ recipient, content }) => {
    const sender = socket.username;
    const Message = require('./models/Message');

    try {
      const newMessage = new Message({ sender, recipient, content });
      await newMessage.save();

      const recipientSocketId = onlineUsers.get(recipient);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_message', {
          sender,
          content,
          timestamp: newMessage.timestamp
        });
      }

      // Send confirmation back to sender
      socket.emit('message_sent', {
        recipient,
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

      // Broadcast updated online users
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
