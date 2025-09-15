import { getChannel } from '../../config/rabbitmq.js'

const EXCHANGE = 'account' // topic exchange

async function assertTopicExchange(channel) {
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })
}

/**
 * Publish "account registered" event
 */
export async function publishAccountRegistered({
  email,
  username = 'friend',
  code,
}) {
  const channel = await getChannel()
  //   await channel.assertQueue(QUEUE, { durable: true })
  await assertTopicExchange(channel)

  const routingKey = 'account.registered'
  const payload = {
    email,
    username,
    code,
    timeStamp: new Date().toISOString(),
  }

  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  })
}

/**
 * Publish "password reset requested" event
 */
export async function publishPasswordResetRequested({ email, code }) {
  const channel = await getChannel()
  await assertTopicExchange(channel)

  const routingKey = 'account.password.reset.requested'
  const payload = { email, code, timeStamp: new Date().toISOString() }

  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    contenType: 'application/json',
    persistent: true,
  })

  console.log(
    `[RabbitMQ] published "password reset requested" message with payload`,
    payload
  )
}

/**
 * Publish "password changed" event
 */
export async function publishPasswordChanged({ email }) {
  const channel = await getChannel()
  await assertTopicExchange(channel)

  const routingKey = 'account.password.changed'
  const payload = { email, timeStamp: new Date().toISOString() }

  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    contentType: 'application/json',
    persistent: true,
  })

  console.log(
    `[RabbitMQ] published "password changed" message with payload`,
    payload
  )
}
