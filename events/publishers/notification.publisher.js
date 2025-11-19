import { getChannel } from '../../config/rabbitmq.js'

export const EXCHANGE = 'notification' // topic exchange

export const NOTIFICATION_TYPES = Object.freeze({
  USER_BANNED: 'USER_BANNED',
  USER_UNBANNED: 'USER_UNBANNED',
  ROLE_CHANGED: 'ROLE_CHANGED',
})

/**
 * Publish a notification event to the notification topic exchange.
 * @param {string} routingKey - topic routing key (e.g. "notification" or "notification.create")
 * @param {object} payload - event payload (should be JSON-serializable)
 * @param {object} [opts] - optional publish options
 * @returns {boolean} true if publish succeeded (non-blocking)
 */
export async function publishNotificationEvent(routingKey, payload = {}, opts = {}) {
  const channel = await getChannel()
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })

  const key = routingKey || 'notification'
  const buffer = Buffer.from(JSON.stringify(payload))
  const publishOptions = { persistent: true, ...opts }

  const ok = channel.publish(EXCHANGE, key, buffer, publishOptions)
  if (ok) {
    console.log(`📤 Published notification event "${key}"`)
  } else {
    console.error(`❌ Failed to publish notification event "${key}"`)
  }
  return ok
}
