import amqp from 'amqplib'

let channel, connection
let shuttingDown = false

export async function getChannel() {
  if (channel) return channel

  try {
    connection = await amqp.connect(
      process.env.RABBITMQ_URL ||
        'amqp://localhostamqp://guest:guest@localhost:5672'
    )

    connection.on('error', (err) => {
      console.error('[RabbitMQ] Connection error: ', err.message)
    })

    connection.on('close', () => {
      channel = null
      // Only reconnect on unexpected disconnects
      if (!shuttingDown) {
        console.warn('[RabbitMQ] Connection closed. Reconnecting...')
        setTimeout(getChannel, 10000) // reconnect after 10s
      } else {
        shuttingDown = false
      }
    })

    channel = await connection.createChannel()
    console.log('[RabbitMQ] Connected and Channel created')

    return channel
  } catch (error) {
    console.error('[RabbitMQ] Failed to connect:', error.message)
    setTimeout(getChannel, 10000)
  }
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
