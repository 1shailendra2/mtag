const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const amqp = require('amqplib');
const connectDB = require('./db/connect');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const roomRoutes = require('./routes/rooms');

dotenv.config();

const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const messagesSentCounter = new client.Counter({
  name: 'msgapp_messages_sent_total',
  help: 'Total number of messages sent in the application',
});

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000",
      "http://secondbrainbackend.me",
      "https://secondbrainbackend.me"
    ],
    methods: ["GET", "POST"]
  }
});

const pubClient = createClient({ url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('✅ Redis Adapter connected');
}).catch(err => console.error('Redis Adapter Error:', err));

let channel;
const connectRabbitMQ = async () => {
  try {
    const rabbitmqUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}`;
    const connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    await channel.assertQueue('message_save', { durable: true });
    console.log('✅ Connected to RabbitMQ');
  } catch (error) {
    console.error('❌ RabbitMQ Connection Error:', error);
    setTimeout(connectRabbitMQ, 5000);
  }
};
connectRabbitMQ();

app.use(cors({
  origin: ["http://localhost:3000",
    "http://secondbrainbackend.me",
    "https://secondbrainbackend.me"
  ],
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;

  if (dbStatus === 1) {
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } else {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

connectDB();

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
      const messagePayload = { sender, roomId, content, timestamp: new Date() };

      if (channel) {
        channel.sendToQueue('message_save', Buffer.from(JSON.stringify(messagePayload)));
        messagesSentCounter.inc();
      } else {
        console.error("RabbitMQ channel not available");
      }

      io.to(roomId).emit('receive_message', messagePayload);

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
