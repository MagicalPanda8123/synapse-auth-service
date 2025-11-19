import IORedis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL

const redis = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // <-- Required for BullMQ workers!
})

redis.on('connect', () => console.log('✅ [Redis] Connected'))
redis.on('error', (err) => console.error('❌ [Redis] Error:', err))

export default redis
