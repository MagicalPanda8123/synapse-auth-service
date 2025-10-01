import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import os from 'os'
import routes from './routes/index.js'
import prisma from './config/prisma.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

// 🔐 security middlewares
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'authorization', 'Content-Type'],
  })
)
app.use(helmet())
app.use(cookieParser())

// 🧰 built-in middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ❤️ health check route
app.get('/health', async (req, res) => {
  try {
    // check postgres
    await prisma.$queryRaw`SELECT 1`

    // other checks (Redis...)

    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage().rss,
      hostname: os.hostname(),
      timeStamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(503).json({ status: 'failed', error: error.message })
  }
})

// 🌐 api routes
app.use('/api', routes)

// ❌ error handler
app.use(errorHandler)

export default app
