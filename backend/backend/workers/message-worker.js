const amqp = require('amqplib');
const mongoose = require('mongoose');
const Message = require('../models/Message');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Worker connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

async function startWorker() {
    await connectDB();

    const rabbitmqUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}`;

    try {
        const connection = await amqp.connect(rabbitmqUrl);
        const channel = await connection.createChannel();

        await channel.assertQueue('message_save', { durable: true });
        channel.prefetch(1);

        console.log('✅ Worker connected to RabbitMQ');
        console.log('⏳ Waiting for messages...');

        channel.consume('message_save', async (msg) => {
            if (msg !== null) {
                try {
                    const messageData = JSON.parse(msg.content.toString());

                    const newMessage = new Message({
                        sender: messageData.sender,
                        roomId: messageData.roomId,
                        content: messageData.content,
                        timestamp: messageData.timestamp || new Date()
                    });

                    await newMessage.save();

                    console.log(`💾 Message saved to MongoDB - Room: ${messageData.roomId}, Sender: ${messageData.sender}`);

                    channel.ack(msg);
                } catch (error) {
                    console.error('❌ Error processing message:', error);

                    channel.nack(msg, false, true);
                }
            }
        });

        connection.on('error', (err) => {
            console.error('❌ RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            console.log('⚠️  RabbitMQ connection closed, exiting...');
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start worker:', error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down worker...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⏹️  Shutting down worker...');
    await mongoose.connection.close();
    process.exit(0);
});

startWorker().catch((error) => {
    console.error('❌ Worker startup failed:', error);
    process.exit(1);
});
