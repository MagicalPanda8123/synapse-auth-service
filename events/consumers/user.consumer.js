import { getChannel } from '../../config/rabbitmq.js'
import { updateUsernameForUser } from '../../services/auth.service.js'

const EXCHANGE = 'user'
const QUEUE = 'auth.user.username.changed'
const ROUTING_KEY = 'user.username.changed'

export async function startUserConsumer() {
  const channel = await getChannel()
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })
  await channel.assertQueue(QUEUE, { durable: true })
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY)
  await channel.prefetch(1)

  channel.consume(QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const event = JSON.parse(msg.content.toString())
        const { userId, newUsername } = event

        await updateUsernameForUser(userId, newUsername)
        console.log(`✅ Updated username for userId=${userId} to "${newUsername}" in account`)
        channel.ack(msg)
      } catch (error) {
        console.error('❌ Failed to process username changed event:', err)
        channel.nack(msg, false, true) // Optionally requeue: set third arg to true
      }
    }
  })

  console.log(`👂 [RabbitMQ] Listening for username change events on queue "${QUEUE}"`)
}
