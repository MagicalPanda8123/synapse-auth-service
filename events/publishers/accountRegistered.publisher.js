import { getChannel } from '../../config/rabbitmq.js'

const QUEUE = 'account.registered.email'
const EVENT = 'account.registered'

export async function publishAccountRegistered({
  email,
  username = 'friend',
  code,
}) {
  const channel = await getChannel()
  await channel.assertQueue(QUEUE, { durable: true })
  const payload = {
    email,
    username,
    code,
    event: EVENT,
    timeStamp: new Date().toISOString(),
  }
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  })
}
