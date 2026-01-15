import { Queue } from 'bullmq'
import redis from '../../config/redis.js'

const userSummaryQueue = new Queue('{userSummaryQueue}', {
  connection: redis, // Use the centralized Redis connection
})

export default userSummaryQueue
