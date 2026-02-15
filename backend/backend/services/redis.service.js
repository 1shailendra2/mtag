const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'msgapp-redis',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3
});

redis.on('connect', () => {
    console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

module.exports = redis;
