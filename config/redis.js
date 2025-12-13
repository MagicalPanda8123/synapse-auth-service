import Redis from 'ioredis'

// const REDIS_URL = process.env.REDIS_URL

// const redis = new IORedis(REDIS_URL, {
//   maxRetriesPerRequest: null, // <-- Required for BullMQ workers!
// })

// AWS ElastiCache Cluster endpoint (cluster mode)
const CLUSTER_NODES = [{ host: 'clustercfg.synapse-cache.trohrd.apse1.cache.amazonaws.com', port: 6379 }]

const redis = new Redis.Cluster(CLUSTER_NODES, {
  // DNS resolution for AWS cluster endpoints
  dnsLookup: (address, callback) => {
    console.log('Resolving Redis node:', address)
    callback(null, address)
  },

  // Retry strategy when cluster refresh fails
  clusterRetryStrategy: (times) => {
    // Retry up to ~2 seconds with incremental delay
    const delay = Math.min(100 + times * 50, 2000)
    console.log(`Cluster retry #${times}, delay: ${delay}ms`)
    return delay
  },

  // Options applied to all cluster nodes
  redisOptions: {
    tls: {
      rejectUnauthorized: false, // bypass cert validation for Amazon TLS
    },
    maxRetriesPerRequest: null, // Required for BullMQ long-running workers
    connectTimeout: 10000, // 10s initial connect timeout
  },
})

redis.on('connect', () => console.log('✅ [Redis] Connected'))
redis.on('error', (err) => console.error('❌ [Redis] Error:', err))

export default redis
