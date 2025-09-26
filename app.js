import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import os from 'os'
import routes from './routes/index.js'
import prisma from './config/prisma.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.1.7:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// 🔐 security middlewares
app.use(helmet())
app.use(cors({ origin: 'http://localhost:3000', credentials: true })) // adjust for production

// 🧰 built-in middlewares
app.use(cookieParser())
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
      timeStamp: new Date().toISOString()
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
