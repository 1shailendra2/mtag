const amqp = require('amqplib');

let channel = null;
let connection = null;

async function connect() {
    try {
        const rabbitmqUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}`;
        connection = await amqp.connect(rabbitmqUrl);
        channel = await connection.createChannel();

        // Declare queue with durability
        await channel.assertQueue('message_save', { durable: true });

        console.log('✅ Connected to RabbitMQ');

        // Handle connection errors
        connection.on('error', (err) => {
            console.error('❌ RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            console.log('⚠️  RabbitMQ connection closed, reconnecting...');
            setTimeout(connect, 5000);
        });

        return channel;
    } catch (error) {
        console.error('❌ Failed to connect to RabbitMQ:', error);
        setTimeout(connect, 5000);
    }
}

async function publishMessage(message) {
    try {
        if (!channel) {
            await connect();
        }

        channel.sendToQueue(
            'message_save',
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );

        console.log('📤 Message queued for persistence:', message.roomId);
    } catch (error) {
        console.error('❌ Failed to publish message:', error);
    }
}

async function close() {
    if (channel) await channel.close();
    if (connection) await connection.close();
}

module.exports = { connect, publishMessage, close };
