import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import helmet from 'helmet'
import os from 'os'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

// 🔐 security middlewares
app.use(helmet())
app.use(cors({ origin: '*' })) // adjust for production

// 🧰 built-in middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ❤️ health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
    hostname: os.hostname(),
    timeStamp: new Date().toISOString(),
  })
})

// 🌐 api routes
app.use('/api', routes)

// ❌ error handler
app.use(errorHandler)

export default app
