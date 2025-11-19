import amqp from 'amqplib'

let channel, connection
let shuttingDown = false

export async function getChannel() {
  while (!channel) {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost')
      connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error: ', err.message)
      })
      connection.on('close', () => {
        console.warn('[RabbitMQ] Connection closed. Reconnecting...')
        channel = null
        // Only reconnect on unexpected disconnects
        if (!shuttingDown) {
          setTimeout(getChannel, 10000) // reconnect after 10s
        } else {
          shuttingDown = false
        }
      })
      channel = await connection.createChannel()
      console.log('✅ [RabbitMQ] Connected and Channel created')
      return channel
    } catch (error) {
      console.error('[RabbitMQ] Failed to connect:', error.message)
      console.log('[RabbitMQ] Reconnect in 10s...')
      await new Promise((resolve) => setTimeout(resolve, 10000))
    }
  }
  return channel
}

export async function closeRabbit() {
  try {
    channel?.close()
    connection?.close()
    console.log(`[RabbitMQ] connection closed gracefully`)
  } catch (error) {
    console.error(`[RabbitMQ] Error closing connection : ${error.message}`)
  } finally {
    channel = null
    connection = null
  }
}
