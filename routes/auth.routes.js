import { Router } from 'express'
import { authMiddleware } from '../middleware/index.js'
import {
  changePassWordController,
  loginController,
  logoutController,
  refreshController,
  register,
  requestPasswordResetController,
  resendVerification,
  serveJWKS,
  setNewPasswordController,
  verifyEmail,
  verifyPasswordResetCodeController,
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

router.post('/logout', logoutController)

router.post('/change-password', authMiddleware, changePassWordController)

router.post('/request-password-reset', requestPasswordResetController)

router.post('/verify-reset-code', verifyPasswordResetCodeController)

router.post('/set-new-password', authMiddleware, setNewPasswordController)

export default router
