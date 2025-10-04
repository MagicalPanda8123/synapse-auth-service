import 'dotenv/config'
import app from './app.js'
import { getChannel } from './config/rabbitmq.js'
import prisma from './config/prisma.js'
import { startUserConsumer } from './events/consumers/user.consumer.js'

const PORT = process.env.PORT || 5000

async function bootstrap() {
  try {
    // Check RabbitMQ connection
    await getChannel()
    // console.log('✅ RabbitMQ connection established')

    // Check DB connection
    await prisma.$connect()
    console.log('✅ Database connection established')

    await startUserConsumer()

    app.listen(PORT, () => {
      console.log(`🔐 Auth service running on port ${PORT} (${process.env.NODE_ENV})`)
    })
  } catch (err) {
    console.error('❌ Failed to initialize dependencies:', err)
    process.exit(1)
  }
}

bootstrap()
