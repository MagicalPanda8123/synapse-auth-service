import { Router } from 'express'
import {
  loginController,
  refreshController,
  register,
  resendVerification,
  serveJWKS,
  verifyEmail,
} from '../controllers/auth.controller.js'

const router = Router()

router.get('/', (req, res) => {
  res.json('hello world')
})

router.post('/register', register)

router.post('/resend-verification', resendVerification)

router.post('/verify-email', verifyEmail)

router.get('/jwks.json', serveJWKS)

router.post('/login', loginController)

router.post('/refresh', refreshController)

export default router
