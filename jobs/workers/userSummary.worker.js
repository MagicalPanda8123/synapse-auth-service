import { Worker } from 'bullmq'
import redis from '../../config/redis.js'
import prisma from '../../config/prisma.js'

const userSummaryWorker = new Worker(
  '{userSummaryQueue}', // Queue name
  async (job) => {
    try {
      console.log(`Processing job: ${job.name} with jobId: ${job.id}`)

      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0))
      const endOfDay = new Date(today.setHours(23, 59, 59, 999))

      // Aggregate user data
      const totalUsers = await prisma.account.count()
      const activeUsers = await prisma.account.count({ where: { status: 'ACTIVE' } })
      const suspendedUsers = await prisma.account.count({ where: { status: 'SUSPENDED' } })
      const pendingUsers = await prisma.account.count({ where: { status: 'PENDING' } })

      // Count new users created today
      const newUsers = await prisma.account.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      })

      // Count new users by status created today
      const newActiveUsers = await prisma.account.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: 'ACTIVE' },
      })
      const newSuspendedUsers = await prisma.account.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: 'SUSPENDED' },
      })
      const newPendingUsers = await prisma.account.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: 'PENDING' },
      })
      const newBannedUsers = await prisma.account.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: 'BANNED' },
      })

      // Write the aggregated data to the UserSummary table
      await prisma.userSummary.create({
        data: {
          summaryDate: startOfDay, // Explicitly set the summary date
          totalUsers,
          activeUsers,
          suspendedUsers,
          pendingUsers,
          newUsers,
          newActiveUsers,
          newSuspendedUsers,
          newPendingUsers,
          newBannedUsers,
        },
      })

      console.log('Daily user summary written successfully.')
    } catch (error) {
      console.error('Failed to process job: ', error)
    }
  },
  {
    connection: redis, // Use the centralized Redis connection
  }
)

export default userSummaryWorker
