import { Router } from 'express'
import {
  register,
  resendVerification,
  verifyEmail,
} from '../controllers/auth.controller.js'

const router = Router()

router.get('/', (req, res) => {
  res.json('hello world')
})

router.post('/register', register)

router.post('/resend-verification', resendVerification)

router.post('/verify-email', verifyEmail)

export default router
