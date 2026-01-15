import cron from 'node-cron'
import userSummaryQueue from '../queues/userSummary.queue.js'

const cronExpression = '* * * * *' // every minute
// const cronExpression = '0 0 * * *' // every 00:00 every day

// Schedule the job to run daily at midnight
cron.schedule(cronExpression, async () => {
  try {
    // const jobId = `dailyUserSummary-${new Date().toISOString().split('T')[0]}` // Unique jobId for the day

    const now = new Date() // Define the `now` variable
    const jobId = `testUserSummary-${now.toISOString().split('T')[0]}-${now.getHours()}-${now.getMinutes()}` // Unique jobId for each minute

    console.log(`Adding daily user summary job to the queue with jobId: ${jobId}`)

    await userSummaryQueue.add(
      'generateSummary', // Job name
      {}, // Job data
      { jobId } // Unique jobId to prevent duplicates
    )
  } catch (error) {
    console.error('Failed to add job the the queue : ', error)
  }
})

console.log('✅ User summary scheduler started and waiting for cron jobs...')

// Keep Node running
process.stdin.resume()
